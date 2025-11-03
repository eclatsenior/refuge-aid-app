import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@2.0.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if email exists (don't expose this information to user)
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = users?.some(u => u.email?.toLowerCase() === normalizedEmail);

    if (!userExists) {
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
      // Still return success to avoid email enumeration attacks
      return new Response(
        JSON.stringify({ success: true, message: 'Si el email existe, recibirás un código' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting (max 1 code every 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recentCodes } = await supabaseAdmin
      .from('password_reset_codes')
      .select('created_at')
      .eq('email', normalizedEmail)
      .gte('created_at', twoMinutesAgo)
      .limit(1);

    if (recentCodes && recentCodes.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Ya enviamos un código recientemente. Espera 2 minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the code with bcrypt
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);

    // Store in database with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_codes')
      .insert({
        email: normalizedEmail,
        code_hash: codeHash,
        expires_at: expiresAt,
        used: false
      });

    if (insertError) {
      console.error('Error inserting reset code:', insertError);
      throw insertError;
    }

    // Send email with Resend
    const emailResponse = await resend.emails.send({
      from: 'Refugi <noreply@eclatsenior.com.es>',
      to: [normalizedEmail],
      subject: 'Código de recuperación de contraseña - Refugi',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, system-ui, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .code-box { background: #f4f4f4; border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña en <strong>Refugi</strong>.</p>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Tu código de recuperación es:</p>
              <div class="code">${code}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Este código expira en 15 minutos</p>
            </div>
            
            <p>Para cambiar tu contraseña:</p>
            <ol>
              <li>Regresa a la aplicación Refugi</li>
              <li>Haz clic en "Ya tengo un código de recuperación"</li>
              <li>Ingresa este código y tu nueva contraseña</li>
            </ol>
            
            <p style="color: #dc2626; font-size: 14px;">⚠️ Si no solicitaste este cambio, ignora este email y tu contraseña permanecerá sin cambios.</p>
            
            <div class="footer">
              <p>Este email fue enviado por Refugi App<br>
              No respondas a este email, es una cuenta no monitoreada.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Código enviado correctamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in request-password-reset:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error al procesar la solicitud' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
