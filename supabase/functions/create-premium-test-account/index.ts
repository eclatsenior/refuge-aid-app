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

    const { email, password, fullName } = await req.json();
    console.log('[CREATE-PREMIUM-TEST] Request received for:', email);

    // 1. Crear usuario con email confirmado
    console.log('[CREATE-PREMIUM-TEST] Creating user...');
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Email confirmado automáticamente
      user_metadata: {
        full_name: fullName,
        role: 'employee'
      }
    });

    if (userError) {
      console.error('[CREATE-PREMIUM-TEST] Error creating user:', userError);
      throw userError;
    }
    console.log('[CREATE-PREMIUM-TEST] ✅ Usuario creado:', userData.user.id);

    // 2. Crear perfil
    console.log('[CREATE-PREMIUM-TEST] Creating profile...');
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      user_id: userData.user.id,
      email: email,
      full_name: fullName,
      role: 'employee',
      managed_by_lead: false
    });
    
    if (profileError) {
      console.error('[CREATE-PREMIUM-TEST] Error creating profile:', profileError);
      throw profileError;
    }
    console.log('[CREATE-PREMIUM-TEST] ✅ Perfil creado');

    // 3. Crear employee_status
    console.log('[CREATE-PREMIUM-TEST] Creating employee status...');
    const { error: statusError } = await supabaseAdmin.from('employee_status').insert({
      employee_id: userData.user.id,
      mood_level: null,
      therapy_progress: 0
    });
    
    if (statusError) {
      console.error('[CREATE-PREMIUM-TEST] Error creating employee status:', statusError);
      throw statusError;
    }
    console.log('[CREATE-PREMIUM-TEST] ✅ Employee status creado');

    // 4. Crear suscripción Premium/Individual
    console.log('[CREATE-PREMIUM-TEST] Creating premium subscription...');
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1); // 1 año de suscripción

    const { error: subError } = await supabaseAdmin.from('subscriptions').insert({
      refugi_lead_id: userData.user.id,
      stripe_customer_id: `cus_test_${userData.user.id.substring(0, 8)}`,
      stripe_subscription_id: `sub_test_${Date.now()}`,
      product_id: 'prod_TD9UdEM6XDdBZT', // Plan Individual
      price_id: 'price_1SGjBeR3C9Xn67YcQrAPwhDO',
      status: 'active',
      employee_limit: 1,
      current_period_end: currentPeriodEnd.toISOString()
    });
    
    if (subError) {
      console.error('[CREATE-PREMIUM-TEST] Error creating subscription:', subError);
      throw subError;
    }
    console.log('[CREATE-PREMIUM-TEST] ✅ Suscripción Premium creada (válida por 1 año)');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cuenta Premium creada exitosamente',
        user_id: userData.user.id,
        email: email,
        subscription_expires: currentPeriodEnd.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[CREATE-PREMIUM-TEST] ❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
