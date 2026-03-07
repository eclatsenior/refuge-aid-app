import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getEmailTemplate(code: string, userName: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu cuenta - Refugi</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          
          <!-- Header con gradiente Refugi -->
          <tr>
            <td style="background: linear-gradient(135deg, #A855F7 0%, #F472B6 100%); padding: 48px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);">
                ✨ Bienvenida a Refugi
              </h1>
            </td>
          </tr>
          
          <!-- Contenido -->
          <tr>
            <td style="padding: 48px 32px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                ¡Hola ${userName}! 👋
              </h2>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Gracias por registrarte en Refugi. Para completar tu registro, ingresa este código de verificación en la aplicación:
              </p>
              
              <!-- Código de verificación -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: linear-gradient(135deg, #A855F7 0%, #F472B6 100%); padding: 24px 48px; border-radius: 12px; box-shadow: 0 8px 24px rgba(168, 85, 247, 0.3);">
                      <p style="margin: 0 0 8px; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                        Tu código de verificación
                      </p>
                      <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 700; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                        ${code}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6; text-align: center;">
                Ingresa este código en la aplicación para verificar tu cuenta
              </p>
              
              <!-- Advertencia de expiración -->
              <div style="padding: 20px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-left: 4px solid #F59E0B; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.5;">
                  <strong>⚠️ Importante:</strong> Este código expirará en <strong>15 minutos</strong> por motivos de seguridad.
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 1.5; text-align: center;">
                Si no has creado una cuenta en Refugi, puedes ignorar este correo de forma segura.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 12px; color: #718096; font-size: 14px; text-align: center; line-height: 1.5;">
                ¿Necesitas ayuda? Estamos aquí para apoyarte 💜
              </p>
              <p style="margin: 0; color: #718096; font-size: 14px; text-align: center; line-height: 1.5;">
                📧 <a href="mailto:soporte@refugi.app" style="color: #A855F7; text-decoration: none; font-weight: 500;">soporte@refugi.app</a>
              </p>
              <p style="margin: 16px 0 0; color: #A0AEC0; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Refugi. Cuidando tu bienestar.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication: require either a valid user JWT or service-role key ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[SEND-VERIFICATION] Missing authorization header");
      return new Response(
        JSON.stringify({ success: true, message: "If the email is registered, a verification code has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Allow if the caller is using the service role key (server-to-server)
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
      // Validate as a user JWT
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        console.error("[SEND-VERIFICATION] Invalid JWT:", authError?.message);
        return new Response(
          JSON.stringify({ success: true, message: "If the email is registered, a verification code has been sent." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const { email, userName } = await req.json();

    console.log('[SEND-VERIFICATION] Function invoked with:', {
      email: email ? '***@***' : undefined,
      hasUserName: !!userName
    });

    if (!email) {
      throw new Error("Email is required");
    }

    console.log("[SEND-VERIFICATION] Sending verification email");

    // Buscar usuario por email
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Error finding user");
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Return consistent response to prevent user enumeration
      console.log("[SEND-VERIFICATION] User not found for email, returning success to prevent enumeration");
      return new Response(
        JSON.stringify({ success: true, message: "If the email is registered, a verification code has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Found user:", user.id);

    // Generar código de 6 dígitos
    const code = generateVerificationCode();
    console.log("Generated verification code");

    // Calcular fecha de expiración (15 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Guardar código en la base de datos
    const { error: insertError } = await supabaseAdmin
      .from("email_verification_codes")
      .insert({
        user_id: user.id,
        email: email.toLowerCase(),
        code: code,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      console.error("Error inserting verification code:", insertError);
      throw new Error("Error saving verification code");
    }

    console.log("Verification code saved to database");

    // Enviar email con el código
    const { data, error: emailError } = await resend.emails.send({
      from: "Refugi <no-reply@eclatsenior.com.es>",
      reply_to: ["soporte@eclatsenior.com.es"],
      to: [email],
      subject: "✨ Verifica tu cuenta de Refugi",
      html: getEmailTemplate(code, userName || "Usuario"),
    });

    if (emailError) {
      console.error("Error sending email via Resend:", emailError);
      throw new Error("Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "If the email is registered, a verification code has been sent." 
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
    console.error("[send-verification-email] Error:", error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An error occurred processing your request' 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
