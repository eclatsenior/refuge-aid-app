
-- ============================================================
-- FIX 1: Convert ALL RESTRICTIVE RLS policies to PERMISSIVE
-- ============================================================

-- === app_sessions ===
DROP POLICY IF EXISTS "Employees can insert their own sessions" ON public.app_sessions;
CREATE POLICY "Employees can insert their own sessions" ON public.app_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Employees can view their own sessions" ON public.app_sessions;
CREATE POLICY "Employees can view their own sessions" ON public.app_sessions FOR SELECT TO authenticated USING (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Refugi leads can view assigned employees sessions" ON public.app_sessions;
CREATE POLICY "Refugi leads can view assigned employees sessions" ON public.app_sessions FOR SELECT TO authenticated USING ((get_current_user_role() = 'refugi_lead'::app_role) AND (employee_id IN (SELECT employee_id FROM employee_assignments WHERE refugi_lead_id = auth.uid())));

-- === audit_logs ===
DROP POLICY IF EXISTS "RefugiLead can view audit logs" ON public.audit_logs;
CREATE POLICY "RefugiLead can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'refugi_lead'::app_role));

-- === cases ===
DROP POLICY IF EXISTS "RefugiLead can manage cases" ON public.cases;
CREATE POLICY "RefugiLead can manage cases" ON public.cases FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'refugi_lead'::app_role));

-- === email_verification_codes ===
DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.email_verification_codes;
CREATE POLICY "Users can view their own verification codes" ON public.email_verification_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === email_verification_tokens ===
DROP POLICY IF EXISTS "Service role can manage tokens" ON public.email_verification_tokens;
CREATE POLICY "Service role can manage tokens" ON public.email_verification_tokens FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- === emergency_alerts ===
DROP POLICY IF EXISTS "Employees can create alerts" ON public.emergency_alerts;
CREATE POLICY "Employees can create alerts" ON public.emergency_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Employees can view their own alerts" ON public.emergency_alerts;
CREATE POLICY "Employees can view their own alerts" ON public.emergency_alerts FOR SELECT TO authenticated USING (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Refugi leads can view and manage all alerts" ON public.emergency_alerts;
CREATE POLICY "Refugi leads can view and manage all alerts" ON public.emergency_alerts FOR ALL TO authenticated USING (get_current_user_role() = 'refugi_lead'::app_role);

-- === employee_assignments ===
DROP POLICY IF EXISTS "Refugi leads can manage their assignments" ON public.employee_assignments;
CREATE POLICY "Refugi leads can manage their assignments" ON public.employee_assignments FOR ALL TO authenticated USING (auth.uid() = refugi_lead_id);

DROP POLICY IF EXISTS "Refugi leads can view their assignments" ON public.employee_assignments;
CREATE POLICY "Refugi leads can view their assignments" ON public.employee_assignments FOR SELECT TO authenticated USING (auth.uid() = refugi_lead_id);

-- === employee_status ===
DROP POLICY IF EXISTS "Employees can view and update their own status" ON public.employee_status;
CREATE POLICY "Employees can view and update their own status" ON public.employee_status FOR ALL TO authenticated USING (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Refugi leads can view all employee status" ON public.employee_status;
CREATE POLICY "Refugi leads can view all employee status" ON public.employee_status FOR SELECT TO authenticated USING (get_current_user_role() = 'refugi_lead'::app_role);

-- === feature_flags ===
DROP POLICY IF EXISTS "RefugiLead can read flags" ON public.feature_flags;
CREATE POLICY "RefugiLead can read flags" ON public.feature_flags FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'refugi_lead'::app_role));

-- === hris_employees_sync ===
DROP POLICY IF EXISTS "RefugiLead can view HRIS data" ON public.hris_employees_sync;
CREATE POLICY "RefugiLead can view HRIS data" ON public.hris_employees_sync FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'refugi_lead'::app_role));

-- === incidents ===
DROP POLICY IF EXISTS "RefugiLead can manage incidents" ON public.incidents;
CREATE POLICY "RefugiLead can manage incidents" ON public.incidents FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'refugi_lead'::app_role));

-- === internal_messages ===
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.internal_messages;
CREATE POLICY "Users can mark received messages as read" ON public.internal_messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages to assigned users" ON public.internal_messages;
CREATE POLICY "Users can send messages to assigned users" ON public.internal_messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id) AND can_send_message(sender_id, recipient_id));

DROP POLICY IF EXISTS "Users can view their own messages" ON public.internal_messages;
CREATE POLICY "Users can view their own messages" ON public.internal_messages FOR SELECT TO authenticated USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

