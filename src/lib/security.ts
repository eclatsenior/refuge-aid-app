/**
 * Utilidades de seguridad para Refugi
 * 
 * IMPORTANTE: En un entorno de producción, estas funciones deberían usar
 * bibliotecas de cifrado robustas como crypto-js o Web Crypto API
 */

/**
 * Cifra una cadena de texto usando AES-GCM con Web Crypto API
 */
export async function encryptText(text: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    
    // Derivar clave de cifrado desde la contraseña
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encoder.encode(text)
    );
    
    // Combinar salt, iv y datos cifrados
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    // Convertir a base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Error al cifrar texto:', error);
    throw error;
  }
}

/**
 * Descifra una cadena de texto usando AES-GCM con Web Crypto API
 */
export async function decryptText(encryptedText: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Decodificar desde base64
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // Extraer salt, iv y datos cifrados
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    
    // Derivar clave desde contraseña
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Error al descifrar texto:', error);
    throw new Error('No se pudo descifrar el texto. Contraseña incorrecta.');
  }
}

/**
 * Genera una clave de cifrado derivada del PIN del usuario
 * En producción, usar PBKDF2 o Argon2
 */

/* ------------------------------------------------------------------ *
 * Caja Fuerte: gestión de la clave de datos (DEK)
 * ------------------------------------------------------------------ */

const VAULT_DATA_KEY_STORAGE = 'vault_data_key';

/** Guarda la clave de cifrado de la caja fuerte solo durante la sesión */
export function setVaultDataKey(key: string): void {
  sessionStorage.setItem(VAULT_DATA_KEY_STORAGE, key);
}

/** Devuelve la clave de cifrado de la caja fuerte (si está desbloqueada) */
export function getVaultDataKey(): string | null {
  return sessionStorage.getItem(VAULT_DATA_KEY_STORAGE);
}

/** Elimina la clave de cifrado al bloquear la caja fuerte */
export function clearVaultDataKey(): void {
  sessionStorage.removeItem(VAULT_DATA_KEY_STORAGE);
}

/**
 * Cifra el contenido de una nota de la caja fuerte con la clave de datos
 * aleatoria de 256 bits emitida por el servidor tras validar la contraseña.
 */
export async function encryptVaultNote(text: string): Promise<string> {
  const key = getVaultDataKey();
  if (!key) throw new Error('La caja fuerte está bloqueada');
  return encryptText(text, key);
}

/**
 * Descifra una nota de la caja fuerte. Intenta primero con la clave de datos
 * actual y, para notas antiguas, con el esquema heredado (token de vault).
 * Devuelve `null` si no se puede descifrar.
 */
export async function decryptVaultNote(
  encrypted: string,
  legacyToken?: string | null
): Promise<string | null> {
  const key = getVaultDataKey();
  if (key) {
    try {
      return await decryptText(encrypted, key);
    } catch (_e) {
      // continúa con el esquema heredado
    }
  }
  if (legacyToken) {
    try {
      return await decryptText(encrypted, legacyToken.substring(0, 32));
    } catch (_e) {
      // no descifrable
    }
  }
  return null;
}

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