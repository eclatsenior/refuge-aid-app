import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Database Webhook payload format
interface DatabaseWebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    email: string;
    raw_user_meta_data: {
      role?: string;
      full_name?: string;
      managed_by_lead?: boolean;
    };
    email_confirmed_at: string | null;
  };
  old_record: any;
}

// Auth Hook payload format
interface AuthHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata: {
      role?: string;
      full_name?: string;
      managed_by_lead?: boolean;
    };
    email_confirmed_at: string | null;
  };
}

// Normalized user structure
interface NormalizedUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
  managed_by_lead: boolean;
  email_confirmed_at: string | null;
}

// Get welcome email template (WITHOUT verification link - that's sent by Supabase)
const getWelcomeEmailTemplate = (role: string, userName: string) => {
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
                     <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                       Para activar tu cuenta empresarial, debes verificar tu correo electrónico.
                     </p>
                     <div style="background-color: #eef2ff; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0; border-radius: 4px;">
                       <p style="margin: 0; color: #312e81; font-size: 14px; line-height: 1.6;">
                         <strong>📧 Revisa tu bandeja de entrada</strong><br/>
                         Te hemos enviado un email de verificación desde Supabase. 
                         <strong>Haz clic en el enlace</strong> que encontrarás allí para activar tu cuenta.
                       </p>
                     </div>
                     <p style="margin: 20px 0 10px 0; color: #6b7280; font-size: 13px;">
                       💡 Si no lo ves, revisa tu carpeta de spam o correo no deseado.
                     </p>
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
                     <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                       Para comenzar a usar tu espacio personal, necesitas verificar tu correo electrónico.
                     </p>
                     <div style="background-color: #fce7f3; border-left: 4px solid #ec4899; padding: 16px; margin: 20px 0; border-radius: 4px;">
                       <p style="margin: 0; color: #831843; font-size: 14px; line-height: 1.6;">
                         <strong>📧 Revisa tu bandeja de entrada</strong><br/>
                         Te hemos enviado un email de verificación desde Supabase. 
                         <strong>Haz clic en el enlace</strong> que encontrarás allí para activar tu cuenta.
                       </p>
                     </div>
                     <p style="margin: 20px 0 10px 0; color: #6b7280; font-size: 13px;">
                       💡 Si no lo ves, revisa tu carpeta de spam o correo no deseado.
                     </p>
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

// Normalize payload from Database Webhook OR Auth Hook
const normalizePayload = (payload: any): NormalizedUser | null => {
  // Database Webhook format (type, table, record)
  if (payload.type && payload.table && payload.record) {
    console.log('[VERIFICATION-EMAIL] Detected Database Webhook format');
    
    if (payload.type !== 'INSERT' || payload.table !== 'users') {
      console.log('[VERIFICATION-EMAIL] Skipping non-INSERT event or wrong table');
      return null;
    }
    
    const record = payload.record;
    return {
      id: record.id,
      email: record.email,
      role: record.raw_user_meta_data?.role || 'employee',
      full_name: record.raw_user_meta_data?.full_name || 'Usuario',
      managed_by_lead: record.raw_user_meta_data?.managed_by_lead || false,
      email_confirmed_at: record.email_confirmed_at
    };
  }
  
  // Auth Hook format (user object directly)
  if (payload.user) {
    console.log('[VERIFICATION-EMAIL] Detected Auth Hook format');
    const user = payload.user;
    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'employee',
      full_name: user.user_metadata?.full_name || 'Usuario',
      managed_by_lead: user.user_metadata?.managed_by_lead || false,
      email_confirmed_at: user.email_confirmed_at
    };
  }
  
  console.error('[VERIFICATION-EMAIL] Unknown payload format:', payload);
  return null;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawPayload = await req.json();
    
    console.log('[VERIFICATION-EMAIL] Raw payload received:', {
      hasType: !!rawPayload.type,
      hasTable: !!rawPayload.table,
      hasRecord: !!rawPayload.record,
      hasUser: !!rawPayload.user
    });

    // Normalize the payload
    const user = normalizePayload(rawPayload);
    
    if (!user) {
      return new Response(JSON.stringify({ message: 'Event ignored or invalid payload' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[VERIFICATION-EMAIL] Normalized user data:', {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      managed_by_lead: user.managed_by_lead,
      email_confirmed_at: user.email_confirmed_at
    });
    
    // Skip if user is managed by a Lead (they are auto-confirmed by backend)
    if (user.managed_by_lead) {
      console.log('[VERIFICATION-EMAIL] User managed by Lead, skipping verification email');
      return new Response(JSON.stringify({ message: 'Managed user, no verification needed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
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

    // Step 1: Trigger Supabase native verification email (contains the link)
    console.log('[VERIFICATION-EMAIL] Triggering Supabase native verification for:', user.email);
    
    const appUrl = Deno.env.get('FRONTEND_URL') || supabaseUrl.replace('.supabase.co', '.lovableproject.com');
    const { error: resendError } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${appUrl}/email-verified`
      }
    });

    if (resendError) {
      console.error('[VERIFICATION-EMAIL] Error triggering Supabase verification:', resendError);
      // Don't throw - we'll still try to send the companion email
    } else {
      console.log('[VERIFICATION-EMAIL] ✅ Supabase verification email triggered successfully');
    }

    // Step 2: Send personalized welcome email via Resend (NO link, just instructions)
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.warn('[VERIFICATION-EMAIL] RESEND_API_KEY not configured, skipping companion email');
    } else {
      console.log('[VERIFICATION-EMAIL] Sending companion welcome email via Resend');
      
      const emailHtml = getWelcomeEmailTemplate(user.role, user.full_name);
      
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Refugi <onboarding@resend.dev>',
        to: [user.email],
        subject: user.role === 'refugi_lead' 
          ? '¡Bienvenido a Refugi! - Verifica tu email'
          : '¡Bienvenida a Refugi! 💜 - Verifica tu email',
        html: emailHtml
      });

      if (emailError) {
        console.error('[VERIFICATION-EMAIL] Error sending companion email:', emailError);
        // Don't throw - main verification email was sent by Supabase
      } else {
        console.log('[VERIFICATION-EMAIL] ✅ Companion email sent. ID:', emailData?.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification process initiated',
        recipient: user.email,
        role: user.role
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
