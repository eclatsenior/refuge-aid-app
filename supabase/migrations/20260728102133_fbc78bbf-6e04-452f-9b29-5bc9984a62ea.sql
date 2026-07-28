
CREATE OR REPLACE FUNCTION public.is_my_employee(_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_assignments ea
    WHERE ea.refugi_lead_id = auth.uid()
      AND ea.employee_id = _employee_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_my_employee(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_my_employee(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_employee(uuid) TO service_role;

-- cases
DROP POLICY IF EXISTS "RefugiLead can manage cases" ON public.cases;
CREATE POLICY "RefugiLead can manage assigned cases"
ON public.cases FOR ALL TO authenticated
USING (public.get_current_user_role() = 'refugi_lead' AND public.is_my_employee(employee_id))
WITH CHECK (public.get_current_user_role() = 'refugi_lead' AND public.is_my_employee(employee_id));

-- incidents
DROP POLICY IF EXISTS "RefugiLead can manage incidents" ON public.incidents;
CREATE POLICY "RefugiLead can manage assigned incidents"
ON public.incidents FOR ALL TO authenticated
USING (public.get_current_user_role() = 'refugi_lead' AND public.is_my_employee(employee_id))
WITH CHECK (public.get_current_user_role() = 'refugi_lead' AND public.is_my_employee(employee_id));

-- psych_referrals
DROP POLICY IF EXISTS "RefugiLead can manage referrals" ON public.psych_referrals;
CREATE POLICY "RefugiLead can manage assigned referrals"
ON public.psych_referrals FOR ALL TO authenticated
USING (public.get_current_user_role() = 'refugi_lead' AND public.is_my_employee(employee_id))
WITH CHECK (public.get_current_user_role() = 'refugi_lead' AND public.is_my_employee(employee_id));

-- risk_scores
DROP POLICY IF EXISTS "RefugiLead can view risk scores" ON public.risk_scores;
CREATE POLICY "RefugiLead can view assigned risk scores"
ON public.risk_scores FOR SELECT TO authenticated
USING (public.get_current_user_role() = 'refugi_lead' AND public.is_my_employee(employee_id));

-- hris_employees_sync
DROP POLICY IF EXISTS "RefugiLead can view HRIS data" ON public.hris_employees_sync;
CREATE POLICY "RefugiLead can view assigned HRIS data"
ON public.hris_employees_sync FOR SELECT TO authenticated
USING (public.get_current_user_role() = 'refugi_lead' AND employee_id IS NOT NULL AND public.is_my_employee(employee_id));

-- training_completions
DROP POLICY IF EXISTS "RefugiLead can view training" ON public.training_completions;
CREATE POLICY "RefugiLead can view assigned training"
ON public.training_completions FOR SELECT TO authenticated
USING (public.get_current_user_role() = 'refugi_lead' AND public.is_my_employee(employee_id));

-- reports
DROP POLICY IF EXISTS "RefugiLead can manage reports" ON public.reports;
CREATE POLICY "RefugiLead can manage own reports"
ON public.reports FOR ALL TO authenticated
USING (public.get_current_user_role() = 'refugi_lead' AND generated_by = auth.uid())
WITH CHECK (public.get_current_user_role() = 'refugi_lead' AND generated_by = auth.uid());

-- audit_logs
DROP POLICY IF EXISTS "RefugiLead can view audit logs" ON public.audit_logs;
CREATE POLICY "RefugiLead can view own scope audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (
  public.get_current_user_role() = 'refugi_lead'
  AND user_id IS NOT NULL
  AND (user_id = auth.uid() OR public.is_my_employee(user_id))
);
