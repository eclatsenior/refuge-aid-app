import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import esCommon from '@/locales/es/common.json';
import esProfile from '@/locales/es/profile.json';
import esMessages from '@/locales/es/messages.json';

import caCommon from '@/locales/ca/common.json';
import caProfile from '@/locales/ca/profile.json';
import caMessages from '@/locales/ca/messages.json';

import enCommon from '@/locales/en/common.json';
import enProfile from '@/locales/en/profile.json';
import enMessages from '@/locales/en/messages.json';

import arCommon from '@/locales/ar/common.json';
import arProfile from '@/locales/ar/profile.json';
import arMessages from '@/locales/ar/messages.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: esCommon,
        profile: esProfile,
        messages: esMessages
      },
      ca: {
        common: caCommon,
        profile: caProfile,
        messages: caMessages
      },
      en: {
        common: enCommon,
        profile: enProfile,
        messages: enMessages
      },
      ar: {
        common: arCommon,
        profile: arProfile,
        messages: arMessages
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

export default i18n;
