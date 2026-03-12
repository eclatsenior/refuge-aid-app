import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TherapyVideo {
  id: string;
  route_id: string;
  module_id: string;
  video_url: string;
  video_name: string | null;
  is_required: boolean;
  storage_bucket?: string | null;
  storage_path?: string | null;
}

interface TherapyVideoWithSignedUrl extends TherapyVideo {
  signed_url: string | null;
}

export function useTherapyVideos() {
  const [videos, setVideos] = useState<Record<string, TherapyVideoWithSignedUrl>>({});
  const [loading, setLoading] = useState(true);

  const fetchSignedUrl = useCallback(async (videoId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-therapy-video-url', {
        body: { video_id: videoId },
      });

      if (error) {
        console.error('[useTherapyVideos] Error getting secure video URL:', error.message);
        return null;
      }

      return (data as { signed_url?: string })?.signed_url ?? null;
    } catch (error) {
      console.error('[useTherapyVideos] Exception getting secure video URL:', error);
      return null;
    }
  }, []);

  const generateSignedUrls = useCallback(async (videoList: TherapyVideo[]): Promise<Record<string, TherapyVideoWithSignedUrl>> => {
    const results = await Promise.allSettled(
      videoList.map(async (video) => {
        const signedUrl = await fetchSignedUrl(video.id);
        return { video, signedUrl };
      })
    );

    const videoMap: Record<string, TherapyVideoWithSignedUrl> = {};

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { video, signedUrl } = result.value;
        const key = `${video.route_id}-${video.module_id}`;
        videoMap[key] = { ...video, signed_url: signedUrl };
      }
    });

    return videoMap;
  }, [fetchSignedUrl]);

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
        return;
      }

      const videoMap = await generateSignedUrls(data as TherapyVideo[]);
      setVideos(videoMap);
      console.debug('[useTherapyVideos] Loaded secured videos:', Object.keys(videoMap));
    } catch (error) {
      console.error('[useTherapyVideos] Error loading therapy videos:', error);
    } finally {
      setLoading(false);
    }
  }, [generateSignedUrls]);

  useEffect(() => {
    fetchVideos();

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
            const signedUrl = await fetchSignedUrl(video.id);
            const key = `${video.route_id}-${video.module_id}`;
            setVideos(prev => ({ ...prev, [key]: { ...video, signed_url: signedUrl } }));
          } else if (payload.eventType === 'DELETE') {
            const video = payload.old as TherapyVideo;
            const key = `${video.route_id}-${video.module_id}`;
            setVideos(prev => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }
        }
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVideos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchVideos, fetchSignedUrl]);

  const getVideoForModule = (routeId: string, moduleId: string) => {
    return videos[`${routeId}-${moduleId}`];
  };

  const markVideoAsCompleted = async (
    videoId: string,
    routeId: string,
    moduleId: string,
    watchedDuration: number
  ) => {
    try {
      await supabase.functions.invoke('track-video-progress', {
        body: {
          video_id: videoId,
          route_id: routeId,
          module_id: moduleId,
          watched_duration_seconds: Math.floor(watchedDuration)
        }
      });
    } catch (error) {
      console.error('[useTherapyVideos] Error marking video as completed:', error);
    }
  };

  return { videos, loading, getVideoForModule, markVideoAsCompleted, refresh: fetchVideos };
}
