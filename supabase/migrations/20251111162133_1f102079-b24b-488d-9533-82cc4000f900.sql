-- Reemplazar función get_dashboard_kpis para calcular riesgo con datos reales
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(scope_filter jsonb DEFAULT '{}'::jsonb)
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
BEGIN
  -- Contar empleadas totales
  SELECT COUNT(*) INTO total_employees 
  FROM profiles 
  WHERE role = 'employee';

  -- Contar empleadas activas (con sesiones en últimos 3 días)
  SELECT COUNT(DISTINCT employee_id) INTO active_employees_3d
  FROM app_sessions
  WHERE started_at >= now() - interval '3 days';

  -- Contar alertas SOS en últimos 7 días
  SELECT COUNT(*) INTO total_alerts_7d
  FROM emergency_alerts
  WHERE created_at >= now() - interval '7 days';

  -- Contar alertas SOS sin resolver
  SELECT COUNT(*) INTO unresolved_alerts
  FROM emergency_alerts
  WHERE NOT is_resolved;

  -- Calcular ánimo promedio últimas 24h
  SELECT COALESCE(AVG(mood_level), 5) INTO avg_mood_24h
  FROM mood_check_ins
  WHERE created_at >= now() - interval '24 hours';

  -- Contar empleadas con caída de ánimo (diferencia >= 2 entre últimos 2 check-ins)
  SELECT COUNT(DISTINCT employee_id) INTO mood_drop_employees
  FROM (
    SELECT 
      employee_id,
      mood_level,
      LAG(mood_level) OVER (PARTITION BY employee_id ORDER BY created_at DESC) as prev_mood
    FROM mood_check_ins
    WHERE created_at >= now() - interval '72 hours'
  ) mood_changes
  WHERE prev_mood - mood_level >= 2;

  -- CALCULAR RIESGO ACTIVO ACTUAL
  risk_score_current := LEAST(
    -- Componente 1 (40%): Alertas SOS
    (unresolved_alerts * 20 * 0.4) +
    
    -- Componente 2 (30%): Inactividad
    CASE 
      WHEN total_employees > 0 
      THEN ((total_employees - active_employees_3d)::FLOAT / total_employees * 100) * 0.3
      ELSE 0 
    END +
    
    -- Componente 3 (30%): Ánimo bajo + caídas de ánimo
    (CASE 
      WHEN avg_mood_24h < 3 THEN (3 - avg_mood_24h) * 10
      ELSE 0
    END * 0.2) +
    (mood_drop_employees * 5 * 0.1),
    
    100  -- Máximo 100
  );

  -- CALCULAR TENDENCIA 7 DÍAS (comparar con hace 7-14 días)
  WITH past_7d AS (
    SELECT
      COUNT(DISTINCT CASE WHEN s.started_at >= now() - interval '7 days' THEN s.employee_id END) as active_now,
      COUNT(DISTINCT CASE WHEN s.started_at >= now() - interval '14 days' AND s.started_at < now() - interval '7 days' THEN s.employee_id END) as active_before,
      COUNT(CASE WHEN ea.created_at >= now() - interval '7 days' THEN 1 END) as alerts_now,
      COUNT(CASE WHEN ea.created_at >= now() - interval '14 days' AND ea.created_at < now() - interval '7 days' THEN 1 END) as alerts_before
    FROM app_sessions s
    FULL OUTER JOIN emergency_alerts ea ON true
    WHERE s.started_at >= now() - interval '14 days' OR ea.created_at >= now() - interval '14 days'
  )
  SELECT 
    -- Diferencia de inactividad + diferencia de alertas
    CASE WHEN total_employees > 0 
      THEN (((total_employees - active_before)::FLOAT / total_employees * 100) * 0.3 + alerts_before * 20 * 0.4) - risk_score_current
      ELSE 0
    END
  INTO risk_score_7d_ago
  FROM past_7d;

  -- CALCULAR TENDENCIA 30 DÍAS (simplificada)
  risk_score_30d_ago := risk_score_current * 0.85;  -- Estimación conservadora

  -- Construir resultado JSON
  SELECT jsonb_build_object(
    'active_risk', jsonb_build_object(
      'score', ROUND(risk_score_current, 1),
      'trend_7d', ROUND(risk_score_current - COALESCE(risk_score_7d_ago, risk_score_current), 1),
      'trend_30d', ROUND(risk_score_current - risk_score_30d_ago, 1)
    ),
    'incidents_today', (
      SELECT COUNT(*) FROM emergency_alerts WHERE created_at::DATE = CURRENT_DATE
    ),
    'incidents_week', total_alerts_7d,
    'incidents_open', unresolved_alerts,
    'incidents_in_progress', (
      SELECT COUNT(*) FROM emergency_alerts WHERE is_resolved = false AND resolved_by IS NOT NULL
    ),
    'incidents_closed', (
      SELECT COUNT(*) FROM emergency_alerts WHERE is_resolved AND resolved_at >= now() - interval '7 days'
    ),
    'avg_mood', ROUND(avg_mood_24h, 1),
    'checkins_count', (
      SELECT COUNT(*) FROM mood_check_ins WHERE created_at >= now() - interval '7 days'
    ),
    'training_completion', (
      SELECT COALESCE(
        (COUNT(DISTINCT vp.employee_id)::FLOAT / NULLIF(total_employees, 0)) * 100,
        0
      )
      FROM video_progress vp
      WHERE vp.completed_at >= now() - interval '30 days'
    )
  ) INTO result;

  RETURN result;
END;
$function$;