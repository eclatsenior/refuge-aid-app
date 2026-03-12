import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type TherapyVideoRow = {
  id: string;
  video_url: string;
  storage_bucket: string | null;
  storage_path: string | null;
};

function extractStoragePath(value: string): string {
  const marker = '/therapy-videos/';
  const idx = value.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(value.substring(idx + marker.length));
  }
  return value.replace(/^\/+/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userId = authData.user.id;

    const { data: subscriptionData, error: subError } = await supabaseAdmin.rpc('has_active_subscription', {
      user_id_param: userId,
    });

    if (subError) {
      console.error('[get-therapy-video-url] Subscription check failed:', subError.message);
      return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const { data: superAdminData, error: superAdminError } = await supabaseAdmin.rpc('is_super_admin', {
      check_user_id: userId,
    });

    if (superAdminError) {
      console.error('[get-therapy-video-url] Super admin check failed:', superAdminError.message);
      return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const isAllowed = Boolean(subscriptionData) || Boolean(superAdminData);
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Subscription required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const body = await req.json();
    const videoId = body?.video_id as string | undefined;

    if (!videoId) {
      return new Response(JSON.stringify({ error: 'video_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: videoData, error: videoError } = await supabaseAdmin
      .from('therapy_videos')
      .select('id, video_url, storage_bucket, storage_path')
      .eq('id', videoId)
      .single();

    const video = videoData as TherapyVideoRow | null;

    if (videoError || !video) {
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const bucket = video.storage_bucket || 'therapy-videos';
    const storagePath = video.storage_path || extractStoragePath(video.video_url);

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storagePath, 900); // 15 minutes

    if (signedError || !signedData?.signedUrl) {
      console.error('[get-therapy-video-url] Failed to create signed URL:', signedError?.message);
      return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    let signedUrl = signedData.signedUrl;
    if (signedUrl.startsWith('/')) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      signedUrl = `${supabaseUrl}/storage/v1${signedUrl}`;
    }

    return new Response(JSON.stringify({
      signed_url: signedUrl,
      expires_in: 900,
      video_id: video.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('[get-therapy-video-url] Fatal error:', error?.message || error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
