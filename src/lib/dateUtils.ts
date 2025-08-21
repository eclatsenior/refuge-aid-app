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