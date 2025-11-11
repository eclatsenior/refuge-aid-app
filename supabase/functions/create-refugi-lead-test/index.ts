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
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and fullName are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Creating Refugi Lead test account:', email);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Step 1: Create user in auth
    console.log('Step 1: Creating user in auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'refugi_lead'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log('User created with ID:', userId);

    // Step 2: Create profile
    console.log('Step 2: Creating profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        email: email,
        full_name: fullName,
        role: 'refugi_lead'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Step 3: Create subscription with Basic Plan
    console.log('Step 3: Creating Basic Plan subscription...');
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1); // 1 year from now

    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        refugi_lead_id: userId,
        product_id: 'prod_TD9YFQnIPhkgz4', // Basic Plan
        price_id: 'price_1SGjFHR3C9Xn67YcDTCa71lq',
        status: 'active',
        employee_limit: 10,
        current_period_end: subscriptionEndDate.toISOString(),
        stripe_customer_id: `test_cus_${userId.substring(0, 8)}`,
        stripe_subscription_id: `test_sub_${userId.substring(0, 8)}`
      });

    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError);
      throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
    }

    console.log('Refugi Lead test account created successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email: email,
        subscription_end: subscriptionEndDate.toISOString(),
        message: 'Refugi Lead test account created with Basic Plan'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error creating Refugi Lead test account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
