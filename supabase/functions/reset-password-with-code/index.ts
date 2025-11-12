import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
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
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Email, código y nueva contraseña son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    // Validate password strength
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!hasUpperCase || !hasNumber) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe incluir al menos 1 mayúscula y 1 número' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get valid codes for this email (double verification)
    const { data: codes, error: fetchError } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching reset codes:', fetchError);
      throw fetchError;
    }

    if (!codes || codes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Código inválido o expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the code with bcrypt
    let validCode = null;
    for (const dbCode of codes) {
      const isMatch = await bcrypt.compare(normalizedCode, dbCode.code_hash);
      if (isMatch) {
        validCode = dbCode;
        break;
      }
    }

    if (!validCode) {
      return new Response(
        JSON.stringify({ error: 'Código inválido o expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user by email
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update password using Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw updateError;
    }

    // Mark code as used
    const { error: markUsedError } = await supabaseAdmin
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', validCode.id);

    if (markUsedError) {
      console.error('Error marking code as used:', markUsedError);
      // Don't throw, password was already updated
    }

    // Create a new session for the user (auto-login)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: newPassword
    });

    if (signInError) {
      console.error('Error creating session:', signInError);
      // Password was updated but couldn't auto-login
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Contraseña actualizada. Por favor inicia sesión manualmente.',
          session: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password reset successful for:', normalizedEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contraseña actualizada correctamente',
        session: sessionData.session,
        user: sessionData.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in reset-password-with-code:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error al resetear contraseña' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
