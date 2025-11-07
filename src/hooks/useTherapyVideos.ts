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
      } catch (error) {
        console.error('Error loading therapy videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const getVideoForModule = (routeId: string, moduleId: string) => {
    return videos[`${routeId}-${moduleId}`];
  };

  return { videos, loading, getVideoForModule };
}