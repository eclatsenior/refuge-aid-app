import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const PLAN_LIMITS = {
  'prod_TD9YFQnIPhkgz4': 10,  // Plan Básico
  'prod_TD9o6VZUCKCnhB': 25,  // Plan Intermedio
  'prod_TD9qO6wy051a2r': 50,  // Plan Empresarial
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    
    // Decode the JWT to extract user info (Supabase already validates JWT via verify_jwt=true)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) throw new Error("Invalid JWT format");
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.sub;
    const userEmail = payload.email;
    
    if (!userId || !userEmail) throw new Error("User not authenticated or email not available");
    logStep("User authenticated from JWT", { userId, email: userEmail });

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, managed_by_lead, user_id, email, full_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      logStep("Profile not found", { error: profileError?.message });
      return new Response(JSON.stringify({ 
        subscribed: false,
        type: 'none',
        product_id: null,
        subscription_end: null,
        employee_limit: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Profile loaded", { role: profile.role, managed: profile.managed_by_lead });

    // Si es empleado, primero intentar acceso por empresa (Lead asignado)
    if (profile.role === 'employee') {
      logStep("Checking company-managed employee access");
      
      const { data: assignment, error: assignmentError } = await supabaseClient
        .from('employee_assignments')
        .select('refugi_lead_id')
        .eq('employee_id', userId)
        .maybeSingle();

      if (assignmentError) {
        logStep("Error checking assignment", { error: assignmentError.message });
      }

      if (assignment?.refugi_lead_id) {
        logStep("Assignment found", { leadId: assignment.refugi_lead_id });

        const { data: leadSub, error: leadSubError } = await supabaseClient
          .from('subscriptions')
          .select('*')
          .eq('refugi_lead_id', assignment.refugi_lead_id)
          .eq('status', 'active')
          .gt('current_period_end', new Date().toISOString())
          .order('current_period_end', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (leadSubError) {
          logStep("Error checking lead subscription", { error: leadSubError.message });
        }

        if (leadSub) {
          logStep("Lead has active subscription", {
            productId: leadSub.product_id,
            employeeLimit: leadSub.employee_limit,
          });

          return new Response(JSON.stringify({
            subscribed: true,
            type: 'managed',
            managed_by: assignment.refugi_lead_id,
            product_id: leadSub.product_id,
            subscription_end: leadSub.current_period_end,
            employee_limit: leadSub.employee_limit,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }

      logStep("No valid company subscription found for employee");
    }

    // Si es empleado individual (no gestionado) o si el Lead no tiene sub activa
    if (profile.role === 'employee') {
      logStep("Checking individual employee subscription");
      
      // Buscar suscripción individual en tabla local
      const { data: individualSub, error: individualSubError } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('refugi_lead_id', userId) // Empleado individual usa su propio user_id
        .eq('product_id', 'prod_TD9UdEM6XDdBZT') // Plan individual
        .eq('status', 'active')
        .single();
      
      if (individualSub && !individualSubError && new Date(individualSub.current_period_end) > new Date()) {
        logStep("Individual subscription found", { 
          productId: individualSub.product_id 
        });
        
        return new Response(JSON.stringify({
          subscribed: true,
          type: 'individual',
          product_id: individualSub.product_id,
          subscription_end: individualSub.current_period_end,
          employee_limit: 1
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // No tiene ninguna suscripción activa
      logStep("No active subscription found for individual employee");
      return new Response(JSON.stringify({ 
        subscribed: false,
        type: 'none',
        product_id: null,
        subscription_end: null,
        employee_limit: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Para Refugi Leads, continuar con la lógica existente de Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    // If no Stripe customer found, check local subscriptions table
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking local subscriptions table");
      
      const { data: localSub, error: subError } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('refugi_lead_id', userId)
        .eq('status', 'active')
        .single();
      
      if (subError || !localSub) {
        logStep("No local subscription found either", { error: subError?.message });
        return new Response(JSON.stringify({ 
          subscribed: false,
          product_id: null,
          subscription_end: null,
          employee_limit: 0
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      logStep("Found local subscription", { 
        productId: localSub.product_id,
        employeeLimit: localSub.employee_limit 
      });
      
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: localSub.product_id,
        subscription_end: localSub.current_period_end,
        employee_limit: localSub.employee_limit
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let employeeLimit = 0;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      productId = subscription.items.data[0].price.product as string;
      employeeLimit = PLAN_LIMITS[productId as keyof typeof PLAN_LIMITS] || 0;
      logStep("Determined subscription details", { productId, employeeLimit });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      employee_limit: employeeLimit
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
