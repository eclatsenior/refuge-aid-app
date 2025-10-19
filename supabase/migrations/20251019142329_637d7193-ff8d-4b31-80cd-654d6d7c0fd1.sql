-- Add company fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_role TEXT;

-- Update handle_new_user function to extract company data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    role,
    company_name,
    company_website,
    company_role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee'),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'company_website',
    NEW.raw_user_meta_data->>'company_role'
  );
  
  -- Create initial employee status if role is employee
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee') = 'employee' THEN
    INSERT INTO public.employee_status (employee_id, mood_level, therapy_progress)
    VALUES (NEW.id, NULL, 0);
  END IF;
  
  RETURN NEW;
END;
$$;