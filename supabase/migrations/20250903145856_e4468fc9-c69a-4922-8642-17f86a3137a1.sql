-- Enable realtime for employee_status and emergency_alerts tables
ALTER TABLE public.employee_status REPLICA IDENTITY FULL;
ALTER TABLE public.emergency_alerts REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;