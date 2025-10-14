import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: employees } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'employee');

    if (!employees) throw new Error('No employees found');

    const results = [];

    for (const emp of employees) {
      const { data: riskData } = await supabase.rpc('calculate_risk_score', {
        emp_id: emp.user_id
      });

      if (riskData && riskData.length > 0) {
        const risk = riskData[0];
        
        const { error: insertError } = await supabase
          .from('risk_scores')
          .insert({
            employee_id: emp.user_id,
            score_int: risk.score,
            explain_chips: risk.chips,
            trend_7d: risk.trend_7d,
            trend_30d: risk.trend_30d
          });

        if (!insertError) {
          results.push({ employee_id: emp.user_id, score: risk.score });
        }
      }
    }

    console.log(`✅ Calculated risk scores for ${results.length} employees`);

    return new Response(JSON.stringify({ success: true, count: results.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error calculating risk scores:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
