import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getJWTSecret(): Promise<CryptoKey> {
  // Use service role key as secret for verifying reset tokens (consistent with approve functions)
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret) {
    throw new Error('Server configuration error: missing signing key');
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
    try {
      // Manually verify JWT
      const jwtSecret = await getJWTSecret();
      const parts = resetToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Token inválido');
      }
      
      const [headerB64, payloadB64, signatureB64] = parts;
      const dataToVerify = `${headerB64}.${payloadB64}`;
      const enc = new TextEncoder();
      const signature = await crypto.subtle.sign('HMAC', jwtSecret, enc.encode(dataToVerify));
      const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      
      if (computedSignature !== signatureB64) {
        throw new Error('Token inválido');
      }
      
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
      
      if (!payload.vault_reset || payload.sub !== user.id) {
        throw new Error('Token inválido');
      }
      
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expirado');
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

    // Mark the vault reset request as completed so the dialog doesn't appear again
    const { error: requestUpdateError } = await supabaseAdmin
      .from('vault_reset_requests')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'approved');

    if (requestUpdateError) {
      console.error('Error updating reset request status:', requestUpdateError);
      // Non-critical, don't throw
    }

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
  } catch (error: any) {
    console.error('[reset-vault-password] Error:', error.message);
    const safeMessages = ['Token y nueva contraseña requeridos', 'La contraseña debe tener al menos 8 caracteres', 'Token de reset inválido o expirado'];
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
