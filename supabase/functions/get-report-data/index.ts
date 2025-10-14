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

    const { period_start, period_end } = await req.json();

    console.log('[GET-REPORT-DATA] Fetching report data', { period_start, period_end, user_id: user.id });

    // Fetch KPIs
    const { data: kpis } = await supabase.functions.invoke('dashboard-kpis');

    // Fetch incidents in period
    const { data: incidents } = await supabase
      .from('incidents')
      .select(`
        *,
        employee:profiles!employee_id(full_name, email)
      `)
      .gte('opened_at', period_start)
      .lte('opened_at', period_end);

    // Transform incidents for PDF
    const incidentsFormatted = incidents?.map(inc => ({
      ...inc,
      employee_name: inc.employee?.full_name || 'Desconocido'
    })) || [];

    // Fetch risk scores in period
    const { data: riskScores } = await supabase
      .from('risk_scores')
      .select('*')
      .gte('calculated_at', period_start)
      .lte('calculated_at', period_end);

    // Fetch mood check-ins in period
    const { data: moodCheckins } = await supabase
      .from('mood_check_ins')
      .select('*')
      .gte('created_at', period_start)
      .lte('created_at', period_end);

    // Calculate mood stats
    const moodStats = {
      avg: moodCheckins?.length 
        ? moodCheckins.reduce((sum, m) => sum + m.mood_level, 0) / moodCheckins.length
        : 0,
      count: moodCheckins?.length || 0
    };

    // Fetch employee summary
    const { data: employeeSummary } = await supabase
      .from('employee_status')
      .select(`
        *,
        profile:profiles!employee_id(full_name, email)
      `);

    const employeeSummaryFormatted = employeeSummary?.map(emp => ({
      full_name: emp.profile?.full_name || 'Desconocido',
      email: emp.profile?.email || '',
      risk_score: 0, // Would need to fetch latest risk score
      mood_level: emp.mood_level,
      is_online: emp.is_online
    })) || [];

    const reportData = {
      period: { start: period_start, end: period_end },
      kpis,
      incidents: incidentsFormatted,
      riskScores: riskScores || [],
      moodStats,
      employeeSummary: employeeSummaryFormatted,
      generated_at: new Date().toISOString()
    };

    console.log('[GET-REPORT-DATA] Report data prepared', { 
      incidents_count: incidentsFormatted.length,
      employees_count: employeeSummaryFormatted.length 
    });

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('[GET-REPORT-DATA] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
