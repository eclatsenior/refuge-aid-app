import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";


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

    // Generar salt y hash con PBKDF2 (sin Workers)
    const enc = new TextEncoder();
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const iterations = 210000;
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations },
      keyMaterial,
      256
    );
    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    const passwordHash = `pbkdf2$sha256$${iterations}$${hashHex}`;

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
        salt: saltHex,
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
  } catch (error: any) {
    console.error('[set-vault-password] Error:', error.message);
    const safeMessages = ['La contraseña debe tener al menos 8 caracteres', 'Ya existe una contraseña de caja fuerte configurada'];
    const clientMessage = safeMessages.includes(error.message) ? error.message : 'An error occurred processing your request';
    return new Response(
      JSON.stringify({ error: clientMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
