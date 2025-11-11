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

    const { video_id, route_id, module_id, watched_duration_seconds } = await req.json();

    // Check if progress already exists
    const { data: existing } = await supabase
      .from('video_progress')
      .select('id')
      .eq('employee_id', user.id)
      .eq('video_id', video_id)
      .single();

    if (existing) {
      // Update existing progress
      await supabase
        .from('video_progress')
        .update({
          completed_at: new Date().toISOString(),
          watched_duration_seconds
        })
        .eq('id', existing.id);
    } else {
      // Insert new progress
      await supabase
        .from('video_progress')
        .insert({
          employee_id: user.id,
          video_id,
          route_id,
          module_id,
          watched_duration_seconds
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error tracking video progress:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
