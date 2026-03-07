import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getJWTSecret(): Promise<CryptoKey> {
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret) {
    throw new Error('Server configuration error: signing key not available');
  }
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('[VERIFY-VAULT-PASSWORD] Starting function');
    
    if (!authHeader) {
      console.error('[VERIFY-VAULT-PASSWORD] No authorization header');
      throw new Error('No autorizado - falta cabecera de autorización');
    }

    // Create admin client to verify user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Extract token from header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    console.log('[VERIFY-VAULT-PASSWORD] Auth result:', { 
      userId: user?.id, 
      hasError: !!authError 
    });

    if (authError || !user) {
      console.error('[VERIFY-VAULT-PASSWORD] Auth failed:', authError);
      throw new Error('No autorizado - sesión inválida');
    }

    const { password } = await req.json();

    if (!password) {
      throw new Error('Contraseña requerida');
    }

    // Obtener hash almacenado
    const { data: vaultPassword, error: fetchError } = await supabaseAdmin
      .from('vault_passwords')
      .select('password_hash, salt')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !vaultPassword) {
      throw new Error('No hay contraseña de caja fuerte configurada');
    }

    // Verificar contraseña con PBKDF2 (sin Workers)
    const scheme = String(vaultPassword.password_hash || '');
    let isValid = false;

    console.log('[VERIFY-VAULT-PASSWORD] Hash scheme check:', {
      startsWithPbkdf2: scheme.startsWith('pbkdf2$'),
      schemeLength: scheme.length
    });

    if (scheme.startsWith('pbkdf2$')) {
      // Formato: pbkdf2$sha256$<iteraciones>$<hashHex>
      const parts = scheme.split('$');
      const iterations = parseInt(parts[2]);
      const storedHashHex = parts[3];
      const saltHex = String(vaultPassword.salt || '');
      
      console.log('[VERIFY-VAULT-PASSWORD] PBKDF2 params:', {
        iterations,
        saltLength: saltHex.length,
        storedHashLength: storedHashHex.length
      });
      
      if (!saltHex) throw new Error('Salt no disponible');

      const hexToBytes = (hex: string) => new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
      const saltBytes = hexToBytes(saltHex);
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
      const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations },
        keyMaterial,
        256
      );
      const computedHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2,'0')).join('');
      
      // Debug logging (first 8 chars only for security)
      console.log('[VERIFY-VAULT-PASSWORD] Hash comparison:', {
        storedHashStart: storedHashHex.substring(0, 8) + '...',
        computedHashStart: computedHex.substring(0, 8) + '...',
        lengthMatch: computedHex.length === storedHashHex.length
      });
      
      // Comparación en tiempo constante
      if (computedHex.length === storedHashHex.length) {
        let diff = 0;
        for (let i = 0; i < computedHex.length; i++) {
          diff |= computedHex.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
        }
        isValid = (diff === 0);
      }
      
      console.log('[VERIFY-VAULT-PASSWORD] Validation result:', { isValid });
    } else {
      console.error('[VERIFY-VAULT-PASSWORD] Unsupported hash format');
      throw new Error('Verification failed');
    }

    if (!isValid) {
      console.log('Intento de contraseña incorrecta para usuario:', user.id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Contraseña incorrecta' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Generar token temporal (30 minutos)
    const jwtSecret = await getJWTSecret();
    const payload = {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos
      iat: Math.floor(Date.now() / 1000),
      vault_access: true,
    };
    
    // Create JWT manually using Web Crypto
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const enc = new TextEncoder();
    const signature = await crypto.subtle.sign('HMAC', jwtSecret, enc.encode(dataToSign));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const vaultToken = `${dataToSign}.${encodedSignature}`;

    console.log('Caja fuerte desbloqueada para usuario:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: vaultToken,
        message: 'Caja fuerte desbloqueada' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[VERIFY-VAULT-PASSWORD] Error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
