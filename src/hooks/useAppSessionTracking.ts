import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAppSessionTracking() {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const startSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !isActive) {
          console.debug('[AppSession] No active session, skipping tracking');
          return;
        }

        console.debug('[AppSession] Starting session for user:', session.user.id);

        const { data, error } = await supabase.functions.invoke('track-app-session', {
          body: { action: 'start' }
        });

        if (error) {
          // If auth error, the session might be stale - just log and skip
          if (error.message?.includes('Unauthorized') || error.message?.includes('Auth')) {
            console.warn('[AppSession] Auth error (possibly stale session), will retry on next interaction');
          } else {
            console.error('[AppSession] Error starting session:', error);
          }
          return;
        }

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
        // Check if we still have a valid auth session before calling
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.debug('[AppSession] No valid session, skipping end tracking');
          sessionIdRef.current = null;
          return;
        }

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
        sessionIdRef.current = null;
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
