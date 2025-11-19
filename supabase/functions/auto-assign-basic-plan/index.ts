import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoAssignRequest {
  user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AUTO-ASSIGN-BASIC-PLAN] Function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { user_id } = await req.json() as AutoAssignRequest;
    console.log('[AUTO-ASSIGN-BASIC-PLAN] Processing for user_id:', user_id);

    if (!user_id) {
      throw new Error('user_id is required');
    }

    // Verify user exists and is refugi_lead
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      console.error('[AUTO-ASSIGN-BASIC-PLAN] Profile not found:', profileError);
      throw new Error(`Profile not found: ${profileError.message}`);
    }

    if (profile.role !== 'refugi_lead') {
      console.log('[AUTO-ASSIGN-BASIC-PLAN] User is not refugi_lead, skipping');
      return new Response(
        JSON.stringify({ message: 'User is not refugi_lead, subscription not assigned' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('refugi_lead_id', user_id)
      .maybeSingle();

    if (existingSub) {
      console.log('[AUTO-ASSIGN-BASIC-PLAN] Subscription already exists, skipping');
      return new Response(
        JSON.stringify({ message: 'Subscription already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create Basic Plan subscription
    const basicPlan = {
      product_id: 'prod_TD9YFQnIPhkgz4',
      price_id: 'price_1SGjFHR3C9Xn67YcDTCa71lq',
      employee_limit: 15
    };

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        refugi_lead_id: user_id,
        stripe_customer_id: `auto_${user_id.slice(0, 8)}`,
        stripe_subscription_id: `auto_sub_${user_id.slice(0, 8)}`,
        status: 'active',
        product_id: basicPlan.product_id,
        price_id: basicPlan.price_id,
        employee_limit: basicPlan.employee_limit,
        current_period_start: new Date().toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error('[AUTO-ASSIGN-BASIC-PLAN] Error creating subscription:', subError);
      throw new Error(`Failed to create subscription: ${subError.message}`);
    }

    console.log('[AUTO-ASSIGN-BASIC-PLAN] Subscription created successfully:', subscription.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Basic Plan assigned successfully',
        subscription_id: subscription.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[AUTO-ASSIGN-BASIC-PLAN] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
