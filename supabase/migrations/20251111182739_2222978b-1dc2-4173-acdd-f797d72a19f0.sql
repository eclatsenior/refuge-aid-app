-- Crear tabla para códigos de verificación de email
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON email_verification_codes(code);

-- Habilitar RLS
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver sus propios códigos (aunque no lo necesitarán desde el cliente)
CREATE POLICY "Users can view their own verification codes"
  ON email_verification_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Función de limpieza automática de códigos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM email_verification_codes 
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;