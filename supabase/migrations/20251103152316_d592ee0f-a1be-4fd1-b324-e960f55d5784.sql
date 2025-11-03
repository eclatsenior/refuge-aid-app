-- Policy explícita para password_reset_codes
-- Esta tabla solo debe ser accedida por edge functions con service role
-- Negamos todo acceso a usuarios normales
CREATE POLICY "Only service role can access reset codes"
ON password_reset_codes
FOR ALL
USING (false)
WITH CHECK (false);