import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    email: string;
    raw_user_meta_data: {
      role?: string;
      full_name?: string;
    };
    email_confirmed_at: string | null;
  };
  old_record: any;
}

const getEmailTemplate = (role: string, userName: string, verificationUrl: string) => {
  const isLead = role === 'refugi_lead';
  
  const leadTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifica tu cuenta empresarial - Refugi</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Refugi</h1>
                    <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Plataforma de Bienestar Empresarial</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">¡Bienvenido/a a Refugi, ${userName}!</h2>
                    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Gracias por elegir Refugi para cuidar el bienestar emocional de tu equipo. Has dado el primer paso para crear un entorno laboral más saludable y productivo.
                    </p>
                    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Para activar tu cuenta empresarial y comenzar a gestionar el bienestar de tus empleadas, por favor verifica tu correo electrónico haciendo clic en el botón:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Verificar Email Corporativo
                      </a>
                    </div>
                    <p style="margin: 30px 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      <strong>Próximos pasos después de verificar:</strong>
                    </p>
                    <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                      <li>Configura tu perfil empresarial</li>
                      <li>Registra a tus empleadas en el sistema</li>
                      <li>Selecciona tu plan de suscripción</li>
                      <li>Comienza a monitorear el bienestar de tu equipo</li>
                    </ul>
                    <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      Si no solicitaste esta cuenta, puedes ignorar este email de forma segura.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      Este enlace expirará en 24 horas por seguridad.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                      ¿Necesitas ayuda? Contáctanos en <a href="mailto:soporte@refugi.app" style="color: #6366f1; text-decoration: none;">soporte@refugi.app</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      © 2025 Refugi. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const individualTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifica tu cuenta - Refugi</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Refugi</h1>
                    <p style="margin: 10px 0 0 0; color: #fce7f3; font-size: 14px;">Tu Espacio de Bienestar Personal</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">¡Bienvenida a Refugi, ${userName}! 💜</h2>
                    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Nos alegra mucho que hayas decidido cuidar tu bienestar emocional. Has tomado un paso valiente y importante.
                    </p>
                    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Para comenzar a usar tu espacio personal y acceder a todas las herramientas de apoyo, por favor verifica tu correo electrónico:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Verificar Mi Cuenta
                      </a>
                    </div>
                    <p style="margin: 30px 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      <strong>Lo que encontrarás en Refugi:</strong>
                    </p>
                    <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                      <li>Seguimiento diario de tu estado emocional</li>
                      <li>Herramientas de calma y relajación</li>
                      <li>Espacio seguro para tus notas privadas</li>
                      <li>Recursos de apoyo y autocuidado</li>
                      <li>Botón de emergencia para momentos críticos</li>
                    </ul>
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        <strong>Tu privacidad es sagrada:</strong> Toda tu información está protegida y es completamente confidencial. Nadie más tendrá acceso a tus datos personales.
                      </p>
                    </div>
                    <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      Si no creaste esta cuenta, puedes ignorar este email de forma segura.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      Este enlace expirará en 24 horas por seguridad.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                      ¿Necesitas apoyo inmediato? Contáctanos en <a href="mailto:ayuda@refugi.app" style="color: #ec4899; text-decoration: none;">ayuda@refugi.app</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      © 2025 Refugi. Cuidamos de ti con confidencialidad y respeto.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return isLead ? leadTemplate : individualTemplate;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    
    console.log('[VERIFICATION-EMAIL] Received webhook:', {
      type: payload.type,
      table: payload.table,
      record: payload.record?.id,
      email: payload.record?.email
    });

    // Only process INSERT events on users table
    if (payload.type !== 'INSERT' || payload.table !== 'users') {
      console.log('[VERIFICATION-EMAIL] Skipping non-INSERT event or wrong table');
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const user = payload.record;
    
    // Verify Resend API key is configured
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error('[VERIFICATION-EMAIL] RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user role and name from metadata
    const role = user.raw_user_meta_data?.role || 'employee';
    const userName = user.raw_user_meta_data?.full_name || 'Usuario';
    const managedByLead = user.raw_user_meta_data?.managed_by_lead || false;
    
    console.log('[VERIFICATION-EMAIL] User details:', { 
      role, 
      userName, 
      email: user.email,
      managedByLead,
      emailConfirmedAt: user.email_confirmed_at
    });

    // Skip if user is managed by a Lead (they are auto-confirmed by backend)
    if (managedByLead) {
      console.log('[VERIFICATION-EMAIL] User managed by Lead, skipping verification email');
      return new Response(JSON.stringify({ message: 'Managed user, no verification needed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate verification link using Supabase Admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[VERIFICATION-EMAIL] Missing Supabase credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[VERIFICATION-EMAIL] Generating verification link for:', user.email);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: user.email,
      options: {
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/`
      }
    });

    if (linkError || !linkData.properties?.action_link) {
      console.error('[VERIFICATION-EMAIL] Error generating verification link:', linkError);
      throw new Error(`Failed to generate verification link: ${linkError?.message || 'Unknown error'}`);
    }

    const verificationUrl = linkData.properties.action_link;
    console.log('[VERIFICATION-EMAIL] Verification link generated successfully');

    // Get email template based on role
    const emailHtml = getEmailTemplate(role, userName, verificationUrl);

    // Send email via Resend
    console.log('[VERIFICATION-EMAIL] Sending email to:', user.email, 'Role:', role);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Refugi <onboarding@resend.dev>', // Use Resend default until domain is verified
      to: [user.email],
      subject: role === 'refugi_lead' 
        ? 'Verifica tu cuenta empresarial - Refugi'
        : 'Bienvenida a Refugi - Verifica tu cuenta',
      html: emailHtml
    });

    if (emailError) {
      console.error('[VERIFICATION-EMAIL] Error sending email:', emailError);
      throw new Error(`Failed to send email: ${emailError.message || 'Unknown error'}`);
    }

    console.log('[VERIFICATION-EMAIL] Email sent successfully. ID:', emailData?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent',
        email_id: emailData?.id,
        recipient: user.email
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[VERIFICATION-EMAIL] Fatal error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        type: error.name || 'UnknownError'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
