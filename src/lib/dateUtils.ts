// Utility functions to handle Date serialization/deserialization
export const ensureDate = (timestamp: Date | number | string): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

export const safeToDateString = (timestamp: Date | number | string): string => {
  return ensureDate(timestamp).toDateString();
};

export const safeToLocaleTimeString = (
  timestamp: Date | number | string, 
  locale: string, 
  options?: Intl.DateTimeFormatOptions
): string => {
  return ensureDate(timestamp).toLocaleTimeString(locale, options);
};

export const safeToLocaleDateString = (
  timestamp: Date | number | string, 
  locale: string, 
  options?: Intl.DateTimeFormatOptions
): string => {
  return ensureDate(timestamp).toLocaleDateString(locale, options);
};

export const safeGetTime = (timestamp: Date | number | string): number => {
  return ensureDate(timestamp).getTime();
};

// Get date-fns locale based on current i18n language
import { es, ca, enUS, ar } from 'date-fns/locale';

export const getDateFnsLocale = (language?: string) => {
  // Use provided language or get from i18n if available
  const lang = language || (typeof window !== 'undefined' && (window as any).i18n?.language) || 'es';
  
  switch (lang) {
    case 'ca':
      return ca;
    case 'en':
      return enUS;
    case 'ar':
      return ar;
    case 'es':
    default:
      return es;
  }
};