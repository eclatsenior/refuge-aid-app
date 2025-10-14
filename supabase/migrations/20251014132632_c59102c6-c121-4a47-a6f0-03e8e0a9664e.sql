-- Drop and recreate the get_employee_data_with_profiles function to include phone
DROP FUNCTION IF EXISTS public.get_employee_data_with_profiles(uuid[]);

CREATE OR REPLACE FUNCTION public.get_employee_data_with_profiles(employee_ids uuid[])
 RETURNS TABLE(
   id uuid, 
   employee_id uuid, 
   mood_level integer, 
   therapy_progress integer, 
   is_online boolean, 
   last_check_in timestamp with time zone, 
   emergency_alert boolean, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   full_name text, 
   email text,
   phone text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    p.email,
    p.phone
  FROM employee_status es
  LEFT JOIN profiles p ON es.employee_id = p.user_id
  WHERE es.employee_id = ANY(employee_ids);
$function$;
