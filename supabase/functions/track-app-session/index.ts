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

    const { action, session_id } = await req.json();

    if (action === 'start') {
      // Create new session
      const { data, error } = await supabase
        .from('app_sessions')
        .insert({ employee_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Update employee_status last_check_in
      await supabase
        .from('employee_status')
        .update({ last_check_in: new Date().toISOString() })
        .eq('employee_id', user.id);

      return new Response(JSON.stringify({ session_id: data.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else if (action === 'end' && session_id) {
      // Update session with end time and duration
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
    console.error('Error tracking session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
