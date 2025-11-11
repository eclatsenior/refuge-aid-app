-- Drop and recreate get_dashboard_kpis with enhanced logic
DROP FUNCTION IF EXISTS public.get_dashboard_kpis(jsonb);

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(scope_filter jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  avg_risk_score NUMERIC;
  sos_count INTEGER;
  inactive_count INTEGER;
  total_employees INTEGER;
  activity_penalty NUMERIC;
BEGIN
  -- Contar empleadas totales
  SELECT COUNT(*) INTO total_employees 
  FROM profiles 
  WHERE role = 'employee';

  -- Calcular promedio de risk scores
  SELECT COALESCE(AVG(score_int), 0) INTO avg_risk_score
  FROM risk_scores
  WHERE calculated_at >= now() - interval '1 day';

  -- Contar alertas SOS recientes (últimos 7 días)
  SELECT COUNT(*) INTO sos_count
  FROM emergency_alerts
  WHERE created_at >= now() - interval '7 days';

  -- Contar empleadas inactivas (sin sesiones en últimos 3 días)
  SELECT COUNT(*) INTO inactive_count
  FROM profiles p
  WHERE p.role = 'employee'
    AND NOT EXISTS (
      SELECT 1 FROM app_sessions s
      WHERE s.employee_id = p.user_id
        AND s.started_at >= now() - interval '3 days'
    );

  -- Calcular penalización por inactividad
  activity_penalty := CASE 
    WHEN total_employees > 0 
    THEN (inactive_count::FLOAT / total_employees * 100) * 0.2
    ELSE 0 
  END;

  -- Construir resultado con nueva lógica de Riesgo Activo
  SELECT jsonb_build_object(
    'active_risk', jsonb_build_object(
      'score', LEAST(
        (avg_risk_score * 0.5) + 
        (sos_count * 10 * 0.3) + 
        activity_penalty,
        100
      ),
      'trend_7d', COALESCE(
        (SELECT AVG(score_int) FROM risk_scores WHERE calculated_at >= now() - interval '7 days') -
        (SELECT AVG(score_int) FROM risk_scores WHERE calculated_at >= now() - interval '14 days' AND calculated_at < now() - interval '7 days'),
        0
      ),
      'trend_30d', COALESCE(
        (SELECT AVG(score_int) FROM risk_scores WHERE calculated_at >= now() - interval '30 days'),
        0
      )
    ),
    -- Incidentes ahora cuentan emergency_alerts en lugar de incidents
    'incidents_today', (
      SELECT COUNT(*) FROM emergency_alerts WHERE created_at::DATE = CURRENT_DATE
    ),
    'incidents_week', (
      SELECT COUNT(*) FROM emergency_alerts WHERE created_at >= now() - interval '7 days'
    ),
    'incidents_open', (
      SELECT COUNT(*) FROM emergency_alerts WHERE NOT is_resolved
    ),
    'incidents_in_progress', (
      SELECT COUNT(*) FROM emergency_alerts WHERE is_resolved = false AND resolved_by IS NOT NULL
    ),
    'incidents_closed', (
      SELECT COUNT(*) FROM emergency_alerts WHERE is_resolved AND resolved_at >= now() - interval '7 days'
    ),
    'avg_mood', (
      SELECT COALESCE(AVG(mood_level), 0)
      FROM mood_check_ins
      WHERE created_at >= now() - interval '24 hours'
    ),
    'checkins_count', (
      SELECT COUNT(*) FROM mood_check_ins WHERE created_at >= now() - interval '7 days'
    ),
    -- Formación ahora cuenta desde video_progress
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
$$;