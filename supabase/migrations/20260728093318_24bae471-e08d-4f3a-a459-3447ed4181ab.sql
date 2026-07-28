-- 1. subscriptions: remove overly permissive policy scoped to authenticated
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. password_reset_codes: scope service-only policy to service_role
DROP POLICY IF EXISTS "Only service role can access reset codes" ON public.password_reset_codes;

CREATE POLICY "Only service role can access reset codes"
ON public.password_reset_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. email_verification_tokens: scope service-only policy to service_role
DROP POLICY IF EXISTS "Service role can manage tokens" ON public.email_verification_tokens;

CREATE POLICY "Service role can manage tokens"
ON public.email_verification_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);