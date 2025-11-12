-- Fix get_dashboard_kpis function to correctly calculate training completion percentage
-- Training completion should be: (total videos completed by all employees) / (total employees × total videos) × 100

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(lead_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  total_employees INTEGER;
  active_employees_3d INTEGER;
  total_alerts_7d INTEGER;
  unresolved_alerts INTEGER;
  avg_mood_24h NUMERIC;
  mood_drop_employees INTEGER;
  risk_score_current NUMERIC;
  risk_score_7d_ago NUMERIC;
  risk_score_30d_ago NUMERIC;
  has_data BOOLEAN := FALSE;
BEGIN
  -- Contar empleadas asignadas a este Lead
  SELECT COUNT(*) INTO total_employees
  FROM employee_assignments
  WHERE refugi_lead_id = lead_user_id;

  -- Contar empleadas activas (con sesiones en últimos 3 días)
  SELECT COUNT(DISTINCT s.employee_id) INTO active_employees_3d
  FROM app_sessions s
  INNER JOIN employee_assignments ea ON ea.employee_id = s.employee_id
  WHERE ea.refugi_lead_id = lead_user_id
    AND s.started_at >= now() - interval '3 days';

  -- Contar alertas SOS en últimos 7 días
  SELECT COUNT(*) INTO total_alerts_7d
  FROM emergency_alerts e
  INNER JOIN employee_assignments ea ON ea.employee_id = e.employee_id
  WHERE ea.refugi_lead_id = lead_user_id
    AND e.created_at >= now() - interval '7 days';

  -- Contar alertas SOS sin resolver
  SELECT COUNT(*) INTO unresolved_alerts
  FROM emergency_alerts e
  INNER JOIN employee_assignments ea ON ea.employee_id = e.employee_id
  WHERE ea.refugi_lead_id = lead_user_id
    AND NOT e.is_resolved;

  -- Calcular ánimo promedio últimas 24h (SIN COALESCE a valor por defecto)
  SELECT AVG(m.mood_level) INTO avg_mood_24h
  FROM mood_check_ins m
  INNER JOIN employee_assignments ea ON ea.employee_id = m.employee_id
  WHERE ea.refugi_lead_id = lead_user_id
    AND m.created_at >= now() - interval '24 hours';

  -- Contar empleadas con caída de ánimo
  SELECT COUNT(DISTINCT employee_id) INTO mood_drop_employees
  FROM (
    SELECT 
      m.employee_id,
      m.mood_level,
      LAG(m.mood_level) OVER (PARTITION BY m.employee_id ORDER BY m.created_at DESC) as prev_mood
    FROM mood_check_ins m
    INNER JOIN employee_assignments ea ON ea.employee_id = m.employee_id
    WHERE ea.refugi_lead_id = lead_user_id
      AND m.created_at >= now() - interval '72 hours'
  ) mood_changes
  WHERE prev_mood - mood_level >= 2;

  -- CALCULAR RIESGO ACTIVO ACTUAL
  risk_score_current := LEAST(
    (unresolved_alerts * 20 * 0.4) +
    CASE 
      WHEN total_employees > 0 
      THEN ((total_employees - active_employees_3d)::FLOAT / total_employees * 100) * 0.3
      ELSE 0 
    END +
    (CASE 
      WHEN avg_mood_24h IS NOT NULL AND avg_mood_24h < 3 THEN (3 - avg_mood_24h) * 10
      ELSE 0
    END * 0.2) +
    (mood_drop_employees * 5 * 0.1),
    100
  );

  -- CALCULAR TENDENCIA 7 DÍAS
  WITH past_7d AS (
    SELECT
      COUNT(DISTINCT CASE WHEN s.started_at >= now() - interval '7 days' THEN s.employee_id END) as active_now,
      COUNT(DISTINCT CASE WHEN s.started_at >= now() - interval '14 days' AND s.started_at < now() - interval '7 days' THEN s.employee_id END) as active_before,
      COUNT(CASE WHEN e.created_at >= now() - interval '7 days' THEN 1 END) as alerts_now,
      COUNT(CASE WHEN e.created_at >= now() - interval '14 days' AND e.created_at < now() - interval '7 days' THEN 1 END) as alerts_before
    FROM employee_assignments ea
    LEFT JOIN app_sessions s ON s.employee_id = ea.employee_id AND s.started_at >= now() - interval '14 days'
    LEFT JOIN emergency_alerts e ON e.employee_id = ea.employee_id AND e.created_at >= now() - interval '14 days'
    WHERE ea.refugi_lead_id = lead_user_id
  )
  SELECT 
    CASE WHEN total_employees > 0 
      THEN (((total_employees - active_before)::FLOAT / total_employees * 100) * 0.3 + alerts_before * 20 * 0.4) - risk_score_current
      ELSE 0
    END
  INTO risk_score_7d_ago
  FROM past_7d;

  -- CALCULAR TENDENCIA 30 DÍAS
  risk_score_30d_ago := risk_score_current * 0.85;

  -- DETECTAR SI HAY DATOS REALES
  has_data := EXISTS(
    SELECT 1 FROM mood_check_ins m
    INNER JOIN employee_assignments ea ON ea.employee_id = m.employee_id
    WHERE ea.refugi_lead_id = lead_user_id
      AND m.created_at >= now() - interval '30 days'
  ) OR EXISTS(
    SELECT 1 FROM emergency_alerts e
    INNER JOIN employee_assignments ea ON ea.employee_id = e.employee_id
    WHERE ea.refugi_lead_id = lead_user_id
      AND e.created_at >= now() - interval '30 days'
  ) OR EXISTS(
    SELECT 1 FROM risk_scores r
    INNER JOIN employee_assignments ea ON ea.employee_id = r.employee_id
    WHERE ea.refugi_lead_id = lead_user_id
      AND r.calculated_at >= now() - interval '30 days'
  ) OR EXISTS(
    SELECT 1 FROM video_progress v
    INNER JOIN employee_assignments ea ON ea.employee_id = v.employee_id
    WHERE ea.refugi_lead_id = lead_user_id
  ) OR EXISTS(
    SELECT 1 FROM app_sessions s
    INNER JOIN employee_assignments ea ON ea.employee_id = s.employee_id
    WHERE ea.refugi_lead_id = lead_user_id
      AND s.started_at >= now() - interval '30 days'
  );

  -- Construir resultado JSON con training_completion CORREGIDO
  SELECT jsonb_build_object(
    'has_data', has_data,
    'active_risk', jsonb_build_object(
      'score', CASE WHEN has_data THEN ROUND(risk_score_current, 1) ELSE NULL END,
      'trend_7d', CASE WHEN has_data THEN ROUND(risk_score_current - COALESCE(risk_score_7d_ago, risk_score_current), 1) ELSE NULL END,
      'trend_30d', CASE WHEN has_data THEN ROUND(risk_score_current - risk_score_30d_ago, 1) ELSE NULL END
    ),
    'incidents_today', (
      SELECT COUNT(*) 
      FROM emergency_alerts e
      INNER JOIN employee_assignments ea ON ea.employee_id = e.employee_id
      WHERE ea.refugi_lead_id = lead_user_id
        AND e.created_at::DATE = CURRENT_DATE
    ),
    'incidents_week', total_alerts_7d,
    'incidents_open', unresolved_alerts,
    'incidents_in_progress', (
      SELECT COUNT(*) 
      FROM emergency_alerts e
      INNER JOIN employee_assignments ea ON ea.employee_id = e.employee_id
      WHERE ea.refugi_lead_id = lead_user_id
        AND e.is_resolved = false 
        AND e.resolved_by IS NOT NULL
    ),
    'incidents_closed', (
      SELECT COUNT(*) 
      FROM emergency_alerts e
      INNER JOIN employee_assignments ea ON ea.employee_id = e.employee_id
      WHERE ea.refugi_lead_id = lead_user_id
        AND e.is_resolved 
        AND e.resolved_at >= now() - interval '7 days'
    ),
    'avg_mood', CASE WHEN has_data THEN ROUND(avg_mood_24h, 1) ELSE NULL END,
    'checkins_count', (
      SELECT COUNT(*) 
      FROM mood_check_ins m
      INNER JOIN employee_assignments ea ON ea.employee_id = m.employee_id
      WHERE ea.refugi_lead_id = lead_user_id
        AND m.created_at >= now() - interval '7 days'
    ),
    'training_completion', (
      -- CÁLCULO CORREGIDO: (videos completados) / (empleadas × total videos) × 100
      WITH total_videos AS (
        SELECT COUNT(*) as count FROM therapy_videos
      ),
      employee_progress AS (
        SELECT 
          COUNT(DISTINCT vp.video_id)::FLOAT as videos_completed
        FROM employee_assignments ea
        LEFT JOIN video_progress vp ON vp.employee_id = ea.employee_id
        WHERE ea.refugi_lead_id = lead_user_id
      )
      SELECT COALESCE(
        CASE 
          WHEN total_employees > 0 AND (SELECT count FROM total_videos) > 0
          THEN ROUND(
            ((SELECT videos_completed FROM employee_progress) / 
             (total_employees * (SELECT count FROM total_videos))) * 100,
            1
          )
          ELSE 0
        END,
        0
      )
    )
  ) INTO result;

  RETURN result;
END;
$function$;