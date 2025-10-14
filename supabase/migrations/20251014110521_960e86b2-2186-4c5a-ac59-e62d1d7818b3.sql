-- Fix default mood_level values and last_check_in
-- This migration ensures no fake/default data is shown for new or existing employees

-- 1. Update the handle_new_user function to NOT set a default mood_level
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee')
  );
  
  -- Create initial employee status if role is employee
  -- CRITICAL: Set mood_level to NULL instead of a default value like 7
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee') = 'employee' THEN
    INSERT INTO public.employee_status (employee_id, mood_level, therapy_progress)
    VALUES (NEW.id, NULL, 0);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Drop the default value for last_check_in so it doesn't auto-populate with current timestamp
ALTER TABLE public.employee_status 
ALTER COLUMN last_check_in DROP DEFAULT;

-- 3. Backfill existing records: set mood_level to NULL where no actual mood check-ins exist
UPDATE public.employee_status es
SET mood_level = NULL
WHERE es.mood_level IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.mood_check_ins m 
    WHERE m.employee_id = es.employee_id
  );

-- 4. Backfill last_check_in: set to NULL for employees without check-ins and who are offline
UPDATE public.employee_status es
SET last_check_in = NULL
WHERE es.is_online = false
  AND NOT EXISTS (
    SELECT 1 FROM public.mood_check_ins m 
    WHERE m.employee_id = es.employee_id
  );