-- Create table for custom email verification tokens
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON public.email_verification_tokens(user_id);

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can manage tokens (no public access)
CREATE POLICY "Service role can manage tokens" ON public.email_verification_tokens
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.email_verification_tokens IS 'Stores custom email verification tokens with 24h expiration';