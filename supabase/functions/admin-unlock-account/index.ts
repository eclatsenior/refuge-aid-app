import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnlockRequest {
  email: string;
  action: 'confirm_email' | 'reset_password';
  alternative_email?: string; // Para password reset a otro email
  admin_secret: string; // Clave secreta adicional para máxima seguridad
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSecret = Deno.env.get('ADMIN_UNLOCK_SECRET'); // Clave adicional

    // Verificar que las variables de entorno existen
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    // Crear cliente con privilegios de administrador
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body: UnlockRequest = await req.json();
    const { email, action, alternative_email, admin_secret } = body;

    console.log('[ADMIN-UNLOCK] Request received:', { email, action });

    // Verificación de seguridad adicional
    if (adminSecret && admin_secret !== adminSecret) {
      console.error('[ADMIN-UNLOCK] Invalid admin secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid admin secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar usuario por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('[ADMIN-UNLOCK] Error listing users:', listError);
      throw listError;
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ADMIN-UNLOCK] User found:', { id: user.id, email: user.email });

    // Ejecutar acción solicitada
    if (action === 'confirm_email') {
      // Confirmar email manualmente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (updateError) {
        console.error('[ADMIN-UNLOCK] Error confirming email:', updateError);
        throw updateError;
      }

      console.log('[ADMIN-UNLOCK] ✅ Email confirmed for user:', user.email);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email confirmed for ${user.email}. User can now login.`,
          user_id: user.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reset_password') {
      // Enviar reset de contraseña
      const targetEmail = alternative_email || email;

      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        targetEmail,
        {
          redirectTo: `${req.headers.get("origin") || supabaseUrl}/reset-password`
        }
      );

      if (resetError) {
        console.error('[ADMIN-UNLOCK] Error sending password reset:', resetError);
        throw resetError;
      }

      console.log('[ADMIN-UNLOCK] ✅ Password reset sent to:', targetEmail);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Password reset email sent to ${targetEmail}`,
          user_id: user.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "confirm_email" or "reset_password"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[ADMIN-UNLOCK] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
