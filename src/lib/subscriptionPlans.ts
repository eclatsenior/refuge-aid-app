export const SUBSCRIPTION_PLANS = {
  individual: {
    product_id: 'prod_TD9UdEM6XDdBZT',
    price_id: 'price_1SGjBeR3C9Xn67YcQrAPwhDO',
    name: 'Refugi Individual',
    price: 9.99,
    employee_limit: 1,
    popular: false,
    features: [
      'Acceso completo a todas las funciones',
      'Alertas de emergencia 24/7',
      'Contactos de confianza ilimitados',
      'Notas cifradas y seguras',
      'Seguimiento de estado de ánimo',
      'Recursos terapéuticos',
      'Soporte prioritario'
    ]
  },
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

// Mapeo de product_id a claves de traducción
export const PLAN_TRANSLATION_KEYS: Record<string, string> = {
  'prod_TD9UdEM6XDdBZT': 'planNames.individual',
  'prod_TD9YFQnIPhkgz4': 'planNames.basic',
  'prod_TD9o6VZUCKCnhB': 'planNames.intermediate',
  'prod_TD9qO6wy051a2r': 'planNames.enterprise',
};

// Mapeo de características a claves de traducción
export const FEATURE_TRANSLATION_KEYS: Record<string, string> = {
  'Acceso completo a todas las funciones': 'features.fullAccess',
  'Alertas de emergencia 24/7': 'features.emergencyAlerts247',
  'Contactos de confianza ilimitados': 'features.unlimitedTrustedContacts',
  'Notas cifradas y seguras': 'features.encryptedNotes',
  'Seguimiento de estado de ánimo': 'features.moodTracking',
  'Recursos terapéuticos': 'features.therapeuticResources',
  'Soporte prioritario': 'features.prioritySupport',
  'Dashboard completo': 'features.completeDashboard',
  'Alertas de emergencia': 'features.emergencyAlerts',
  'Registro de estado de ánimo': 'features.moodRegistry',
  'Soporte básico': 'features.basicSupport',
  'KPIs avanzados': 'features.advancedKPIs',
  'Cola de atención': 'features.attentionQueue',
  'Reportes personalizados': 'features.customReports',
  'Soporte 24/7': 'features.support247',
};

export function getPlanByProductId(productId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(
    plan => plan.product_id === productId
  );
}

export function getPlanNameByProductId(productId: string): string {
  const plan = getPlanByProductId(productId);
  return plan?.name || 'Plan Desconocido';
}

// Nueva función para obtener el nombre traducido del plan
export function getTranslatedPlanName(productId: string, t: (key: string) => string): string {
  const translationKey = PLAN_TRANSLATION_KEYS[productId];
  if (!translationKey) return t('planNames.unknown');
  return t(translationKey);
}

// Función para obtener características traducidas
export function getTranslatedFeature(feature: string, t: any, count?: number): string {
  // Si la característica incluye un número de empleadas, extraerlo
  const employeeMatch = feature.match(/^Hasta (\d+) empleadas$/);
  if (employeeMatch) {
    return t('features.upToEmployees', { count: employeeMatch[1] });
  }
  
  const translationKey = FEATURE_TRANSLATION_KEYS[feature];
  if (!translationKey) return feature;
  return t(translationKey);
}
