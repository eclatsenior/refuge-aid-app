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
          // Silently handle auth errors - session may be stale/revoked
          console.debug('[AppSession] Could not start session (likely stale token)');
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
      const currentSessionId = sessionIdRef.current;
      if (!currentSessionId) return;
      sessionIdRef.current = null;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.debug('[AppSession] No valid session, skipping end tracking');
          return;
        }

        await supabase.functions.invoke('track-app-session', {
          body: { action: 'end', session_id: currentSessionId }
        });
        console.debug('[AppSession] Session ended:', currentSessionId);
      } catch (error) {
        console.debug('[AppSession] Could not end session (likely logged out):', error);
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
