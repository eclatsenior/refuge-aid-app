import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const user = userData.user;

    // SECURITY: Verify caller is super admin
    const { data: isSuperAdmin } = await supabaseClient
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!isSuperAdmin) {
      console.error('[ASSIGN-SUBSCRIPTION] Non-admin attempted access:', user.id);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Parse request body
    const { userEmail, productId, priceId, employeeLimit } = await req.json();
    
    if (!userEmail || !productId || !priceId || !employeeLimit) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Find user by email
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profiles) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const targetUserId = profiles.user_id;

    // Check if subscription already exists
    const { data: existingSub } = await supabaseClient
      .from('subscriptions')
      .select('id')
      .eq('refugi_lead_id', targetUserId)
      .single();

    // Calculate subscription end date (30 days from now)
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    const stripeCustomerId = `cus_manual_${targetUserId.substring(0, 8)}`;
    const stripeSubscriptionId = `sub_manual_${Date.now()}`;

    if (existingSub) {
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          product_id: productId,
          price_id: priceId,
          status: 'active',
          employee_limit: employeeLimit,
          current_period_end: currentPeriodEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id);

      if (updateError) {
        console.error('[ASSIGN-SUBSCRIPTION] Update error:', updateError);
        throw new Error('Failed to update subscription');
      }
    } else {
      const { error: insertError } = await supabaseClient
        .from('subscriptions')
        .insert({
          refugi_lead_id: targetUserId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          product_id: productId,
          price_id: priceId,
          status: 'active',
          employee_limit: employeeLimit,
          current_period_end: currentPeriodEnd.toISOString()
        });

      if (insertError) {
        console.error('[ASSIGN-SUBSCRIPTION] Insert error:', insertError);
        throw new Error('Failed to create subscription');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Subscription assigned successfully`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error('[ASSIGN-SUBSCRIPTION] Error:', error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
