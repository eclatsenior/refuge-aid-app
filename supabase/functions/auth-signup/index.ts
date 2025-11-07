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
    
    console.log('[AUTH-SIGNUP] Received signup request:', { email, fullName, role });

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

    // Create user with Admin API - email_confirm: false prevents default Supabase email
    console.log('[AUTH-SIGNUP] Creating user with Admin API...');
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
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
      return new Response(
        JSON.stringify({ error: userError.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('[AUTH-SIGNUP] User created successfully:', userData.user.id);

    // Upsert profile
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
      const { error: statusError } = await supabaseAdmin
        .from('employee_status')
        .upsert({
          employee_id: userData.user.id,
          mood_level: null,
          therapy_progress: 0
        }, { onConflict: 'employee_id' });

      if (statusError) {
        console.error('[AUTH-SIGNUP] Error creating employee status:', statusError);
      }
    }

    // Invoke send-verification-email to send our branded email
    console.log('[AUTH-SIGNUP] Invoking send-verification-email...');
    const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke(
      'send-verification-email',
      {
        body: {
          type: 'INSERT',
          table: 'users',
          record: {
            id: userData.user.id,
            email: email,
            raw_user_meta_data: {
              full_name: fullName,
              role: role
            }
          },
          send_custom_verification: send_custom_verification === true,
          redirectOrigin
        }
      }
    );

    if (emailError) {
      console.error('[AUTH-SIGNUP] Error sending verification email:', emailError);
      // Don't fail the signup if email fails
    } else {
      console.log('[AUTH-SIGNUP] Verification email sent successfully');
    }

    console.log('[AUTH-SIGNUP] Signup completed successfully');

    return new Response(
      JSON.stringify({ 
        ok: true,
        message: 'Usuario creado. Por favor verifica tu email para completar el registro.'
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
