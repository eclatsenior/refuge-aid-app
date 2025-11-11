-- Verificar manualmente el usuario de prueba
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'faustopadilla35+test91@gmail.com' 
  AND email_confirmed_at IS NULL;