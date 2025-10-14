-- Insert test subscription for refugi_lead user
-- This creates an active Basic Plan subscription (10 employees) for testing

INSERT INTO subscriptions (
  refugi_lead_id,
  stripe_customer_id,
  stripe_subscription_id,
  product_id,
  price_id,
  status,
  current_period_end,
  employee_limit
) VALUES (
  '1c09a3cb-2bdf-434b-b21b-d4e4225c2c60',
  'cus_test_refugi_lead_1001',
  'sub_test_basic_plan',
  'prod_TD9YFQnIPhkgz4',
  'price_1SGjFHR3C9Xn67YcDTCa71lq',
  'active',
  NOW() + INTERVAL '30 days',
  10
);