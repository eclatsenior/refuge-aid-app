import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoPlayerProps {
  videoUrl: string;
  videoName?: string;
  videoId?: string;
  routeId?: string;
  moduleId?: string;
  onVideoEnd?: () => void;
  onVideoWatched?: (percentage: number) => void;
  onVideoCompleted?: (videoId: string, routeId: string, moduleId: string, duration: number) => void;
  required?: boolean;
}

export function VideoPlayer({ 
  videoUrl, 
  videoName,
  videoId,
  routeId,
  moduleId,
  onVideoEnd, 
  onVideoWatched,
  onVideoCompleted,
  required = false 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when URL changes
  useEffect(() => {
    setVideoError(false);
    setIsLoading(true);
    setIsPlaying(false);
    setProgress(0);
    setWatchedPercentage(0);
  }, [videoUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          setVideoError(true);
        });
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

  const handleRetry = () => {
    setVideoError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration || isNaN(video.duration)) return;
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
      
      if (watchedPercentage >= 80 && videoId && routeId && moduleId) {
        onVideoCompleted?.(videoId, routeId, moduleId, video.currentTime);
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setVideoError(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setVideoError(true);
      console.error('[VideoPlayer] Error loading video:', videoUrl);
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => { setIsLoading(false); setIsPlaying(true); };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [watchedPercentage, onVideoEnd, onVideoWatched, onVideoCompleted, videoId, routeId, moduleId, videoUrl]);

  if (videoError) {
    return (
      <div className="w-full">
        <div className="bg-muted rounded-lg p-8 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-medium">No se pudo cargar el video</p>
          <p className="text-xs text-muted-foreground">
            Verifica tu conexión a internet e inténtalo de nuevo.
          </p>
          <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2">
            <RefreshCw size={14} />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
        {isLoading && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw size={24} className="text-white animate-spin" />
              <span className="text-white text-xs">Cargando video...</span>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto"
          playsInline
          preload="auto"
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
