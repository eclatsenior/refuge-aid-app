import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CREATE-PREMIUM-TEST] Function started');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // SECURITY: Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // SECURITY: Only super admins may create premium test accounts
    const { data: isSuperAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', callerUser.id)
      .maybeSingle();

    if (!isSuperAdmin) {
      console.error('[CREATE-PREMIUM-TEST] Non-admin attempted access:', callerUser.id);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { email, password, fullName } = await req.json();
    console.log('[CREATE-PREMIUM-TEST] Request received for:', email);

    // 1. Crear usuario con email confirmado
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'employee'
      }
    });

    if (userError) {
      console.error('[CREATE-PREMIUM-TEST] Error creating user:', userError);
      throw new Error('Failed to create user');
    }

    // 2. Crear perfil
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      user_id: userData.user.id,
      email: email,
      full_name: fullName,
      role: 'employee',
      managed_by_lead: false
    });
    
    if (profileError) {
      console.error('[CREATE-PREMIUM-TEST] Error creating profile:', profileError);
      throw new Error('Failed to create profile');
    }

    // 3. Crear employee_status
    const { error: statusError } = await supabaseAdmin.from('employee_status').insert({
      employee_id: userData.user.id,
      mood_level: null,
      therapy_progress: 0
    });
    
    if (statusError) {
      console.error('[CREATE-PREMIUM-TEST] Error creating employee status:', statusError);
      throw new Error('Failed to create employee status');
    }

    // 4. Crear suscripción Premium/Individual
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

    const { error: subError } = await supabaseAdmin.from('subscriptions').insert({
      refugi_lead_id: userData.user.id,
      stripe_customer_id: `cus_test_${userData.user.id.substring(0, 8)}`,
      stripe_subscription_id: `sub_test_${Date.now()}`,
      product_id: 'prod_TD9UdEM6XDdBZT',
      price_id: 'price_1SGjBeR3C9Xn67YcQrAPwhDO',
      status: 'active',
      employee_limit: 1,
      current_period_end: currentPeriodEnd.toISOString()
    });
    
    if (subError) {
      console.error('[CREATE-PREMIUM-TEST] Error creating subscription:', subError);
      throw new Error('Failed to create subscription');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Premium account created successfully',
        user_id: userData.user.id,
        email: email,
        subscription_expires: currentPeriodEnd.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[CREATE-PREMIUM-TEST] Error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
