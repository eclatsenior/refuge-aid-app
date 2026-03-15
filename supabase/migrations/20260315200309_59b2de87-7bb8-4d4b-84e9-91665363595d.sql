CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_profile RECORD;
  has_lead_sub BOOLEAN;
  has_individual_sub BOOLEAN;
BEGIN
  -- Obtener perfil del usuario
  SELECT role INTO user_profile
  FROM profiles
  WHERE user_id = user_id_param;

  -- Si no existe el perfil, no tiene acceso
  IF user_profile IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Refugi Leads mantienen acceso según lógica actual
  IF user_profile.role = 'refugi_lead' THEN
    RETURN TRUE;
  END IF;

  -- Empleados asignados a una empresa (Lead) con suscripción activa
  -- Nota: no dependemos de managed_by_lead para evitar falsos negativos
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

  -- Verificar suscripción individual activa
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
$function$;