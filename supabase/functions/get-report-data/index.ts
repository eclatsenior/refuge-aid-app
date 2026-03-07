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

    console.log('[GET-REPORT-DATA] Fetching comprehensive report data', { period_start, period_end, user_id: user.id });

    // Fetch all data in parallel for efficiency
    const [
      kpisResult,
      incidentsResult,
      riskScoresResult,
      moodCheckinsResult,
      employeeStatusResult,
      emergencyAlertsResult,
      trainingResult,
      casesResult,
      psychReferralsResult,
      hrisDataResult,
      profilesResult
    ] = await Promise.all([
      // KPIs
      supabase.functions.invoke('dashboard-kpis'),
      
      // Incidents with employee details
      supabase
        .from('incidents')
        .select('*, employee:profiles!incidents_employee_id_fkey(full_name, email)')
        .gte('opened_at', period_start)
        .lte('opened_at', period_end)
        .order('opened_at', { ascending: false }),
      
      // Risk scores with employee details
      supabase
        .from('risk_scores')
        .select('*, employee:profiles!risk_scores_employee_id_fkey(full_name, email)')
        .gte('calculated_at', period_start)
        .lte('calculated_at', period_end)
        .order('calculated_at', { ascending: false }),
      
      // Mood check-ins with employee details
      supabase
        .from('mood_check_ins')
        .select('*, employee:profiles!mood_check_ins_employee_id_fkey(full_name, email)')
        .gte('created_at', period_start)
        .lte('created_at', period_end)
        .order('created_at', { ascending: false }),
      
      // Employee status with profiles
      supabase
        .from('employee_status')
        .select('*, profile:profiles!employee_status_employee_id_fkey(full_name, email, role)'),
      
      // Emergency alerts
      supabase
        .from('emergency_alerts')
        .select('*, employee:profiles!emergency_alerts_employee_id_fkey(full_name, email), resolver:profiles!emergency_alerts_resolved_by_fkey(full_name)')
        .gte('created_at', period_start)
        .lte('created_at', period_end)
        .order('created_at', { ascending: false }),
      
      // Training completions
      supabase
        .from('training_completions')
        .select('*, employee:profiles!training_completions_employee_id_fkey(full_name, email)')
        .gte('completed_at', period_start)
        .lte('completed_at', period_end),
      
      // Cases
      supabase
        .from('cases')
        .select('*, employee:profiles!cases_employee_id_fkey(full_name, email), owner:profiles!cases_owner_user_id_fkey(full_name)')
        .gte('created_at', period_start)
        .lte('created_at', period_end)
        .order('created_at', { ascending: false }),
      
      // Psych referrals
      supabase
        .from('psych_referrals')
        .select('*, employee:profiles!psych_referrals_employee_id_fkey(full_name, email)')
        .gte('created_at', period_start)
        .lte('created_at', period_end)
        .order('created_at', { ascending: false }),
      
      // HRIS data
      supabase
        .from('hris_employees_sync')
        .select('*, employee:profiles!hris_employees_sync_employee_id_fkey(full_name, email)'),
      
      // All profiles
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
    ]);

    // Process incidents
    const incidents = incidentsResult.data?.map(inc => ({
      id: inc.id,
      employee_name: inc.employee?.full_name || 'Desconocido',
      employee_email: inc.employee?.email || '',
      employee_id: inc.employee_id,
      type: inc.type,
      status: inc.status,
      opened_at: inc.opened_at,
      closed_at: inc.closed_at,
      sla_target_mins: inc.sla_target_mins,
      sla_breached: inc.sla_breached_bool,
      notes: inc.notes,
      resolution_time_mins: inc.closed_at 
        ? Math.round((new Date(inc.closed_at).getTime() - new Date(inc.opened_at).getTime()) / 60000)
        : null
    })) || [];

    // Process risk scores
    const riskScores = riskScoresResult.data?.map(rs => ({
      employee_name: rs.employee?.full_name || 'Desconocido',
      employee_email: rs.employee?.email || '',
      employee_id: rs.employee_id,
      score: rs.score_int || 0,
      trend_7d: rs.trend_7d,
      trend_30d: rs.trend_30d,
      chips: rs.explain_chips || [],
      calculated_at: rs.calculated_at
    })) || [];

    // Get latest risk score per employee
    const latestRiskScores = new Map();
    riskScores.forEach(rs => {
      if (!latestRiskScores.has(rs.employee_id) || 
          new Date(rs.calculated_at) > new Date(latestRiskScores.get(rs.employee_id).calculated_at)) {
        latestRiskScores.set(rs.employee_id, rs);
      }
    });

    // Process mood check-ins
    const moodCheckins = moodCheckinsResult.data?.map(mc => ({
      employee_name: mc.employee?.full_name || 'Desconocido',
      employee_email: mc.employee?.email || '',
      employee_id: mc.employee_id,
      mood_level: mc.mood_level,
      status: mc.status,
      notes: mc.notes,
      is_anonymous: mc.is_anonymous_bool,
      location_data: mc.location_data,
      created_at: mc.created_at
    })) || [];

    // Process emergency alerts
    const emergencyAlerts = emergencyAlertsResult.data?.map(alert => ({
      id: alert.id,
      employee_name: alert.employee?.full_name || 'Desconocido',
      employee_email: alert.employee?.email || '',
      employee_id: alert.employee_id,
      alert_type: alert.alert_type,
      message: alert.message,
      location_data: alert.location_data,
      is_resolved: alert.is_resolved,
      resolved_by_name: alert.resolver?.full_name || null,
      resolved_at: alert.resolved_at,
      created_at: alert.created_at,
      resolution_time_mins: alert.resolved_at 
        ? Math.round((new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime()) / 60000)
        : null
    })) || [];

    // Process training completions
    const trainingCompletions = trainingResult.data?.map(tc => ({
      employee_name: tc.employee?.full_name || 'Desconocido',
      employee_email: tc.employee?.email || '',
      employee_id: tc.employee_id,
      course_code: tc.course_code,
      completed_at: tc.completed_at,
      expires_at: tc.expires_at
    })) || [];

    // Process cases
    const cases = casesResult.data?.map(c => ({
      id: c.id,
      employee_name: c.employee?.full_name || 'Desconocido',
      employee_email: c.employee?.email || '',
      employee_id: c.employee_id,
      state: c.state,
      playbook: c.playbook,
      summary: c.summary,
      owner_name: c.owner?.full_name || 'Sin asignar',
      next_action_at: c.next_action_at,
      created_at: c.created_at,
      updated_at: c.updated_at
    })) || [];

    // Process psych referrals
    const psychReferrals = psychReferralsResult.data?.map(pr => ({
      id: pr.id,
      employee_name: pr.employee?.full_name || 'Desconocido',
      employee_email: pr.employee?.email || '',
      employee_id: pr.employee_id,
      status: pr.status,
      provider_name: pr.provider_name,
      appointment_at: pr.appointment_at,
      notes: pr.notes,
      created_at: pr.created_at
    })) || [];

    // Process HRIS data
    const hrisData = hrisDataResult.data?.map(hris => ({
      employee_name: hris.employee?.full_name || 'Desconocido',
      employee_email: hris.employee?.email || '',
      employee_id: hris.employee_id,
      external_id: hris.external_id,
      department: hris.department,
      location: hris.location,
      shift: hris.shift,
      status: hris.status,
      synced_at: hris.synced_at
    })) || [];

    // Build comprehensive employee profiles
    const employeeProfiles = (profilesResult.data || []).map(profile => {
      const empStatus = employeeStatusResult.data?.find(es => es.employee_id === profile.user_id);
      const latestRisk = latestRiskScores.get(profile.user_id);
      const empMoodCheckins = moodCheckins.filter(mc => mc.employee_id === profile.user_id);
      const empIncidents = incidents.filter(i => i.employee_id === profile.user_id);
      const empAlerts = emergencyAlerts.filter(a => a.employee_id === profile.user_id);
      const empTraining = trainingCompletions.filter(tc => tc.employee_id === profile.user_id);
      const empCases = cases.filter(c => c.employee_id === profile.user_id);
      const empReferrals = psychReferrals.filter(pr => pr.employee_id === profile.user_id);
      const empHris = hrisData.find(h => h.employee_id === profile.user_id);

      return {
        id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        current_status: {
          is_online: empStatus?.is_online || false,
          last_check_in: empStatus?.last_check_in,
          therapy_progress: empStatus?.therapy_progress || 0,
          emergency_alert: empStatus?.emergency_alert || false
        },
        risk: {
          current_score: latestRisk?.score || 0,
          trend_7d: latestRisk?.trend_7d || 0,
          trend_30d: latestRisk?.trend_30d || 0,
          chips: latestRisk?.chips || []
        },
        mood: {
          latest_level: empStatus?.mood_level,
          avg_period: empMoodCheckins.length 
            ? empMoodCheckins.reduce((sum, mc) => sum + mc.mood_level, 0) / empMoodCheckins.length 
            : null,
          total_checkins: empMoodCheckins.length
        },
        activity: {
          total_incidents: empIncidents.length,
          total_alerts: empAlerts.length,
          total_checkins: empMoodCheckins.length,
          active_cases: empCases.filter(c => c.state !== 'cerrado').length
        },
        training: {
          courses_completed: empTraining.length,
          completion_percentage: empTraining.length > 0 ? (empTraining.length / 2) * 100 : 0
        },
        hris: empHris
      };
    });

    // Calculate comprehensive statistics
    const stats = {
      incidents: {
        total: incidents.length,
        by_type: incidents.reduce((acc, i) => {
          acc[i.type] = (acc[i.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_status: incidents.reduce((acc, i) => {
          acc[i.status] = (acc[i.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        sla_breached: incidents.filter(i => i.sla_breached).length,
        avg_resolution_time: incidents.filter(i => i.resolution_time_mins).length > 0
          ? incidents.reduce((sum, i) => sum + (i.resolution_time_mins || 0), 0) / incidents.filter(i => i.resolution_time_mins).length
          : 0
      },
      alerts: {
        total: emergencyAlerts.length,
        resolved: emergencyAlerts.filter(a => a.is_resolved).length,
        pending: emergencyAlerts.filter(a => !a.is_resolved).length,
        avg_resolution_time: emergencyAlerts.filter(a => a.resolution_time_mins).length > 0
          ? emergencyAlerts.reduce((sum, a) => sum + (a.resolution_time_mins || 0), 0) / emergencyAlerts.filter(a => a.resolution_time_mins).length
          : 0
      },
      mood: {
        total_checkins: moodCheckins.length,
        avg_level: moodCheckins.length > 0
          ? moodCheckins.reduce((sum, mc) => sum + mc.mood_level, 0) / moodCheckins.length
          : null,
        by_level: moodCheckins.reduce((acc, mc) => {
          acc[mc.mood_level] = (acc[mc.mood_level] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      },
      risk: {
        avg_score: Array.from(latestRiskScores.values()).length > 0
          ? Array.from(latestRiskScores.values()).reduce((sum, rs) => sum + rs.score, 0) / latestRiskScores.size
          : 0,
        high_risk: Array.from(latestRiskScores.values()).filter(rs => rs.score > 70).length,
        medium_risk: Array.from(latestRiskScores.values()).filter(rs => rs.score >= 40 && rs.score <= 70).length,
        low_risk: Array.from(latestRiskScores.values()).filter(rs => rs.score < 40).length
      },
      training: {
        total_completions: trainingCompletions.length,
        by_course: trainingCompletions.reduce((acc, tc) => {
          acc[tc.course_code] = (acc[tc.course_code] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        employees_100_percent: employeeProfiles.filter(ep => ep.training.completion_percentage === 100).length
      },
      cases: {
        total: cases.length,
        by_state: cases.reduce((acc, c) => {
          acc[c.state] = (acc[c.state] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      referrals: {
        total: psychReferrals.length,
        by_status: psychReferrals.reduce((acc, pr) => {
          acc[pr.status] = (acc[pr.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    // Build timeline of important events
    const timeline = [
      ...emergencyAlerts.map(a => ({ type: 'alert', date: a.created_at, employee: a.employee_name, description: `Alerta: ${a.alert_type}` })),
      ...incidents.map(i => ({ type: 'incident', date: i.opened_at, employee: i.employee_name, description: `Incidente: ${i.type}` })),
      ...cases.map(c => ({ type: 'case', date: c.created_at, employee: c.employee_name, description: `Caso: ${c.state}` })),
      ...psychReferrals.map(pr => ({ type: 'referral', date: pr.created_at, employee: pr.employee_name, description: `Referencia psicológica: ${pr.status}` }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const reportData = {
      metadata: {
        period: { start: period_start, end: period_end },
        generated_at: new Date().toISOString(),
        generated_by: user.email,
        total_employees: employeeProfiles.length
      },
      kpis: kpisResult.data,
      statistics: stats,
      incidents,
      emergencyAlerts,
      riskScores: Array.from(latestRiskScores.values()),
      allRiskScores: riskScores,
      moodCheckins,
      trainingCompletions,
      cases,
      psychReferrals,
      hrisData,
      employeeProfiles,
      timeline
    };

    console.log('[GET-REPORT-DATA] Comprehensive report data prepared', { 
      incidents: incidents.length,
      alerts: emergencyAlerts.length,
      employees: employeeProfiles.length,
      mood_checkins: moodCheckins.length,
      risk_scores: riskScores.length,
      training_completions: trainingCompletions.length,
      cases: cases.length,
      psych_referrals: psychReferrals.length,
      hris_data: hrisData.length,
      timeline_events: timeline.length,
      statistics: {
        incidents_total: stats.incidents.total,
        alerts_total: stats.alerts.total,
        mood_total: stats.mood.total_checkins,
        risk_high: stats.risk.high_risk,
        risk_medium: stats.risk.medium_risk,
        risk_low: stats.risk.low_risk
      }
    });

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('[GET-REPORT-DATA] Error:', error.message);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
