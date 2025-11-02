import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASSIGN-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { userEmail, productId, priceId, employeeLimit } = await req.json();
    
    if (!userEmail || !productId || !priceId || !employeeLimit) {
      throw new Error("Missing required fields: userEmail, productId, priceId, employeeLimit");
    }

    logStep("Request data", { userEmail, productId, priceId, employeeLimit });

    // Find user by email
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profiles) {
      throw new Error(`User not found: ${userEmail}`);
    }

    const targetUserId = profiles.user_id;
    logStep("Target user found", { targetUserId });

    // Check if subscription already exists
    const { data: existingSub } = await supabaseClient
      .from('subscriptions')
      .select('id')
      .eq('refugi_lead_id', targetUserId)
      .single();

    // Calculate subscription end date (30 days from now)
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    // Generate mock Stripe IDs
    const stripeCustomerId = `cus_manual_${targetUserId.substring(0, 8)}`;
    const stripeSubscriptionId = `sub_manual_${Date.now()}`;

    if (existingSub) {
      // Update existing subscription
      logStep("Updating existing subscription", { subscriptionId: existingSub.id });
      
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

      if (updateError) throw updateError;
      logStep("Subscription updated successfully");
    } else {
      // Create new subscription
      logStep("Creating new subscription");
      
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

      if (insertError) throw insertError;
      logStep("Subscription created successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Subscription assigned to ${userEmail}`,
        subscription: {
          productId,
          priceId,
          employeeLimit,
          currentPeriodEnd: currentPeriodEnd.toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in assign-subscription", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
