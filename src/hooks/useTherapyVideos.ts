import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TherapyVideo {
  route_id: string;
  module_id: string;
  video_url: string;
  video_name: string | null;
  is_required: boolean;
}

export function useTherapyVideos() {
  const [videos, setVideos] = useState<Record<string, TherapyVideo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('therapy_videos')
          .select('*');

        if (error) throw error;

        const videoMap: Record<string, TherapyVideo> = {};
        data?.forEach(video => {
          const key = `${video.route_id}-${video.module_id}`;
          videoMap[key] = video;
        });

        setVideos(videoMap);
        console.debug('[useTherapyVideos] Loaded videos:', Object.keys(videoMap));
      } catch (error) {
        console.error('[useTherapyVideos] Error loading therapy videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();

    // Suscripción Realtime para actualizaciones en vivo
    const channel = supabase
      .channel('therapy_videos_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'therapy_videos'
        },
        (payload) => {
          console.debug('[useTherapyVideos] Realtime event:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const video = payload.new as TherapyVideo;
            const key = `${video.route_id}-${video.module_id}`;
            setVideos(prev => ({ ...prev, [key]: video }));
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getVideoForModule = (routeId: string, moduleId: string) => {
    return videos[`${routeId}-${moduleId}`];
  };

  return { videos, loading, getVideoForModule };
}