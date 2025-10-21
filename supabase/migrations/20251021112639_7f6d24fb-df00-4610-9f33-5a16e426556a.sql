-- Activar suscripción Plan Básico para eclatsenior@gmail.com
INSERT INTO subscriptions (
  refugi_lead_id,
  product_id,
  price_id,
  employee_limit,
  status,
  current_period_end,
  stripe_customer_id,
  stripe_subscription_id
)
VALUES (
  'a4474a01-40cf-4dcb-82a2-2bb927c38eb2',
  'prod_TD9YFQnIPhkgz4',
  'price_1SGjFHR3C9Xn67YcDTCa71lq',
  10,
  'active',
  '2026-01-31 23:59:59+00',
  'manual-demo',
  'manual-demo'
);