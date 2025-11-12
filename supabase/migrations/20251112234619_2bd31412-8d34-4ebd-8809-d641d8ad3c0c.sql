-- Add unique constraint to risk_scores for upserts
ALTER TABLE public.risk_scores
DROP CONSTRAINT IF EXISTS risk_scores_employee_id_key;

ALTER TABLE public.risk_scores
ADD CONSTRAINT risk_scores_employee_id_key UNIQUE (employee_id);

-- Function to automatically update risk score when data changes
CREATE OR REPLACE FUNCTION public.auto_update_risk_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID;
  v_risk_data RECORD;
BEGIN
  -- Determine employee_id based on which table triggered
  IF TG_TABLE_NAME = 'mood_check_ins' THEN
    v_employee_id := NEW.employee_id;
  ELSIF TG_TABLE_NAME = 'emergency_alerts' THEN
    v_employee_id := NEW.employee_id;
  ELSIF TG_TABLE_NAME = 'video_progress' THEN
    v_employee_id := NEW.employee_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Calculate risk score using existing function
  SELECT * INTO v_risk_data
  FROM public.calculate_risk_score(v_employee_id)
  LIMIT 1;

  -- Upsert the risk score
  INSERT INTO public.risk_scores (
    employee_id,
    score_int,
    explain_chips,
    trend_7d,
    trend_30d,
    calculated_at
  )
  VALUES (
    v_employee_id,
    v_risk_data.score,
    v_risk_data.chips,
    v_risk_data.trend_7d,
    v_risk_data.trend_30d,
    NOW()
  )
  ON CONFLICT (employee_id)
  DO UPDATE SET
    score_int = EXCLUDED.score_int,
    explain_chips = EXCLUDED.explain_chips,
    trend_7d = EXCLUDED.trend_7d,
    trend_30d = EXCLUDED.trend_30d,
    calculated_at = NOW();

  RAISE NOTICE 'Risk score updated for employee %', v_employee_id;

  RETURN NEW;
END;
$$;

-- Trigger for mood_check_ins
DROP TRIGGER IF EXISTS trigger_update_risk_on_mood ON public.mood_check_ins;
CREATE TRIGGER trigger_update_risk_on_mood
AFTER INSERT ON public.mood_check_ins
FOR EACH ROW
EXECUTE FUNCTION public.auto_update_risk_score();

-- Trigger for emergency_alerts
DROP TRIGGER IF EXISTS trigger_update_risk_on_alert ON public.emergency_alerts;
CREATE TRIGGER trigger_update_risk_on_alert
AFTER INSERT ON public.emergency_alerts
FOR EACH ROW
EXECUTE FUNCTION public.auto_update_risk_score();

-- Trigger for video_progress
DROP TRIGGER IF EXISTS trigger_update_risk_on_video ON public.video_progress;
CREATE TRIGGER trigger_update_risk_on_video
AFTER INSERT ON public.video_progress
FOR EACH ROW
EXECUTE FUNCTION public.auto_update_risk_score();

COMMENT ON FUNCTION public.auto_update_risk_score IS 'Automatically updates risk scores when mood check-ins, alerts, or video progress are recorded';