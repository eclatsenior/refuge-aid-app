import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('[SET-VAULT-PASSWORD] Starting function');
    console.log('[SET-VAULT-PASSWORD] Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      console.error('[SET-VAULT-PASSWORD] No authorization header');
      throw new Error('No autorizado - falta cabecera de autorización');
    }

    // Create admin client to verify user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Extract token from header
    const token = authHeader.replace('Bearer ', '');
    console.log('[SET-VAULT-PASSWORD] Token length:', token.length);

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    console.log('[SET-VAULT-PASSWORD] Auth result:', { 
      userId: user?.id, 
      hasError: !!authError,
      errorMessage: authError?.message 
    });

    if (authError || !user) {
      console.error('[SET-VAULT-PASSWORD] Auth failed:', authError);
      throw new Error('No autorizado - sesión inválida');
    }

    console.log('[SET-VAULT-PASSWORD] User authenticated:', user.id);

    const { password } = await req.json();

    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Generar salt y hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Verificar si ya existe una contraseña
    const { data: existing } = await supabaseAdmin
      .from('vault_passwords')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      throw new Error('Ya existe una contraseña de caja fuerte configurada');
    }

    // Insertar nueva contraseña
    const { error: insertError } = await supabaseAdmin
      .from('vault_passwords')
      .insert({
        user_id: user.id,
        password_hash: passwordHash,
        salt: salt,
      });

    if (insertError) {
      console.error('Error al guardar contraseña:', insertError);
      throw insertError;
    }

    console.log('Contraseña de caja fuerte configurada para usuario:', user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Contraseña configurada correctamente' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error en set-vault-password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
