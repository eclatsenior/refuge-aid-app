-- Crear suscripción Premium para eclatsenior+test2@gmail.com
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
  '82d0c4bf-ac9a-498d-ab38-b52c5c5acaf2',
  'cus_test_82d0c4bf',
  'sub_test_' || extract(epoch from now())::text,
  'prod_TD9UdEM6XDdBZT',
  'price_1SGjBeR3C9Xn67YcQrAPwhDO',
  'active',
  1,
  now() + interval '1 year'
);