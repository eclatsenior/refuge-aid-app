import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
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

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, vaultPassword.password_hash);

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
