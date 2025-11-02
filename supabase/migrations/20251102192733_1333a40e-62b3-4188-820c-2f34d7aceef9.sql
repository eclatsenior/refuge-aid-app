-- Assign Basic Plan to fausto.padilla+test788@worksible.com
INSERT INTO subscriptions (
  refugi_lead_id,
  stripe_customer_id,
  stripe_subscription_id,
  product_id,
  price_id,
  status,
  employee_limit,
  current_period_end
) VALUES (
  'd1bc42cd-62fa-41e2-83b6-151ea932acca',
  'manual_test788_cus',
  'manual_test788_sub_' || extract(epoch from now())::bigint,
  'prod_TD9YFQnIPhkgz4',
  'price_1SGjFHR3C9Xn67YcDTCa71lq',
  'active',
  10,
  now() + interval '30 days'
)
ON CONFLICT (refugi_lead_id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  price_id = EXCLUDED.price_id,
  status = EXCLUDED.status,
  employee_limit = EXCLUDED.employee_limit,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = now();