-- Agregar columna reset_token a vault_reset_requests
ALTER TABLE vault_reset_requests 
ADD COLUMN reset_token TEXT;

-- Agregar índice para búsquedas rápidas
CREATE INDEX idx_vault_reset_requests_reset_token ON vault_reset_requests(reset_token);

-- Agregar comentario
COMMENT ON COLUMN vault_reset_requests.reset_token IS 'JWT token temporal para permitir el reseteo de contraseña (válido 30 minutos)';