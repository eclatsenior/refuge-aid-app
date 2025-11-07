import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const redirect = url.searchParams.get('redirect');
    const buildRedirect = (pathWithQuery: string) => {
      if (redirect && (redirect.startsWith('http://') || redirect.startsWith('https://'))) {
        return redirect;
      }
      return `${url.origin}${pathWithQuery}`;
    };

    if (!token) {
      console.error('No token provided');
      return new Response(
        null,
        {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': buildRedirect('/auth?error=invalid_token'),
          },
        }
      );
    }

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

    console.log('Verifying token:', token);

    // Fetch and validate the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token not found or already used:', tokenError);
      return new Response(
        null,
        {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': buildRedirect('/auth?error=invalid_token'),
          },
        }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now > expiresAt) {
      console.error('Token expired');
      return new Response(
        null,
        {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': buildRedirect('/auth?error=token_expired'),
          },
        }
      );
    }

    // Mark token as used
    const { error: updateError } = await supabaseAdmin
      .from('email_verification_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Error marking token as used:', updateError);
      throw updateError;
    }

    // Mark email as verified using Admin API
    const { error: verifyError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    );

    if (verifyError) {
      console.error('Error verifying email:', verifyError);
      throw verifyError;
    }

    console.log('Email verified successfully for user:', tokenData.user_id);

    // Redirect to success page
    return new Response(
      null,
      {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': buildRedirect('/email-verified'),
        },
      }
    );

  } catch (error) {
    console.error('Error in verify-custom-email function:', error);
    const url = new URL(req.url);
    return new Response(
      null,
      {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': buildRedirect('/auth?error=verification_failed'),
        },
      }
    );
  }
});
