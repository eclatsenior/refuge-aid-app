import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // SECURITY: Require JWT and verify super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: isSuperAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Super admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { email, password, fullName } = await req.json();

    // Input validation
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and fullName are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name must be between 2 and 100 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return new Response(
        JSON.stringify({ error: 'Password must be between 8 and 128 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Creating Refugi Lead test account by super admin:', user.email);

    // Create user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim(), role: 'refugi_lead' }
    });

    if (createError) throw new Error(`Failed to create user: ${createError.message}`);

    const userId = authData.user.id;

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify profile
    const { error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (profileCheckError) throw new Error('Profile was not created by trigger');

    // Create subscription
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        refugi_lead_id: userId,
        product_id: 'prod_TD9YFQnIPhkgz4',
        price_id: 'price_1SGjFHR3C9Xn67YcDTCa71lq',
        status: 'active',
        employee_limit: 15,
        current_period_end: subscriptionEndDate.toISOString(),
        stripe_customer_id: `test_cus_${userId.substring(0, 8)}`,
        stripe_subscription_id: `test_sub_${userId.substring(0, 8)}`
      });

    if (subscriptionError) throw new Error(`Failed to create subscription: ${subscriptionError.message}`);

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'create_test_refugi_lead',
      resource_type: 'user',
      resource_id: userId,
      metadata: { target_email: email, performed_by: user.email }
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email,
        subscription_end: subscriptionEndDate.toISOString(),
        message: 'Refugi Lead test account created with Basic Plan'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
