import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Parametrización del remitente y marca
const RESEND_FROM_ADDRESS = Deno.env.get("RESEND_FROM_ADDRESS") || "Refugi <onboarding@resend.dev>";
const RESEND_BRAND_NAME = Deno.env.get("RESEND_BRAND_NAME") || "Refugi";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions for the webhook payloads
interface DatabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
      role?: 'refugi_lead' | 'employee';
      managed_by_lead?: boolean;
    };
  };
  old_record: null | Record<string, unknown>;
}

interface AuthHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      role?: 'refugi_lead' | 'employee';
      managed_by_lead?: boolean;
    };
  };
}

interface NormalizedUser {
  id: string;
  email: string;
  full_name: string;
  role: 'refugi_lead' | 'employee';
  managed_by_lead: boolean;
}

// Generate secure random token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Get branded verification email template
function getVerificationEmailTemplate(userName: string, role: string, verificationUrl: string): string {
  const isLead = role === 'refugi_lead';
  const gradientColors = isLead 
    ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);' 
    : 'background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);';
  
  const roleText = isLead ? 'Refugi Lead' : 'Refugi';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifica tu cuenta - Refugi</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header with gradient -->
              <tr>
                <td style="${gradientColors} padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    ✨ Bienvenido a ${roleText}
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                    ¡Hola ${userName}!
                  </h2>
                  
                  <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Gracias por registrarte en Refugi. Estamos encantados de tenerte con nosotros. Para completar tu registro y acceder a todas las funcionalidades, necesitamos que verifiques tu dirección de correo electrónico.
                  </p>
                  
                  <p style="margin: 0 0 32px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Simplemente haz clic en el botón de abajo para verificar tu cuenta:
                  </p>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding: 0 0 32px;">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 48px; ${gradientColors} color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                          Verificar mi cuenta
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 16px; color: #718096; font-size: 14px; line-height: 1.5;">
                    Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
                  </p>
                  
                  <p style="margin: 0 0 32px; padding: 12px; background-color: #f7fafc; border-radius: 6px; color: #667eea; font-size: 13px; word-break: break-all;">
                    ${verificationUrl}
                  </p>
                  
                  <div style="padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <strong>⚠️ Importante:</strong> Este enlace expirará en 24 horas por motivos de seguridad.
                    </p>
                  </div>
                  
                  <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">
                    Si no has creado una cuenta en Refugi, puedes ignorar este correo de forma segura.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 12px; color: #718096; font-size: 14px; text-align: center; line-height: 1.5;">
                    ¿Necesitas ayuda? Estamos aquí para apoyarte.
                  </p>
                  <p style="margin: 0; color: #718096; font-size: 14px; text-align: center; line-height: 1.5;">
                    📧 <a href="mailto:soporte@refugi.app" style="color: #667eea; text-decoration: none;">soporte@refugi.app</a>
                  </p>
                  <p style="margin: 16px 0 0; color: #a0aec0; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} Refugi. Cuidando tu bienestar.
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
}

// Normalize payload from Database Webhook OR Auth Hook
function normalizePayload(payload: any): NormalizedUser | null {
  // Database Webhook format
  if (payload.type && payload.table && payload.record) {
    if (payload.type !== 'INSERT' || payload.table !== 'users') {
      return null;
    }
    
    const record = payload.record;
    return {
      id: record.id,
      email: record.email,
      role: record.raw_user_meta_data?.role || 'employee',
      full_name: record.raw_user_meta_data?.full_name || 'Usuario',
      managed_by_lead: record.raw_user_meta_data?.managed_by_lead || false,
    };
  }
  
  // Auth Hook format
  if (payload.user) {
    const user = payload.user;
    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'employee',
      full_name: user.user_metadata?.full_name || 'Usuario',
      managed_by_lead: user.user_metadata?.managed_by_lead || false,
    };
  }
  
  return null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    const normalizedUser = normalizePayload(payload);
    
    if (!normalizedUser) {
      console.log('Invalid payload or non-INSERT event, ignoring');
      return new Response(
        JSON.stringify({ message: 'Event ignored' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Normalized user:', normalizedUser);

    // IMPORTANTE: Solo enviar correo personalizado si viene con flag explícito
    // Esto previene duplicados cuando se usa el signup nativo de Supabase
    if (!payload.send_custom_verification) {
      console.log('No custom verification flag detected, skipping branded email (using Supabase native email instead)');
      return new Response(
        JSON.stringify({ 
          message: 'Event ignored - using Supabase native verification email',
          user_id: normalizedUser.id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Skip sending email if user is managed by a lead
    if (normalizedUser.managed_by_lead) {
      console.log('User is managed by lead, skipping verification email');
      return new Response(
        JSON.stringify({ 
          message: 'Email sending skipped - user managed by lead',
          user_id: normalizedUser.id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate secure verification token
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    console.log('Storing verification token...');
    const { error: tokenError } = await supabaseAdmin
      .from('email_verification_tokens')
      .insert({
        user_id: normalizedUser.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error storing verification token:', tokenError);
      throw tokenError;
    }

    // Build verification URL - include redirect to frontend if provided
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectOrigin = typeof payload.redirectOrigin === 'string' ? payload.redirectOrigin : '';
    let verificationUrl = `${supabaseUrl}/functions/v1/verify-custom-email?token=${token}`;
    if (redirectOrigin && (redirectOrigin.startsWith('http://') || redirectOrigin.startsWith('https://'))) {
      const redirectParam = encodeURIComponent(`${redirectOrigin}/email-verified`);
      verificationUrl += `&redirect=${redirectParam}`;
    }

    console.log('Verification URL:', verificationUrl);

    // Send ONLY ONE branded verification email via Resend
    console.log('Sending branded verification email via Resend...');
    const emailHtml = getVerificationEmailTemplate(
      normalizedUser.full_name,
      normalizedUser.role,
      verificationUrl
    );
    
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: RESEND_FROM_ADDRESS,
      to: [normalizedUser.email],
      subject: `✨ Verifica tu cuenta de ${RESEND_BRAND_NAME}${normalizedUser.role === 'refugi_lead' ? ' Lead' : ''}`,
      html: emailHtml,
    });

    if (resendError) {
      console.error('Error sending verification email via Resend:', resendError);
      throw resendError;
    }

    console.log('Verification email sent successfully via Resend:', resendData);

    return new Response(
      JSON.stringify({ 
        message: 'Verification email sent successfully',
        user_id: normalizedUser.id,
        resend_data: resendData,
        expires_at: expiresAt.toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-verification-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
