/**
 * Utilidades de seguridad para Refugi
 * 
 * IMPORTANTE: En un entorno de producción, estas funciones deberían usar
 * bibliotecas de cifrado robustas como crypto-js o Web Crypto API
 */

/**
 * Simula el cifrado de una cadena de texto
 * En producción, usar AES-GCM con Web Crypto API
 */
export function encryptText(text: string, _key?: string): string {
  // Simulación - en producción usar cifrado real
  try {
    return btoa(encodeURIComponent(text));
  } catch (error) {
    console.error('Error al cifrar texto:', error);
    return text;
  }
}

/**
 * Simula el descifrado de una cadena de texto
 * En producción, usar AES-GCM con Web Crypto API
 */
export function decryptText(encryptedText: string, _key?: string): string {
  // Simulación - en producción usar descifrado real
  try {
    return decodeURIComponent(atob(encryptedText));
  } catch (error) {
    console.error('Error al descifrar texto:', error);
    return encryptedText;
  }
}

/**
 * Genera una clave de cifrado derivada del PIN del usuario
 * En producción, usar PBKDF2 o Argon2
 */
export function deriveKeyFromPIN(pin: string, salt?: string): string {
  // Simulación - en producción usar derivación de clave robusta
  const combinedInput = pin + (salt || 'refugi-default-salt');
  
  // Simulación de hash (en producción usar PBKDF2/Argon2)
  let hash = 0;
  for (let i = 0; i < combinedInput.length; i++) {
    const char = combinedInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  
  return Math.abs(hash).toString(16);
}

/**
 * Valida que un PIN sea seguro
 */
export function validatePIN(pin: string): { isValid: boolean; message?: string } {
  if (pin.length < 4) {
    return { isValid: false, message: 'El PIN debe tener al menos 4 dígitos' };
  }
  
  if (pin.length > 8) {
    return { isValid: false, message: 'El PIN no puede tener más de 8 dígitos' };
  }
  
  if (!/^\d+$/.test(pin)) {
    return { isValid: false, message: 'El PIN solo puede contener números' };
  }
  
  // Verificar que no sea demasiado simple
  const simplePatterns = ['1234', '0000', '1111', '1122', '1212'];
  if (simplePatterns.includes(pin) || pin.length >= 4 && pin === pin[0].repeat(pin.length)) {
    return { isValid: false, message: 'El PIN es demasiado simple. Elige uno más seguro' };
  }
  
  return { isValid: true };
}

/**
 * Sanitiza datos sensibles antes del logging
 */
export function sanitizeForLogging(obj: any): any {
  const sensitiveKeys = ['password', 'pin', 'token', 'key', 'secret', 'phone', 'email'];
  
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Valida formato de número de teléfono español
 */
export function validateSpanishPhone(phone: string): { isValid: boolean; message?: string; formatted?: string } {
  // Remover espacios y caracteres no numéricos excepto +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Patrones válidos para España
  const patterns = [
    /^(\+34|0034)?[67]\d{8}$/, // Móviles
    /^(\+34|0034)?[89]\d{8}$/, // Fijos
    /^(\+34|0034)?9\d{8}$/     // Otros servicios
  ];
  
  if (!patterns.some(pattern => pattern.test(cleaned))) {
    return { 
      isValid: false, 
      message: 'Introduce un número de teléfono español válido (ej: 612345678 o +34612345678)' 
    };
  }
  
  // Formatear número
  let formatted = cleaned;
  if (formatted.startsWith('+34')) {
    formatted = formatted.substring(3);
  } else if (formatted.startsWith('0034')) {
    formatted = formatted.substring(4);
  }
  
  return { 
    isValid: true, 
    formatted: `+34${formatted}` 
  };
}

/**
 * Genera mensaje de WhatsApp con datos seguros
 */
export function generateWhatsAppURL(phone: string, message: string, location?: string): string {
  const baseMessage = message;
  const timestamp = new Date().toLocaleString('es-ES');
  const locationText = location ? `\n📍 Ubicación: ${location}` : '';
  
  const fullMessage = `${baseMessage}\n🕒 ${timestamp}${locationText}`;
  const encodedMessage = encodeURIComponent(fullMessage);
  
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodedMessage}`;
}

/**
 * Genera URL de SMS con mensaje de alerta
 */
export function generateSMSURL(phone: string, message: string, location?: string): string {
  const baseMessage = message;
  const timestamp = new Date().toLocaleString('es-ES');
  const locationText = location ? ` Ubicación: ${location}` : '';
  
  const fullMessage = `${baseMessage} ${timestamp}${locationText}`;
  const encodedMessage = encodeURIComponent(fullMessage);
  
  return `sms:${phone}?body=${encodedMessage}`;
}