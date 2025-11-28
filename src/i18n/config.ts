import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import esCommon from '@/locales/es/common.json';
import esProfile from '@/locales/es/profile.json';
import esMessages from '@/locales/es/messages.json';
import esHome from '@/locales/es/home.json';
import esTracking from '@/locales/es/tracking.json';
import esSettings from '@/locales/es/settings.json';

import caCommon from '@/locales/ca/common.json';
import caProfile from '@/locales/ca/profile.json';
import caMessages from '@/locales/ca/messages.json';
import caHome from '@/locales/ca/home.json';
import caTracking from '@/locales/ca/tracking.json';
import caSettings from '@/locales/ca/settings.json';

import enCommon from '@/locales/en/common.json';
import enProfile from '@/locales/en/profile.json';
import enMessages from '@/locales/en/messages.json';
import enHome from '@/locales/en/home.json';
import enTracking from '@/locales/en/tracking.json';
import enSettings from '@/locales/en/settings.json';

import arCommon from '@/locales/ar/common.json';
import arProfile from '@/locales/ar/profile.json';
import arMessages from '@/locales/ar/messages.json';
import arHome from '@/locales/ar/home.json';
import arTracking from '@/locales/ar/tracking.json';
import arSettings from '@/locales/ar/settings.json';

import esResources from '@/locales/es/resources.json';
import caResources from '@/locales/ca/resources.json';
import enResources from '@/locales/en/resources.json';
import arResources from '@/locales/ar/resources.json';

import esSettingsLead from '@/locales/es/settings-lead.json';
import caSettingsLead from '@/locales/ca/settings-lead.json';
import enSettingsLead from '@/locales/en/settings-lead.json';
import arSettingsLead from '@/locales/ar/settings-lead.json';

import esDashboard from '@/locales/es/dashboard.json';
import caDashboard from '@/locales/ca/dashboard.json';
import enDashboard from '@/locales/en/dashboard.json';
import arDashboard from '@/locales/ar/dashboard.json';

import esAdmin from '@/locales/es/admin.json';
import caAdmin from '@/locales/ca/admin.json';
import enAdmin from '@/locales/en/admin.json';
import arAdmin from '@/locales/ar/admin.json';

import esEmployees from '@/locales/es/employees.json';
import caEmployees from '@/locales/ca/employees.json';
import enEmployees from '@/locales/en/employees.json';
import arEmployees from '@/locales/ar/employees.json';

import esAlerts from '@/locales/es/alerts.json';
import caAlerts from '@/locales/ca/alerts.json';
import enAlerts from '@/locales/en/alerts.json';
import arAlerts from '@/locales/ar/alerts.json';

import esSubscription from '@/locales/es/subscription.json';
import caSubscription from '@/locales/ca/subscription.json';
import enSubscription from '@/locales/en/subscription.json';
import arSubscription from '@/locales/ar/subscription.json';

import esInstall from '@/locales/es/install.json';
import caInstall from '@/locales/ca/install.json';
import enInstall from '@/locales/en/install.json';
import arInstall from '@/locales/ar/install.json';

import esNotes from '@/locales/es/notes.json';
import caNotes from '@/locales/ca/notes.json';
import enNotes from '@/locales/en/notes.json';
import arNotes from '@/locales/ar/notes.json';

import esSuperAdmin from '@/locales/es/superAdmin.json';
import caSuperAdmin from '@/locales/ca/superAdmin.json';
import enSuperAdmin from '@/locales/en/superAdmin.json';
import arSuperAdmin from '@/locales/ar/superAdmin.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: esCommon,
        profile: esProfile,
        messages: esMessages,
        home: esHome,
        tracking: esTracking,
        settings: esSettings,
        resources: esResources,
        'settings-lead': esSettingsLead,
        dashboard: esDashboard,
        admin: esAdmin,
        employees: esEmployees,
        alerts: esAlerts,
        subscription: esSubscription,
        install: esInstall,
        notes: esNotes,
        superAdmin: esSuperAdmin
      },
      ca: {
        common: caCommon,
        profile: caProfile,
        messages: caMessages,
        home: caHome,
        tracking: caTracking,
        settings: caSettings,
        resources: caResources,
        'settings-lead': caSettingsLead,
        dashboard: caDashboard,
        admin: caAdmin,
        employees: caEmployees,
        alerts: caAlerts,
        subscription: caSubscription,
        install: caInstall,
        notes: caNotes,
        superAdmin: caSuperAdmin
      },
      en: {
        common: enCommon,
        profile: enProfile,
        messages: enMessages,
        home: enHome,
        tracking: enTracking,
        settings: enSettings,
        resources: enResources,
        'settings-lead': enSettingsLead,
        dashboard: enDashboard,
        admin: enAdmin,
        employees: enEmployees,
        alerts: enAlerts,
        subscription: enSubscription,
        install: enInstall,
        notes: enNotes,
        superAdmin: enSuperAdmin
      },
      ar: {
        common: arCommon,
        profile: arProfile,
        messages: arMessages,
        home: arHome,
        tracking: arTracking,
        settings: arSettings,
        resources: arResources,
        'settings-lead': arSettingsLead,
        dashboard: arDashboard,
        admin: arAdmin,
        employees: arEmployees,
        alerts: arAlerts,
        subscription: arSubscription,
        install: arInstall,
        notes: arNotes,
        superAdmin: arSuperAdmin
      }
    },
    fallbackLng: 'es',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Handle RTL for Arabic
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lng);
});

export default i18n;
