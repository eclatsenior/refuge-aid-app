import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAppSessionTracking() {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const startSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isActive) return;

        const { data } = await supabase.functions.invoke('track-app-session', {
          body: { action: 'start' }
        });

        if (data?.session_id) {
          sessionIdRef.current = data.session_id;
          console.debug('[AppSession] Session started:', data.session_id);
        }
      } catch (error) {
        console.error('[AppSession] Error starting session:', error);
      }
    };

    const endSession = async () => {
      if (!sessionIdRef.current) return;

      try {
        await supabase.functions.invoke('track-app-session', {
          body: { 
            action: 'end', 
            session_id: sessionIdRef.current 
          }
        });
        console.debug('[AppSession] Session ended:', sessionIdRef.current);
        sessionIdRef.current = null;
      } catch (error) {
        console.error('[AppSession] Error ending session:', error);
      }
    };

    // Start session on mount
    startSession();

    // End session on unmount or visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endSession();
      } else if (document.visibilityState === 'visible' && !sessionIdRef.current) {
        startSession();
      }
    };

    const handleBeforeUnload = () => {
      endSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isActive = false;
      endSession();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
