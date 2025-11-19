-- Actualizar suscripciones existentes del Plan Básico de 10 a 15 empleadas
UPDATE public.subscriptions
SET 
  employee_limit = 15,
  updated_at = NOW()
WHERE 
  product_id = 'prod_TD9YFQnIPhkgz4' 
  AND employee_limit = 10;

COMMENT ON COLUMN public.subscriptions.employee_limit IS 
  'Maximum number of employees allowed for this subscription plan. Basic Plan: 15, Intermediate: 25, Enterprise: 50, Individual: 1';