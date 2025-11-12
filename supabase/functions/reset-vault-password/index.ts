import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

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
    const authHeader = req.headers.get('Authorization');
    console.log('[RESET-VAULT-PASSWORD] Starting function');
    
    if (!authHeader) {
      console.error('[RESET-VAULT-PASSWORD] No authorization header');
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
    
    console.log('[RESET-VAULT-PASSWORD] Auth result:', { 
      userId: user?.id, 
      hasError: !!authError 
    });

    if (authError || !user) {
      console.error('[RESET-VAULT-PASSWORD] Auth failed:', authError);
      throw new Error('No autorizado - sesión inválida');
    }

    const { resetToken, newPassword } = await req.json();

    if (!resetToken || !newPassword) {
      throw new Error('Token y nueva contraseña requeridos');
    }

    if (newPassword.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Verificar token de reset
    let payload;
    try {
      payload = await verify(resetToken, JWT_SECRET);
      
      if (!payload.vault_reset || payload.sub !== user.id) {
        throw new Error('Token inválido');
      }
    } catch (error) {
      console.error('Error al verificar token:', error);
      throw new Error('Token de reset inválido o expirado');
    }

    // Generar nuevo salt y hash con PBKDF2
    const enc = new TextEncoder();
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2,'0')).join('');
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(newPassword), 'PBKDF2', false, ['deriveBits']);
    const iterations = 210000;
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations },
      keyMaterial,
      256
    );
    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2,'0')).join('');
    const passwordHash = `pbkdf2$sha256$${iterations}$${hashHex}`;

    // Actualizar contraseña
    const { error: updateError } = await supabaseAdmin
      .from('vault_passwords')
      .update({
        password_hash: passwordHash,
        salt: saltHex,
        reset_approved_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error al actualizar contraseña:', updateError);
      throw updateError;
    }

    // IMPORTANTE: Las notas cifradas con la contraseña antigua ya no podrán descifrarse
    // Opcionalmente, marcar las notas antiguas de la caja fuerte como no descifrables
    // O simplemente eliminarlas (más seguro)

    console.log('Contraseña de caja fuerte reseteada para usuario:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contraseña actualizada correctamente',
        warning: 'Las notas antiguas de tu Caja Fuerte no podrán descifrarse con la nueva contraseña'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error en reset-vault-password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
