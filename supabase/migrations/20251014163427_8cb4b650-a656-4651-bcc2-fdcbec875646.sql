-- Asignar Plan Básico a Lucía (fpadillamor+test999@alumni.unav.es)
-- Esto es una asignación manual para testing

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
  '90ef09e1-4918-451c-9e97-074c1b38013a',
  'prod_TD9YFQnIPhkgz4',
  'price_1SGjFHR3C9Xn67YcDTCa71lq',
  'active',
  10,
  NOW() + INTERVAL '30 days',
  'cus_test_lucia_basic',
  'sub_test_lucia_basic'
);