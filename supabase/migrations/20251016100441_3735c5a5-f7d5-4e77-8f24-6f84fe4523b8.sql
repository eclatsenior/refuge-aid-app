-- Ampliar tabla profiles con campos adicionales para perfil completo
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'es',
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS emergency_contact_1_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_1_phone text,
ADD COLUMN IF NOT EXISTS emergency_contact_2_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_2_phone text;

-- Crear índice para búsquedas por idioma
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(preferred_language);

-- Añadir constraint para validar idiomas soportados
ALTER TABLE profiles ADD CONSTRAINT valid_language 
CHECK (preferred_language IN ('es', 'ca', 'en', 'ar'));

-- Política RLS: Empleadas pueden ver el perfil de su Refugi Lead asignado
CREATE POLICY "Employees can view assigned lead profile"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM employee_assignments
    WHERE employee_id = auth.uid() AND refugi_lead_id = profiles.user_id
  )
);

-- Función helper para obtener el lead asignado a una empleada
CREATE OR REPLACE FUNCTION public.get_assigned_refugi_lead(emp_id uuid)
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  phone text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.email, p.full_name, p.phone, p.avatar_url
  FROM profiles p
  INNER JOIN employee_assignments ea ON p.user_id = ea.refugi_lead_id
  WHERE ea.employee_id = emp_id
  LIMIT 1;
$$;