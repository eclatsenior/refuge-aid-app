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
    
    console.log("Webhook received:", payload.type, "for user:", payload.record.email);

    // Solo procesar eventos de creación de usuario
    if (payload.type !== 'INSERT' || payload.table !== 'users') {
      console.log("Ignoring event - not a user insert");
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = payload.record;

    // Solo enviar email si el email NO está confirmado aún
    if (user.email_confirmed_at) {
      console.log("Email already confirmed, skipping verification email");
      return new Response(JSON.stringify({ message: 'Email already confirmed' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener el rol del usuario desde metadata
    const role = user.raw_user_meta_data?.role || 'employee';
    const fullName = user.raw_user_meta_data?.full_name || 'Usuario';

    console.log(`Processing verification email for ${role}: ${user.email}`);

    // Verificar si es un empleado registrado por un Lead
    // Los empleados registrados por Lead tienen email_confirm: true en su metadata
    const isLeadManaged = user.raw_user_meta_data?.managed_by_lead === true;
    
    if (isLeadManaged) {
      console.log("User is managed by Lead, skipping verification email");
      return new Response(JSON.stringify({ message: 'Lead-managed employee, no verification needed' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Crear cliente de Supabase con service role para generar token
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generar enlace de verificación
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: user.email,
    });

    if (linkError) {
      console.error("Error generating verification link:", linkError);
      throw linkError;
    }

    const verificationUrl = linkData.properties?.action_link || '';
    
    if (!verificationUrl) {
      throw new Error("No verification URL generated");
    }

    console.log("Verification link generated successfully");

    // Obtener template según el rol
    const emailHtml = getEmailTemplate(role, fullName, verificationUrl);

    // Enviar email con Resend
    const emailSubject = role === 'refugi_lead' 
      ? '🏢 Verifica tu cuenta empresarial - Refugi'
      : '💜 Verifica tu cuenta - Refugi';

    const fromEmail = 'Refugi <noreply@eclatsenior.com.es>';

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [user.email],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Verification email sent successfully:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent',
        email_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
