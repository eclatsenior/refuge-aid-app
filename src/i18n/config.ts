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
        'settings-lead': esSettingsLead
      },
      ca: {
        common: caCommon,
        profile: caProfile,
        messages: caMessages,
        home: caHome,
        tracking: caTracking,
        settings: caSettings,
        resources: caResources,
        'settings-lead': caSettingsLead
      },
      en: {
        common: enCommon,
        profile: enProfile,
        messages: enMessages,
        home: enHome,
        tracking: enTracking,
        settings: enSettings,
        resources: enResources,
        'settings-lead': enSettingsLead
      },
      ar: {
        common: arCommon,
        profile: arProfile,
        messages: arMessages,
        home: arHome,
        tracking: arTracking,
        settings: arSettings,
        resources: arResources,
        'settings-lead': arSettingsLead
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
