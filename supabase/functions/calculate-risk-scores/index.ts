import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Authenticate and get refugi_lead user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // CRITICAL: Filter only employees assigned to this Lead
    const { data: assignments } = await supabase
      .from('employee_assignments')
      .select('employee_id')
      .eq('refugi_lead_id', user.id);

    if (!assignments || assignments.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        count: 0, 
        message: 'No employees assigned' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const assignedEmployeeIds = assignments.map(a => a.employee_id);
    const results = [];

    // Calculate risk score only for assigned employees
    for (const empId of assignedEmployeeIds) {
      const { data: riskData } = await supabase.rpc('calculate_risk_score', {
        emp_id: empId
      });

      if (riskData && riskData.length > 0) {
        const risk = riskData[0];
        
        // Upsert to avoid duplicates
        const { error: upsertError } = await supabase
          .from('risk_scores')
          .upsert({
            employee_id: empId,
            score_int: risk.score,
            explain_chips: risk.chips,
            trend_7d: risk.trend_7d,
            trend_30d: risk.trend_30d,
            calculated_at: new Date().toISOString()
          }, {
            onConflict: 'employee_id',
            ignoreDuplicates: false
          });

        if (!upsertError) {
          results.push({ employee_id: empId, score: risk.score });
        }
      }
    }

    console.log(`✅ Calculated risk scores for ${results.length} employees (Lead: ${user.id})`);

    return new Response(JSON.stringify({ 
      success: true, 
      count: results.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('[calculate-risk-scores] Error:', error.message);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
