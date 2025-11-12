import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JWT_SECRET = new TextEncoder().encode(
  Deno.env.get('SUPABASE_JWT_SECRET') || 'your-secret-key'
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('No autorizado');
    }

    const { password } = await req.json();

    if (!password) {
      throw new Error('Contraseña requerida');
    }

    // Obtener hash almacenado
    const { data: vaultPassword, error: fetchError } = await supabaseClient
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

    if (scheme.startsWith('pbkdf2$')) {
      // Formato: pbkdf2$sha256$<iteraciones>$<hashHex>
      const parts = scheme.split('$');
      const iterations = parseInt(parts[2]);
      const storedHashHex = parts[3];
      const saltHex = String(vaultPassword.salt || '');
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
      // Comparación en tiempo constante
      if (computedHex.length === storedHashHex.length) {
        let diff = 0;
        for (let i = 0; i < computedHex.length; i++) {
          diff |= computedHex.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
        }
        isValid = (diff === 0);
      }
    } else {
      throw new Error('Formato de hash no soportado');
    }

    if (!isValid) {
      console.log('Intento de contraseña incorrecta para usuario:', user.id);
      return new Response(
        JSON.stringify({ error: 'Contraseña incorrecta' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Generar token temporal (30 minutos)
    const token = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos
        iat: Math.floor(Date.now() / 1000),
        vault_access: true,
      },
      JWT_SECRET
    );

    console.log('Caja fuerte desbloqueada para usuario:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        token,
        message: 'Caja fuerte desbloqueada' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error en verify-vault-password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
