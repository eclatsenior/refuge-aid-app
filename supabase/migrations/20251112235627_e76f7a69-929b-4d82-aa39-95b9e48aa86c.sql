-- Populate incidents from existing emergency_alerts
INSERT INTO public.incidents (
  employee_id,
  type,
  status,
  opened_at,
  closed_at,
  sla_target_mins,
  sla_breached_bool,
  notes,
  created_at,
  updated_at
)
SELECT 
  ea.employee_id,
  ea.alert_type,
  CASE 
    WHEN ea.is_resolved THEN 'closed'
    WHEN ea.resolved_by IS NOT NULL THEN 'in_progress'
    ELSE 'open'
  END as status,
  ea.created_at as opened_at,
  ea.resolved_at as closed_at,
  240 as sla_target_mins,
  CASE 
    WHEN ea.resolved_at IS NOT NULL 
    THEN (EXTRACT(EPOCH FROM (ea.resolved_at - ea.created_at)) / 60) > 240
    ELSE false
  END as sla_breached_bool,
  ea.message as notes,
  ea.created_at,
  NOW() as updated_at
FROM public.emergency_alerts ea
WHERE NOT EXISTS (
  SELECT 1 FROM public.incidents i 
  WHERE i.employee_id = ea.employee_id 
    AND i.opened_at = ea.created_at
);

-- Create function to auto-generate incident when emergency_alert is created
CREATE OR REPLACE FUNCTION public.auto_create_incident_from_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.incidents (
    employee_id,
    type,
    status,
    opened_at,
    sla_target_mins,
    notes
  )
  VALUES (
    NEW.employee_id,
    NEW.alert_type,
    'open',
    NEW.created_at,
    240,
    NEW.message
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating incidents
DROP TRIGGER IF EXISTS trigger_create_incident_on_alert ON public.emergency_alerts;
CREATE TRIGGER trigger_create_incident_on_alert
AFTER INSERT ON public.emergency_alerts
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_incident_from_alert();

COMMENT ON FUNCTION public.auto_create_incident_from_alert IS 'Automatically creates an incident when an emergency alert is recorded';