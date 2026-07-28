ALTER TABLE public.vault_passwords
  ADD COLUMN IF NOT EXISTS data_key text;

-- data_key must never be readable by the client directly; only edge functions
-- (service_role) may read it after a successful password verification.
REVOKE SELECT (data_key) ON public.vault_passwords FROM authenticated, anon;