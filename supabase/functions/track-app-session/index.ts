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
    // Verify authorization header exists
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[track-app-session] No authorization header');
      throw new Error('Unauthorized: No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[track-app-session] Auth error:', userError?.message || 'No user');
      throw new Error('Unauthorized: ' + (userError?.message || 'Invalid session'));
    }

    console.log('[track-app-session] User authenticated:', user.id);
    
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
    console.error('[track-app-session] Error:', error.message);
    
    // Return 401 for auth errors, 400 for others
    const isAuthError = error.message?.includes('Unauthorized') || error.message?.includes('Auth');
    
    const clientMessage = isAuthError ? 'Unauthorized' : 'An error occurred processing your request';
    return new Response(JSON.stringify({ error: clientMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: isAuthError ? 401 : 400,
    });
  }
});
