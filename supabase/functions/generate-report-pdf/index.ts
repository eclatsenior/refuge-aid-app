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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { period_start, period_end, scope } = await req.json();

    const { data: kpis } = await supabase.rpc('get_dashboard_kpis', {
      scope_filter: scope || '{}'
    });

    const reportContent = JSON.stringify({
      period: { start: period_start, end: period_end },
      kpis,
      generated_at: new Date().toISOString()
    }, null, 2);

    const fileName = `report_${period_start}_${period_end}.json`;
    const fileUrl = `https://example.com/reports/${fileName}`;

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        period_start,
        period_end,
        scope,
        generated_by: user.id,
        file_url: fileUrl
      })
      .select()
      .single();

    if (reportError) throw reportError;

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'download_report',
      resource_type: 'report',
      resource_id: report.id
    });

    return new Response(JSON.stringify({ report, file_url: fileUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
