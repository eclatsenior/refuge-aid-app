-- Create function to get employee data with profiles
CREATE OR REPLACE FUNCTION public.get_employee_data_with_profiles(employee_ids uuid[])
RETURNS TABLE (
  id uuid,
  employee_id uuid,
  mood_level integer,
  therapy_progress integer,
  is_online boolean,
  last_check_in timestamptz,
  emergency_alert boolean,
  created_at timestamptz,
  updated_at timestamptz,
  full_name text,
  email text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    es.id,
    es.employee_id,
    es.mood_level,
    es.therapy_progress,
    es.is_online,
    es.last_check_in,
    es.emergency_alert,
    es.created_at,
    es.updated_at,
    p.full_name,
    p.email
  FROM employee_status es
  LEFT JOIN profiles p ON es.employee_id = p.user_id
  WHERE es.employee_id = ANY(employee_ids);
$$;