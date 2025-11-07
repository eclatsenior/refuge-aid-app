import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoPlayerProps {
  videoUrl: string;
  videoName?: string;
  onVideoEnd?: () => void;
  onVideoWatched?: (percentage: number) => void;
  required?: boolean;
}

export function VideoPlayer({ 
  videoUrl, 
  videoName, 
  onVideoEnd, 
  onVideoWatched, 
  required = false 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watchedPercentage, setWatchedPercentage] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
      
      if (percentage > watchedPercentage) {
        setWatchedPercentage(percentage);
        onVideoWatched?.(percentage);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnd?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [watchedPercentage, onVideoEnd, onVideoWatched]);

  return (
    <div className="w-full space-y-3">
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto"
          playsInline
          preload="metadata"
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <Progress value={progress} className="mb-2" />
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize size={20} />
            </Button>
          </div>
        </div>
      </div>
      
      {required && watchedPercentage < 80 && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
          ⚠️ Debes ver al menos el 80% del video para continuar
        </div>
      )}
    </div>
  );
}