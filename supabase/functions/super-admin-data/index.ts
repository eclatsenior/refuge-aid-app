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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Client with user auth to check permissions
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    // Service client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CRITICAL: Verify user is super admin
    const { data: isSuperAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!isSuperAdmin) {
      console.error('Access denied: User is not super admin', user.id);
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();
    console.log('Super admin action:', action, 'by user:', user.email);

    let result;

    switch (action) {
      case 'get_overview': {
        // Get all overview stats
        const [
          { count: totalUsers },
          { count: totalEmployees },
          { count: totalLeads },
          { count: activeSubscriptions },
          { count: totalAlerts },
          { count: unresolvedAlerts },
          { count: activeSessionsToday },
        ] = await Promise.all([
          supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employee'),
          supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'refugi_lead'),
          supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabaseAdmin.from('emergency_alerts').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('emergency_alerts').select('*', { count: 'exact', head: true }).eq('is_resolved', false),
          supabaseAdmin.from('app_sessions').select('*', { count: 'exact', head: true })
            .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        ]);

        // Get recent signups (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { count: recentSignups } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo);

        // Get mood average
        const { data: moodData } = await supabaseAdmin
          .from('mood_check_ins')
          .select('mood_level')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        const avgMood = moodData && moodData.length > 0 
          ? moodData.reduce((sum, m) => sum + m.mood_level, 0) / moodData.length 
          : null;

        result = {
          totalUsers,
          totalEmployees,
          totalLeads,
          activeSubscriptions,
          totalAlerts,
          unresolvedAlerts,
          activeSessionsToday,
          recentSignups,
          avgMood: avgMood ? Number(avgMood.toFixed(1)) : null,
        };
        break;
      }

      case 'get_users': {
        const { page = 1, limit = 20, search, role } = params;
        const offset = (page - 1) * limit;

        let query = supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (search) {
          query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }
        if (role) {
          query = query.eq('role', role);
        }

        const { data, count, error } = await query;
        if (error) throw error;

        result = { users: data, total: count, page, limit };
        break;
      }

      case 'get_user_details': {
        const { userId } = params;
        
        const [
          { data: profile },
          { data: subscription },
          { data: assignments },
          { data: sessions },
          { data: moodCheckins },
          { data: alerts },
        ] = await Promise.all([
          supabaseAdmin.from('profiles').select('*').eq('user_id', userId).single(),
          supabaseAdmin.from('subscriptions').select('*').eq('refugi_lead_id', userId).single(),
          supabaseAdmin.from('employee_assignments').select('*').or(`refugi_lead_id.eq.${userId},employee_id.eq.${userId}`),
          supabaseAdmin.from('app_sessions').select('*').eq('employee_id', userId).order('started_at', { ascending: false }).limit(10),
          supabaseAdmin.from('mood_check_ins').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(10),
          supabaseAdmin.from('emergency_alerts').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(10),
        ]);

        result = { profile, subscription, assignments, sessions, moodCheckins, alerts };
        break;
      }

      case 'delete_user': {
        const { userId } = params;
        
        // Delete from auth (this cascades to profiles due to FK)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;

        console.log('User deleted:', userId);
        result = { success: true };
        break;
      }

      case 'update_user_role': {
        const { userId, newRole } = params;
        
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ role: newRole })
          .eq('user_id', userId);
        
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_subscriptions': {
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .select(`
            *,
            profiles!subscriptions_refugi_lead_id_fkey(full_name, email)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        result = { subscriptions: data };
        break;
      }

      case 'update_subscription': {
        const { subscriptionId, updates } = params;
        
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(updates)
          .eq('id', subscriptionId);
        
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_alerts': {
        const { page = 1, limit = 20, resolved } = params;
        const offset = (page - 1) * limit;

        let query = supabaseAdmin
          .from('emergency_alerts')
          .select(`
            *,
            profiles!emergency_alerts_employee_id_fkey(full_name, email)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (resolved !== undefined) {
          query = query.eq('is_resolved', resolved);
        }

        const { data, count, error } = await query;
        if (error) throw error;

        result = { alerts: data, total: count, page, limit };
        break;
      }

      case 'get_metrics': {
        // Get detailed metrics
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
          { data: dailySessions },
          { data: dailyMoodCheckins },
          { data: dailyAlerts },
          { data: videoProgress },
        ] = await Promise.all([
          supabaseAdmin.from('app_sessions').select('started_at').gte('started_at', thirtyDaysAgo.toISOString()),
          supabaseAdmin.from('mood_check_ins').select('created_at, mood_level').gte('created_at', thirtyDaysAgo.toISOString()),
          supabaseAdmin.from('emergency_alerts').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
          supabaseAdmin.from('video_progress').select('completed_at').gte('completed_at', thirtyDaysAgo.toISOString()),
        ]);

        result = {
          dailySessions,
          dailyMoodCheckins,
          dailyAlerts,
          videoProgress,
        };
        break;
      }

      case 'get_feature_flags': {
        const { data, error } = await supabaseAdmin
          .from('feature_flags')
          .select('*')
          .order('flag_name');
        
        if (error) throw error;
        result = { flags: data };
        break;
      }

      case 'update_feature_flag': {
        const { flagId, isEnabled } = params;
        
        const { error } = await supabaseAdmin
          .from('feature_flags')
          .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
          .eq('id', flagId);
        
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_audit_logs': {
        const { page = 1, limit = 50 } = params;
        const offset = (page - 1) * limit;

        const { data, count, error } = await supabaseAdmin
          .from('audit_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        result = { logs: data, total: count, page, limit };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Super admin error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
