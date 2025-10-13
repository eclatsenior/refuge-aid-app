-- Enable REPLICA IDENTITY FULL to capture all changes in realtime
ALTER TABLE public.emergency_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.employee_status REPLICA IDENTITY FULL;