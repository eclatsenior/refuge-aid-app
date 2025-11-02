-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to call auto-assign-basic-plan edge function
CREATE OR REPLACE FUNCTION public.trigger_auto_assign_basic_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  function_url TEXT;
  request_id BIGINT;
BEGIN
  -- Only trigger for refugi_lead role
  IF NEW.role = 'refugi_lead' THEN
    -- Get Supabase URL from environment
    supabase_url := current_setting('app.settings.supabase_url', true);
    
    -- If not set, use the project URL directly
    IF supabase_url IS NULL OR supabase_url = '' THEN
      supabase_url := 'https://npmyobeqbipvvuaeswnu.supabase.co';
    END IF;
    
    function_url := supabase_url || '/functions/v1/auto-assign-basic-plan';
    
    -- Make async HTTP POST request to edge function
    SELECT net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id::text
      ),
      timeout_milliseconds := 5000
    ) INTO request_id;
    
    RAISE NOTICE 'Auto-assign basic plan triggered for user % with request_id %', NEW.user_id, request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_refugi_lead_created ON public.profiles;

CREATE TRIGGER on_refugi_lead_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_assign_basic_plan();

COMMENT ON FUNCTION public.trigger_auto_assign_basic_plan() IS 'Automatically assigns Basic Plan to new Refugi Lead users';
COMMENT ON TRIGGER on_refugi_lead_created ON public.profiles IS 'Triggers auto-assignment of Basic Plan when a new Refugi Lead is created';
