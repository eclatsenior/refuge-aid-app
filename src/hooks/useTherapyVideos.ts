import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TherapyVideo {
  id: string;
  route_id: string;
  module_id: string;
  video_url: string;
  video_name: string | null;
  is_required: boolean;
}

interface TherapyVideoWithSignedUrl extends TherapyVideo {
  signed_url: string | null;
}

/**
 * Extracts the storage path from a Supabase public URL or returns the value as-is if it's already a path.
 * Handles: https://xxx.supabase.co/storage/v1/object/public/therapy-videos/path/to/file.mp4
 */
function extractStoragePath(videoUrl: string): string {
  const marker = '/therapy-videos/';
  const idx = videoUrl.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(videoUrl.substring(idx + marker.length));
  }
  // Already a relative path
  return videoUrl;
}

/**
 * Generates a signed URL for a video in the private therapy-videos bucket.
 * Signed URLs are valid for 1 hour (3600 seconds).
 */
async function getSignedUrl(videoUrl: string): Promise<string | null> {
  const path = extractStoragePath(videoUrl);
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await supabase.storage
        .from('therapy-videos')
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error || !data?.signedUrl) {
        console.error(`[useTherapyVideos] Signed URL attempt ${attempt}/${maxAttempts} failed for ${path}:`, error?.message || 'No signedUrl returned');
      } else {
        const signedUrl = data.signedUrl;
        if (signedUrl.startsWith('http')) return signedUrl;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          console.error('[useTherapyVideos] Missing VITE_SUPABASE_URL to normalize signed URL');
          return null;
        }

        // Normalize relative signed URL (e.g. /object/sign/...) to absolute URL
        return `${supabaseUrl}/storage/v1${signedUrl}`;
      }
    } catch (e) {
      console.error(`[useTherapyVideos] Exception creating signed URL (attempt ${attempt}/${maxAttempts}):`, e);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return null;
}

export function useTherapyVideos() {
  const [videos, setVideos] = useState<Record<string, TherapyVideoWithSignedUrl>>({});
  const [loading, setLoading] = useState(true);

  const generateSignedUrls = useCallback(async (videoList: TherapyVideo[]): Promise<Record<string, TherapyVideoWithSignedUrl>> => {
    const videoMap: Record<string, TherapyVideoWithSignedUrl> = {};

    // Generate signed URLs in parallel (batch of all videos)
    const results = await Promise.allSettled(
      videoList.map(async (video) => {
        const signedUrl = await getSignedUrl(video.video_url);
        return { video, signedUrl };
      })
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { video, signedUrl } = result.value;
        const key = `${video.route_id}-${video.module_id}`;
        videoMap[key] = { ...video, signed_url: signedUrl };
      }
    });

    return videoMap;
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('therapy_videos')
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        setVideos({});
        console.debug('[useTherapyVideos] No videos found.');
      } else {
        const videoMap = await generateSignedUrls(data);
        setVideos(videoMap);
        console.debug('[useTherapyVideos] Loaded videos with signed URLs:', Object.keys(videoMap));
      }
    } catch (error) {
      console.error('[useTherapyVideos] Error loading therapy videos:', error);
    } finally {
      setLoading(false);
    }
  }, [generateSignedUrls]);

  useEffect(() => {
    fetchVideos();

    // Realtime subscription for live updates
    const channel = supabase
      .channel('therapy_videos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'therapy_videos'
        },
        async (payload) => {
          console.debug('[useTherapyVideos] Realtime event:', payload.eventType);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const video = payload.new as TherapyVideo;
            const key = `${video.route_id}-${video.module_id}`;
            const signedUrl = await getSignedUrl(video.video_url);
            setVideos(prev => ({ ...prev, [key]: { ...video, signed_url: signedUrl } }));
          } else if (payload.eventType === 'DELETE') {
            const video = payload.old as TherapyVideo;
            const key = `${video.route_id}-${video.module_id}`;
            setVideos(prev => {
              const newVideos = { ...prev };
              delete newVideos[key];
              return newVideos;
            });
          }
        }
      )
      .subscribe();

    // Refresh signed URLs when user returns to the tab (they expire after 1h)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.debug('[useTherapyVideos] Tab visible, refreshing signed URLs...');
        fetchVideos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchVideos]);

  const getVideoForModule = (routeId: string, moduleId: string) => {
    return videos[`${routeId}-${moduleId}`];
  };

  const markVideoAsCompleted = async (videoId: string, routeId: string, moduleId: string, watchedDuration: number) => {
    try {
      await supabase.functions.invoke('track-video-progress', {
        body: {
          video_id: videoId,
          route_id: routeId,
          module_id: moduleId,
          watched_duration_seconds: Math.floor(watchedDuration)
        }
      });
      console.debug('[useTherapyVideos] Video marked as completed:', videoId);
    } catch (error) {
      console.error('[useTherapyVideos] Error marking video as completed:', error);
    }
  };

  return { videos, loading, getVideoForModule, markVideoAsCompleted, refresh: fetchVideos };
}
