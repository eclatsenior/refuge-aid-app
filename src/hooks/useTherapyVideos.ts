import { useEffect, useState, useCallback } from 'react';
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

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('therapy_videos')
        .select('*');

      if (error) throw error;

      // Si obtenemos 0 videos, reintentar una vez después de 1.5s
      if (!data || data.length === 0) {
        console.debug('[useTherapyVideos] Primera carga: 0 videos. Reintentando en 1.5s...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const { data: retryData, error: retryError } = await supabase
          .from('therapy_videos')
          .select('*');
        
        if (retryError) throw retryError;
        
        const videoMap: Record<string, TherapyVideo> = {};
        retryData?.forEach(video => {
          const key = `${video.route_id}-${video.module_id}`;
          videoMap[key] = video;
        });
        
        setVideos(videoMap);
        console.debug('[useTherapyVideos] Reintento exitoso. Videos:', Object.keys(videoMap));
      } else {
        const videoMap: Record<string, TherapyVideo> = {};
        data.forEach(video => {
          const key = `${video.route_id}-${video.module_id}`;
          videoMap[key] = video;
        });
        
        setVideos(videoMap);
        console.debug('[useTherapyVideos] Loaded videos:', Object.keys(videoMap));
      }
    } catch (error) {
      console.error('[useTherapyVideos] Error loading therapy videos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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

    // Recargar cuando el usuario vuelve a la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.debug('[useTherapyVideos] Pestaña visible, recargando videos...');
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