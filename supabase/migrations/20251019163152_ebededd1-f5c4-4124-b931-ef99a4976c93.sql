-- Asignar suscripción del Plan Empresarial al usuario info@eclatsenior.com

-- Primero verificamos que el usuario existe
DO $$
DECLARE
  v_user_id uuid;
  v_stripe_customer_id text;
BEGIN
  -- Obtener el user_id del usuario
  SELECT user_id INTO v_user_id
  FROM profiles
  WHERE email = 'info@eclatsenior.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email info@eclatsenior.com no encontrado';
  END IF;
  
  -- Generar un stripe_customer_id temporal (formato cus_XXXX)
  v_stripe_customer_id := 'cus_manual_' || substr(md5(random()::text), 1, 14);
  
  -- Verificar si ya tiene una suscripción activa
  IF EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE refugi_lead_id = v_user_id 
    AND status = 'active'
  ) THEN
    -- Actualizar la suscripción existente al plan empresarial
    UPDATE subscriptions
    SET 
      product_id = 'prod_TD9qO6wy051a2r',
      price_id = 'price_1SGjWXR3C9Xn67Ycu0geFGYR',
      employee_limit = 50,
      current_period_end = now() + interval '1 year',
      status = 'active',
      updated_at = now()
    WHERE refugi_lead_id = v_user_id;
    
    RAISE NOTICE 'Suscripción actualizada para el usuario %', v_user_id;
  ELSE
    -- Insertar nueva suscripción
    INSERT INTO subscriptions (
      refugi_lead_id,
      product_id,
      price_id,
      employee_limit,
      stripe_customer_id,
      stripe_subscription_id,
      status,
      current_period_end,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'prod_TD9qO6wy051a2r',  -- Plan Empresarial
      'price_1SGjWXR3C9Xn67Ycu0geFGYR',  -- Precio del Plan Empresarial
      50,  -- Límite de 50 empleadas
      v_stripe_customer_id,  -- Customer ID generado
      'sub_manual_' || substr(md5(random()::text), 1, 14),  -- Subscription ID temporal
      'active',  -- Estado activo
      now() + interval '1 year',  -- Expira en 1 año
      now(),
      now()
    );
    
    RAISE NOTICE 'Nueva suscripción creada para el usuario %', v_user_id;
  END IF;
END $$;