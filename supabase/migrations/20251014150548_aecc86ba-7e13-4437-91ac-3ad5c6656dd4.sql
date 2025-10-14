-- ============================================
-- PAYWALL: Sistema de suscripciones individuales
-- ============================================

-- PASO 1: Agregar columna managed_by_lead a profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS managed_by_lead BOOLEAN DEFAULT FALSE;

-- Marcar empleados existentes que están asignados a un Lead
UPDATE public.profiles p
SET managed_by_lead = TRUE
WHERE p.role = 'employee'
  AND EXISTS (
    SELECT 1 FROM employee_assignments ea
    WHERE ea.employee_id = p.user_id
  );

COMMENT ON COLUMN public.profiles.managed_by_lead IS 
'Indica si este empleado está gestionado por un Refugi Lead (no necesita pagar)';

-- ============================================
-- PASO 2: Función para verificar acceso activo
-- ============================================
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  has_lead_sub BOOLEAN;
  has_individual_sub BOOLEAN;
BEGIN
  -- Obtener perfil del usuario
  SELECT role, managed_by_lead INTO user_profile
  FROM profiles
  WHERE user_id = user_id_param;
  
  -- Si no existe el perfil, no tiene acceso
  IF user_profile IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Refugi Leads siempre tienen acceso (gestionan su propia suscripción)
  IF user_profile.role = 'refugi_lead' THEN
    RETURN TRUE;
  END IF;
  
  -- Si es empleado gestionado por un Lead
  IF user_profile.managed_by_lead = TRUE THEN
    -- Verificar que el Lead tenga suscripción activa
    SELECT EXISTS(
      SELECT 1
      FROM employee_assignments ea
      JOIN subscriptions s ON s.refugi_lead_id = ea.refugi_lead_id
      WHERE ea.employee_id = user_id_param
        AND s.status = 'active'
        AND s.current_period_end > NOW()
    ) INTO has_lead_sub;
    
    IF has_lead_sub THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Verificar si tiene suscripción individual activa
  SELECT EXISTS(
    SELECT 1
    FROM subscriptions s
    WHERE s.refugi_lead_id = user_id_param
      AND s.status = 'active'
      AND s.current_period_end > NOW()
      AND s.product_id = 'prod_TD9UdEM6XDdBZT'
  ) INTO has_individual_sub;
  
  RETURN has_individual_sub;
END;
$$;

COMMENT ON FUNCTION public.has_active_subscription IS 
'Verifica si un usuario tiene acceso activo (por Lead o suscripción individual)';

-- ============================================
-- PASO 3: Trigger para mantener managed_by_lead
-- ============================================
CREATE OR REPLACE FUNCTION public.update_employee_managed_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Cuando se asigna un empleado a un Lead, marcarlo como gestionado
    UPDATE profiles
    SET managed_by_lead = TRUE
    WHERE user_id = NEW.employee_id;
    
    RAISE NOTICE 'Employee % marked as managed', NEW.employee_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Solo desmarcar si no tiene otras asignaciones
    UPDATE profiles
    SET managed_by_lead = FALSE
    WHERE user_id = OLD.employee_id
      AND NOT EXISTS (
        SELECT 1 FROM employee_assignments
        WHERE employee_id = OLD.employee_id
          AND id != OLD.id
      );
      
    RAISE NOTICE 'Employee % unmarked as managed', OLD.employee_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS manage_employee_assignments_status ON employee_assignments;

-- Crear nuevo trigger
CREATE TRIGGER manage_employee_assignments_status
AFTER INSERT OR DELETE ON employee_assignments
FOR EACH ROW
EXECUTE FUNCTION update_employee_managed_status();

COMMENT ON TRIGGER manage_employee_assignments_status ON employee_assignments IS 
'Actualiza automáticamente el campo managed_by_lead cuando se crean/eliminan asignaciones';