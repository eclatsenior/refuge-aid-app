import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'employee' | 'refugi_lead';
  companyData?: {
    company_name: string;
    company_website: string;
    company_role: string;
  };
  redirectOrigin?: string;
  send_custom_verification?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AUTH-SIGNUP] Function started');
    
    const { email, password, fullName, role, companyData, redirectOrigin, send_custom_verification }: SignUpRequest = await req.json();
    
    // Input validation
    if (!email || typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener entre 8 y 128 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: 'El nombre debe tener entre 2 y 100 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!role || !['employee', 'refugi_lead'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Rol inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (companyData) {
      if (companyData.company_name && (typeof companyData.company_name !== 'string' || companyData.company_name.length > 200)) {
        return new Response(
          JSON.stringify({ error: 'Nombre de empresa inválido' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    console.log('[AUTH-SIGNUP] Received signup request:', { email, fullName: fullName.substring(0, 20), role });

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

    // Check if user already exists
  console.log('[AUTH-SIGNUP] Checking if user exists...');
  // Robust email lookup with pagination (avoids missing users not on first page)
  let existingUser: any = null;
  try {
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error('[AUTH-SIGNUP] listUsers error:', error);
        break;
      }
      const found = data?.users?.find((u: any) => (u.email ?? '').toLowerCase() === email.toLowerCase());
      if (found) { existingUser = found; break; }
      if (!data?.users?.length || data.users.length < perPage) break;
      page += 1;
    }
  } catch (e) {
    console.error('[AUTH-SIGNUP] Error while searching users by email:', e);
  }

  let userData: any;
  let isExistingUser = false;

    if (existingUser) {
      console.log('[AUTH-SIGNUP] User already exists:', existingUser.id);
      
      // Check if email is already confirmed
      if (existingUser.email_confirmed_at) {
        console.log('[AUTH-SIGNUP] User already verified, cannot re-register');
        return new Response(
          JSON.stringify({ 
            error: 'Ya existe una cuenta con este correo. Por favor inicia sesión.' 
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // User exists but not verified - resend verification
      console.log('[AUTH-SIGNUP] User exists but not verified, will resend verification email');
      isExistingUser = true;
      userData = { user: existingUser };

      // Update user metadata if provided
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          full_name: fullName,
          role: role,
          ...(companyData && {
            company_name: companyData.company_name,
            company_website: companyData.company_website,
            company_role: companyData.company_role
          })
        }
      });

      // Update password if it's different (optional)
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: password
      });
    } else {
      // Create new user
      console.log('[AUTH-SIGNUP] Creating new user with Admin API...');
      const { data: newUserData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // CRITICAL: Prevents default Supabase confirmation email
        user_metadata: {
          full_name: fullName,
          role: role,
          ...(companyData && {
            company_name: companyData.company_name,
            company_website: companyData.company_website,
            company_role: companyData.company_role
          })
        }
      });

      if (userError) {
        console.error('[AUTH-SIGNUP] Error creating user:', userError);
        const code = (userError as any)?.code;
        const message = (userError as any)?.message ?? '';
        const isEmailExists = code === 'email_exists' || /already been registered/i.test(message);
        if (isEmailExists) {
          console.log('[AUTH-SIGNUP] Detected existing email via createUser error. Falling back to existing-user flow');
          // Ensure we have the existing user loaded
          if (!existingUser) {
            try {
              let page = 1;
              const perPage = 100;
              while (true) {
                const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
                const found = data?.users?.find((u: any) => (u.email ?? '').toLowerCase() === email.toLowerCase());
                if (found) { existingUser = found; break; }
                if (!data?.users?.length || data.users.length < perPage) break;
                page += 1;
              }
            } catch (_) {}
          }
          if (existingUser) {
            isExistingUser = true;
            userData = { user: existingUser };
            // Update metadata and password so user can use the latest
            try {
              await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                user_metadata: {
                  full_name: fullName,
                  role: role,
                  ...(companyData && {
                    company_name: companyData.company_name,
                    company_website: companyData.company_website,
                    company_role: companyData.company_role
                  })
                }
              });
              await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
            } catch (e) {
              console.warn('[AUTH-SIGNUP] Non-fatal: could not update existing user metadata/password', e);
            }
          } else {
            return new Response(
              JSON.stringify({ error: 'Ya existe una cuenta con este correo. Por favor inicia sesión.' }),
              { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: message || 'Error al crear el usuario' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }

      userData = newUserData;
      console.log('[AUTH-SIGNUP] User created successfully:', userData.user.id);
    }

    // Upsert profile (only if new user or updating)
    if (!isExistingUser) {
      console.log('[AUTH-SIGNUP] Upserting profile...');
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: userData.user.id,
          email: email,
          full_name: fullName,
          role: role,
          ...(companyData && {
            company_name: companyData.company_name,
            company_website: companyData.company_website,
            company_role: companyData.company_role
          })
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('[AUTH-SIGNUP] Error creating profile:', profileError);
        // Continue anyway - the handle_new_user trigger might have already created it
      } else {
        console.log('[AUTH-SIGNUP] Profile created successfully');
      }

      // Create employee_status if role is employee
      if (role === 'employee') {
        console.log('[AUTH-SIGNUP] Creating employee status...');
        const { count } = await supabaseAdmin
          .from('employee_status')
          .select('id', { count: 'exact', head: true })
          .eq('employee_id', userData.user.id);

        if (!count || count === 0) {
          const { error: statusInsertError } = await supabaseAdmin
            .from('employee_status')
            .insert([{ employee_id: userData.user.id, mood_level: null, therapy_progress: 0 }]);

          if (statusInsertError) {
            console.error('[AUTH-SIGNUP] Error creating employee status:', statusInsertError);
          }
        } else {
          console.log('[AUTH-SIGNUP] Employee status already exists, skipping insert');
        }
      }
    } else {
      console.log('[AUTH-SIGNUP] Skipping profile/status creation for existing user');
    }

    // Invoke send-verification-email using fetch with service role key
    console.log('[AUTH-SIGNUP] About to invoke send-verification-email with:', {
      email,
      fullName,
      userId: userData.user.id,
      role,
      send_custom_verification
    });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    try {
      const emailResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-verification-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            email: email,
            userName: fullName
          }),
        }
      );
      
      const emailData = await emailResponse.json();
      
      if (!emailResponse.ok) {
        console.error('[AUTH-SIGNUP] Error sending verification email:', emailData);
      } else {
        console.log('[AUTH-SIGNUP] Verification email sent successfully:', emailData);
      }
    } catch (emailError: any) {
      console.error('[AUTH-SIGNUP] Error calling send-verification-email:', emailError.message);
      // Don't fail the signup if email fails
    }

    console.log('[AUTH-SIGNUP] Signup completed successfully');

    const message = isExistingUser 
      ? 'Email de verificación reenviado. Por favor revisa tu correo.'
      : 'Usuario creado. Por favor verifica tu email para completar el registro.';

    return new Response(
      JSON.stringify({ 
        ok: true,
        message,
        is_resend: isExistingUser
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('[AUTH-SIGNUP] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
