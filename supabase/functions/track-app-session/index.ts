import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[track-app-session] Auth error:', userError?.message || 'No user');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userId = user.id;
    const { action, session_id } = await req.json();

    if (action === 'start') {
      const { data, error } = await supabase
        .from('app_sessions')
        .insert({ employee_id: userId })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('employee_status')
        .update({ last_check_in: new Date().toISOString() })
        .eq('employee_id', userId);

      return new Response(JSON.stringify({ session_id: data.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else if (action === 'end' && session_id) {
      const { data: session } = await supabase
        .from('app_sessions')
        .select('started_at')
        .eq('id', session_id)
        .single();

      if (session) {
        const duration = Math.floor(
          (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
        );

        await supabase
          .from('app_sessions')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: duration
          })
          .eq('id', session_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Invalid action');
  } catch (error: any) {
    console.error('[track-app-session] Error:', error.message);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
