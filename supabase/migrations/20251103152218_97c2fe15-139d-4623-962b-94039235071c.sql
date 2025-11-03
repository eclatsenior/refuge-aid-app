-- Tabla para almacenar códigos de reset temporales
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por email
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email 
  ON password_reset_codes(email);

-- Índice para búsqueda rápida por expiración
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires 
  ON password_reset_codes(expires_at);

-- RLS: Solo service role puede acceder (edge functions)
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Función para limpiar códigos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM password_reset_codes 
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;