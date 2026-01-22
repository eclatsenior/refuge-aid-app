import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

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

    // Service client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Decode JWT to get user info (Supabase validates JWT via verify_jwt=true in config)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return new Response(JSON.stringify({ error: 'Invalid token format' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.sub;
    const userEmail = payload.email;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user object for compatibility
    const user = { id: userId, email: userEmail };

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

      case 'set_user_password': {
        const { userId, newPassword } = params;
        
        if (!userId || !newPassword) {
          throw new Error('userId and newPassword are required');
        }
        
        if (newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        
        // Change password using Admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );
        
        if (updateError) throw updateError;
        
        // Log to audit
        await supabaseAdmin.from('audit_logs').insert({
          user_id: user.id,
          action: 'password_reset_by_admin',
          resource_type: 'user',
          resource_id: userId,
          metadata: { target_user_id: userId, performed_by: user.email }
        });
        
        console.log('Password changed for user:', userId, 'by super admin:', user.email);
        result = { success: true, message: 'Password updated successfully' };
        break;
      }

      case 'send_password_reset': {
        const { email } = params;
        
        if (!email) {
          throw new Error('email is required');
        }
        
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
        if (error) throw error;
        
        // Log to audit
        await supabaseAdmin.from('audit_logs').insert({
          user_id: user.id,
          action: 'password_reset_email_sent',
          resource_type: 'user',
          metadata: { target_email: email, performed_by: user.email }
        });
        
        console.log('Password reset email sent to:', email, 'by super admin:', user.email);
        result = { success: true, message: 'Password reset email sent' };
        break;
      }

      case 'get_stripe_data': {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
          throw new Error('STRIPE_SECRET_KEY is not configured');
        }

        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        console.log('Fetching Stripe data...');

        // 1. Get all active subscriptions (limit expansion to 4 levels max)
        const stripeSubscriptions = await stripe.subscriptions.list({
          status: 'active',
          limit: 100,
          expand: ['data.customer', 'data.items.data.price']
        });

        // 2. Fetch all products separately to get names (avoids deep expansion)
        const products = await stripe.products.list({ limit: 100, active: true });
        const productMap = new Map(products.data.map(p => [p.id, p.name]));
        console.log('Products fetched:', productMap.size);

        // 3. Calculate MRR
        let mrr = 0;
        stripeSubscriptions.data.forEach(sub => {
          sub.items.data.forEach(item => {
            const price = item.price;
            if (price.recurring?.interval === 'month') {
              mrr += (price.unit_amount || 0) * (item.quantity || 1);
            } else if (price.recurring?.interval === 'year') {
              mrr += ((price.unit_amount || 0) * (item.quantity || 1)) / 12;
            }
          });
        });

        // 4. Get payments from last 30 days
        const thirtyDaysAgoStripe = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        const payments = await stripe.paymentIntents.list({
          created: { gte: thirtyDaysAgoStripe },
          limit: 100
        });

        const totalRevenue30d = payments.data
          .filter(p => p.status === 'succeeded')
          .reduce((sum, p) => sum + p.amount, 0);

        // 5. Get balance
        const balance = await stripe.balance.retrieve();
        const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0);
        const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0);

        // 6. Format subscriptions list (use productMap for names)
        const subscriptionsList = stripeSubscriptions.data.map(sub => {
          const customer = sub.customer as Stripe.Customer;
          const firstItem = sub.items.data[0];
          const productId = typeof firstItem?.price?.product === 'string' 
            ? firstItem.price.product 
            : (firstItem?.price?.product as Stripe.Product)?.id;
          
          return {
            id: sub.id,
            status: sub.status,
            customerEmail: customer?.email || 'N/A',
            customerName: customer?.name || 'N/A',
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            productName: productId ? productMap.get(productId) || 'Unknown' : 'Unknown',
            amount: (firstItem?.price?.unit_amount || 0) / 100,
            currency: firstItem?.price?.currency || 'eur',
            interval: firstItem?.price?.recurring?.interval || 'month'
          };
        });

        console.log('Stripe data fetched:', {
          mrr: mrr / 100,
          totalRevenue30d: totalRevenue30d / 100,
          activeSubscriptions: stripeSubscriptions.data.length
        });

        result = {
          mrr: mrr / 100,
          totalRevenue30d: totalRevenue30d / 100,
          activeSubscriptions: stripeSubscriptions.data.length,
          subscriptionsList,
          availableBalance: availableBalance / 100,
          pendingBalance: pendingBalance / 100,
        };
        break;
      }

      case 'get_full_report_data': {
        // Get all data needed for the complete PDF report
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

        // Get recent signups
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

        // Get all users
        const { data: users } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email, role, created_at')
          .order('created_at', { ascending: false });

        // Get all subscriptions
        const { data: subscriptions } = await supabaseAdmin
          .from('subscriptions')
          .select(`
            id, status, employee_limit, current_period_end,
            profiles!subscriptions_refugi_lead_id_fkey(full_name, email)
          `)
          .order('created_at', { ascending: false });

        // Get all alerts
        const { data: alerts } = await supabaseAdmin
          .from('emergency_alerts')
          .select(`
            id, alert_type, is_resolved, created_at,
            profiles!emergency_alerts_employee_id_fkey(full_name, email)
          `)
          .order('created_at', { ascending: false });

        result = {
          metadata: {
            generated_at: new Date().toISOString(),
            generated_by: user.email,
          },
          overview: {
            totalUsers,
            totalEmployees,
            totalLeads,
            activeSubscriptions,
            totalAlerts,
            unresolvedAlerts,
            activeSessionsToday,
            recentSignups,
            avgMood: avgMood ? Number(avgMood.toFixed(1)) : null,
          },
          users: users || [],
          subscriptions: subscriptions || [],
          alerts: alerts || [],
        };
        break;
      }

      case 'get_vault_reset_requests': {
        const { status } = params;
        
        let query = supabaseAdmin
          .from('vault_reset_requests')
          .select('*')
          .eq('request_type', 'id_verification')
          .order('created_at', { ascending: false });
        
        if (status && status !== 'all') {
          query = query.eq('status', status);
        }
        
        const { data: requests, error } = await query;
        if (error) throw error;
        
        // Get profiles and signed URLs for documents
        const enrichedRequests = await Promise.all((requests || []).map(async (req) => {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', req.user_id)
            .single();
          
          let signedUrl = null;
          if (req.id_document_url) {
            const { data: urlData } = await supabaseAdmin.storage
              .from('vault-reset-ids')
              .createSignedUrl(req.id_document_url, 3600);
            signedUrl = urlData?.signedUrl;
          }
          
          return {
            ...req,
            profiles: profile,
            id_document_signed_url: signedUrl
          };
        }));
        
        result = { requests: enrichedRequests };
        break;
      }

      case 'approve_vault_reset_admin': {
        const { requestId } = params;
        
        // Get request details
        const { data: request, error: reqError } = await supabaseAdmin
          .from('vault_reset_requests')
          .select('*')
          .eq('id', requestId)
          .single();
        
        if (reqError || !request) throw new Error('Request not found');
        if (request.status !== 'pending') throw new Error('Request already processed');
        
        // Generate reset token (30 min expiry)
        const { create } = await import("https://deno.land/x/djwt@v3.0.2/mod.ts");
        const encoder = new TextEncoder();
        const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET') || '';
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(jwtSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign", "verify"]
        );
        
        const resetToken = await create(
          { alg: "HS256", typ: "JWT" },
          {
            sub: request.user_id,
            vault_reset: true,
            request_id: requestId,
            exp: Math.floor(Date.now() / 1000) + (30 * 60)
          },
          key
        );
        
        // Update request
        const { error: updateError } = await supabaseAdmin
          .from('vault_reset_requests')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
            reset_token: resetToken
          })
          .eq('id', requestId);
        
        if (updateError) throw updateError;
        
        // Notify user
        await supabaseAdmin.from('internal_messages').insert({
          sender_id: user.id,
          recipient_id: request.user_id,
          message: '✅ Tu solicitud de reinicio de contraseña de la Caja Fuerte ha sido aprobada. Tienes 30 minutos para establecer una nueva contraseña.'
        });
        
        // Audit log
        await supabaseAdmin.from('audit_logs').insert({
          user_id: user.id,
          action: 'vault_reset_approved_by_admin',
          resource_type: 'vault_reset_request',
          resource_id: requestId,
          metadata: { target_user_id: request.user_id, performed_by: user.email }
        });
        
        console.log('Vault reset approved by admin:', user.email, 'for user:', request.user_id);
        result = { success: true, resetToken };
        break;
      }

      case 'reject_vault_reset_admin': {
        const { requestId, notes } = params;
        
        // Get request
        const { data: request, error: reqError } = await supabaseAdmin
          .from('vault_reset_requests')
          .select('*')
          .eq('id', requestId)
          .single();
        
        if (reqError || !request) throw new Error('Request not found');
        if (request.status !== 'pending') throw new Error('Request already processed');
        
        // Update request
        const { error: updateError } = await supabaseAdmin
          .from('vault_reset_requests')
          .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
            notes: notes || null
          })
          .eq('id', requestId);
        
        if (updateError) throw updateError;
        
        // Notify user
        const message = notes 
          ? `❌ Tu solicitud de reinicio de contraseña de la Caja Fuerte ha sido rechazada. Motivo: ${notes}`
          : '❌ Tu solicitud de reinicio de contraseña de la Caja Fuerte ha sido rechazada.';
        
        await supabaseAdmin.from('internal_messages').insert({
          sender_id: user.id,
          recipient_id: request.user_id,
          message
        });
        
        // Audit log
        await supabaseAdmin.from('audit_logs').insert({
          user_id: user.id,
          action: 'vault_reset_rejected_by_admin',
          resource_type: 'vault_reset_request',
          resource_id: requestId,
          metadata: { target_user_id: request.user_id, performed_by: user.email, notes }
        });
        
        console.log('Vault reset rejected by admin:', user.email, 'for user:', request.user_id);
        result = { success: true };
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
