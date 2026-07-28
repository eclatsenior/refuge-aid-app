-- 1) Fix privilege escalation: leads may only READ their assignments; writes go through service_role edge functions
DROP POLICY IF EXISTS "Refugi leads can manage their assignments" ON public.employee_assignments;
DROP POLICY IF EXISTS "Refugi leads can view their assignments" ON public.employee_assignments;

CREATE POLICY "Refugi leads can view their assignments"
ON public.employee_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = refugi_lead_id OR auth.uid() = employee_id);

CREATE POLICY "Service role manages assignments"
ON public.employee_assignments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.employee_assignments FROM authenticated;
GRANT SELECT ON public.employee_assignments TO authenticated;
GRANT ALL ON public.employee_assignments TO service_role;

-- 2) Lock down SECURITY DEFINER functions
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;

-- Server-only functions: also revoke from authenticated
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'cleanup_expired_reset_codes',
        'cleanup_expired_verification_codes',
        'handle_new_user',
        'trigger_auto_assign_basic_plan',
        'auto_create_incident_from_alert',
        'auto_update_risk_score',
        'update_employee_managed_status',
        'update_updated_at_column',
        'calculate_risk_score',
        'get_employee_data_with_profiles'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- Functions the app legitimately calls while signed in
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_assigned_refugi_lead(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_employee_average_mood_24h(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) TO authenticated, service_role;
