import { useState, useRef, useEffect, useCallback } from 'react';
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
  onRefreshVideoUrl?: () => Promise<void> | void;
  required?: boolean;
}

const LOAD_TIMEOUT_MS = 45000; // 45s for large files on mobile
const BUFFERING_TIMEOUT_MS = 30000; // 30s for mid-stream buffering

export function VideoPlayer({
  videoUrl,
  videoName,
  videoId,
  routeId,
  moduleId,
  onVideoEnd,
  onVideoWatched,
  onVideoCompleted,
  onRefreshVideoUrl,
  required = false
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [hasPlaybackAttempt, setHasPlaybackAttempt] = useState(false);

  const clearLoadTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startLoadTimeout = useCallback((ms: number = LOAD_TIMEOUT_MS) => {
    clearLoadTimeout();
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      setIsLoading(false);
      console.warn('[VideoPlayer] Load timeout reached for:', videoUrl);
    }, ms);
  }, [clearLoadTimeout, videoUrl]);

  const unlockForMobilePlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video || unlockedRef.current) return;

    const originalMuted = video.muted;

    try {
      video.muted = true;
      await video.play();
      video.pause();
      video.currentTime = 0;
      unlockedRef.current = true;
    } catch {
      // Best-effort unlock; keep normal play flow
    } finally {
      video.muted = originalMuted;
    }
  }, []);

  useEffect(() => {
    setVideoError(false);
    setIsLoading(false);
    setIsPlaying(false);
    setProgress(0);
    setWatchedPercentage(0);
    setTimedOut(false);
    setHasPlaybackAttempt(false);
    unlockedRef.current = false;

    return () => clearLoadTimeout();
  }, [videoUrl, clearLoadTimeout]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    setHasPlaybackAttempt(true);
    setVideoError(false);
    setTimedOut(false);
    setIsLoading(true);
    startLoadTimeout(LOAD_TIMEOUT_MS);

    if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) {
      video.load();
    }

    // Importante: intentar play() inmediatamente dentro del gesto del usuario
    // para evitar bloqueos de reproducción en iOS/Android.
    try {
      await video.play();
      setIsPlaying(true);
      return;
    } catch {
      // Fallback para navegadores móviles más estrictos.
      try {
        await unlockForMobilePlayback();
        await video.play();
        setIsPlaying(true);
        return;
      } catch {
        setVideoError(true);
        setIsPlaying(false);
        setIsLoading(false);
        clearLoadTimeout();
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (container.requestFullscreen) {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.warn('[VideoPlayer] Fullscreen not available:', error);
    }
  };

  const handleRetry = async () => {
    setHasPlaybackAttempt(true);
    setVideoError(false);
    setTimedOut(false);
    setIsLoading(true);
    startLoadTimeout();

    try {
      await onRefreshVideoUrl?.();
    } catch {
      // Si falla el refresh, igualmente intentamos recargar el elemento de video
    }

    videoRef.current?.load();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
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
      setTimedOut(false);
      clearLoadTimeout();
    };

    const handleError = () => {
      setIsLoading(false);
      setVideoError(true);
      clearLoadTimeout();
      const mediaErrorCode = video.error?.code;
      console.error('[VideoPlayer] Error loading video:', {
        url: videoUrl,
        mediaErrorCode,
        networkState: video.networkState,
        readyState: video.readyState,
      });
    };

    const handleWaiting = () => {
      if (hasPlaybackAttempt) {
        setIsLoading(true);
        startLoadTimeout(BUFFERING_TIMEOUT_MS);
      }
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setTimedOut(false);
      clearLoadTimeout();
    };

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
  }, [
    watchedPercentage,
    onVideoEnd,
    onVideoWatched,
    onVideoCompleted,
    videoId,
    routeId,
    moduleId,
    videoUrl,
    clearLoadTimeout,
    hasPlaybackAttempt,
    startLoadTimeout,
  ]);

  if (hasPlaybackAttempt && (videoError || timedOut)) {
    return (
      <div className="w-full">
        <div className="bg-muted rounded-lg p-8 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-medium">
            {timedOut ? 'El video tarda demasiado en cargar' : 'No se pudo cargar el video'}
          </p>
          <p className="text-xs text-muted-foreground">
            {timedOut
              ? 'Tu conexión puede ser lenta. Intenta de nuevo o conéctate a una red Wi‑Fi.'
              : 'Verifica tu conexión a internet e inténtalo de nuevo.'}
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
      <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden shadow-lg" onContextMenu={(e) => e.preventDefault()}>
        {hasPlaybackAttempt && isLoading && !isPlaying && (
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
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate noremoteplayback"
        />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <Progress value={progress} className="mb-2" />

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>

              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
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