-- === lead_settings ===
DROP POLICY IF EXISTS "Refugi Leads can manage their own settings" ON public.lead_settings;
CREATE POLICY "Refugi Leads can manage their own settings" ON public.lead_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === mood_check_ins ===
DROP POLICY IF EXISTS "Employees can insert their own check-ins" ON public.mood_check_ins;
CREATE POLICY "Employees can insert their own check-ins" ON public.mood_check_ins FOR INSERT TO authenticated WITH CHECK (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Employees can view their own check-ins" ON public.mood_check_ins;
CREATE POLICY "Employees can view their own check-ins" ON public.mood_check_ins FOR SELECT TO authenticated USING (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Refugi leads can view assigned employees check-ins" ON public.mood_check_ins;
CREATE POLICY "Refugi leads can view assigned employees check-ins" ON public.mood_check_ins FOR SELECT TO authenticated USING ((get_current_user_role() = 'refugi_lead'::app_role) AND (employee_id IN (SELECT employee_id FROM employee_assignments WHERE refugi_lead_id = auth.uid())));

-- === password_reset_codes ===
DROP POLICY IF EXISTS "Only service role can access reset codes" ON public.password_reset_codes;
CREATE POLICY "Only service role can access reset codes" ON public.password_reset_codes FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- === profiles (with privilege escalation fix) ===
DROP POLICY IF EXISTS "Employees can view assigned lead profile" ON public.profiles;
CREATE POLICY "Employees can view assigned lead profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR (EXISTS (SELECT 1 FROM employee_assignments WHERE employee_assignments.employee_id = auth.uid() AND employee_assignments.refugi_lead_id = profiles.user_id)));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND role = (SELECT p.role FROM profiles p WHERE p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === psych_referrals ===
DROP POLICY IF EXISTS "RefugiLead can manage referrals" ON public.psych_referrals;
CREATE POLICY "RefugiLead can manage referrals" ON public.psych_referrals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'refugi_lead'::app_role));

-- === reports ===
DROP POLICY IF EXISTS "RefugiLead can manage reports" ON public.reports;
CREATE POLICY "RefugiLead can manage reports" ON public.reports FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'refugi_lead'::app_role));

-- === risk_scores ===
DROP POLICY IF EXISTS "RefugiLead can view risk scores" ON public.risk_scores;
CREATE POLICY "RefugiLead can view risk scores" ON public.risk_scores FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'refugi_lead'::app_role));

-- === subscriptions ===
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (refugi_lead_id = auth.uid());

-- === super_admins ===
DROP POLICY IF EXISTS "Super admins can view own record" ON public.super_admins;
CREATE POLICY "Super admins can view own record" ON public.super_admins FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === therapy_modules ===
DROP POLICY IF EXISTS "Authenticated users can view therapy modules" ON public.therapy_modules;
CREATE POLICY "Authenticated users can view therapy modules" ON public.therapy_modules FOR SELECT TO authenticated USING (true);

-- === therapy_routes ===
DROP POLICY IF EXISTS "Authenticated users can view therapy routes" ON public.therapy_routes;
CREATE POLICY "Authenticated users can view therapy routes" ON public.therapy_routes FOR SELECT TO authenticated USING (true);

-- === therapy_videos ===
DROP POLICY IF EXISTS "Authenticated users can manage therapy videos" ON public.therapy_videos;
CREATE POLICY "Authenticated users can manage therapy videos" ON public.therapy_videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view therapy videos metadata" ON public.therapy_videos;
CREATE POLICY "Authenticated users can view therapy videos metadata" ON public.therapy_videos FOR SELECT TO authenticated USING (true);

-- === training_completions ===
DROP POLICY IF EXISTS "RefugiLead can view training" ON public.training_completions;
CREATE POLICY "RefugiLead can view training" ON public.training_completions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'refugi_lead'::app_role));

-- === vault_passwords ===
DROP POLICY IF EXISTS "Users can create their own vault password once" ON public.vault_passwords;
CREATE POLICY "Users can create their own vault password once" ON public.vault_passwords FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (NOT (EXISTS (SELECT 1 FROM vault_passwords vp WHERE vp.user_id = auth.uid()))));

DROP POLICY IF EXISTS "Users can update their own vault password" ON public.vault_passwords;
CREATE POLICY "Users can update their own vault password" ON public.vault_passwords FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own vault password" ON public.vault_passwords;
CREATE POLICY "Users can view their own vault password" ON public.vault_passwords FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === vault_reset_requests ===
DROP POLICY IF EXISTS "Refugi leads can update reset requests of their employees" ON public.vault_reset_requests;
CREATE POLICY "Refugi leads can update reset requests of their employees" ON public.vault_reset_requests FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT refugi_lead_id FROM employee_assignments WHERE employee_id = vault_reset_requests.user_id));

DROP POLICY IF EXISTS "Users can create their own reset requests" ON public.vault_reset_requests;
CREATE POLICY "Users can create their own reset requests" ON public.vault_reset_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own reset requests" ON public.vault_reset_requests;
CREATE POLICY "Users can view their own reset requests" ON public.vault_reset_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR (auth.uid() IN (SELECT refugi_lead_id FROM employee_assignments WHERE employee_id = vault_reset_requests.user_id)));

-- === video_progress ===
DROP POLICY IF EXISTS "Employees can insert their own progress" ON public.video_progress;
CREATE POLICY "Employees can insert their own progress" ON public.video_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Employees can view their own progress" ON public.video_progress;
CREATE POLICY "Employees can view their own progress" ON public.video_progress FOR SELECT TO authenticated USING (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Refugi leads can view assigned employees progress" ON public.video_progress;
CREATE POLICY "Refugi leads can view assigned employees progress" ON public.video_progress FOR SELECT TO authenticated USING ((get_current_user_role() = 'refugi_lead'::app_role) AND (employee_id IN (SELECT employee_id FROM employee_assignments WHERE refugi_lead_id = auth.uid())));
