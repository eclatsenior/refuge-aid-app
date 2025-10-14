-- Asignar Plan Básico a test302 (fpadillamor+test302@alumni.unav.es)
-- Asignación manual para testing

INSERT INTO subscriptions (
  refugi_lead_id,
  product_id,
  price_id,
  status,
  employee_limit,
  current_period_end,
  stripe_customer_id,
  stripe_subscription_id
) VALUES (
  'f47bdb16-ec02-4dc8-9ccb-1f6926eccf9c',
  'prod_TD9YFQnIPhkgz4',
  'price_1SGjFHR3C9Xn67YcDTCa71lq',
  'active',
  10,
  NOW() + INTERVAL '30 days',
  'cus_test_302_basic',
  'sub_test_302_basic'
);