export const SUBSCRIPTION_PLANS = {
  basic: {
    product_id: 'prod_TD9YFQnIPhkgz4',
    price_id: 'price_1SGjFHR3C9Xn67YcDTCa71lq',
    name: 'Plan Básico',
    price: 99.95,
    employee_limit: 10,
    popular: false,
    features: [
      'Hasta 10 empleadas',
      'Dashboard completo',
      'Alertas de emergencia',
      'Registro de estado de ánimo',
      'Soporte básico',
    ]
  },
  intermediate: {
    product_id: 'prod_TD9o6VZUCKCnhB',
    price_id: 'price_1SGjUQR3C9Xn67Yck8eqMnAr',
    name: 'Plan Intermedio',
    price: 199.95,
    employee_limit: 25,
    features: [
      'Hasta 25 empleadas',
      'Dashboard completo',
      'Alertas de emergencia',
      'Registro de estado de ánimo',
      'KPIs avanzados',
      'Soporte prioritario',
    ],
    popular: true
  },
  enterprise: {
    product_id: 'prod_TD9qO6wy051a2r',
    price_id: 'price_1SGjWXR3C9Xn67Ycu0geFGYR',
    name: 'Plan Empresarial',
    price: 299.95,
    employee_limit: 50,
    popular: false,
    features: [
      'Hasta 50 empleadas',
      'Dashboard completo',
      'Alertas de emergencia',
      'Registro de estado de ánimo',
      'KPIs avanzados',
      'Cola de atención',
      'Reportes personalizados',
      'Soporte 24/7',
    ]
  }
} as const;

export function getPlanByProductId(productId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(
    plan => plan.product_id === productId
  );
}

export function getPlanNameByProductId(productId: string): string {
  const plan = getPlanByProductId(productId);
  return plan?.name || 'Plan Desconocido';
}
