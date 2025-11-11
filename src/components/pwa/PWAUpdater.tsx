import { useEffect } from 'react';

export function PWAUpdater() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;

    // Register and get SW registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      
      registration = reg;
      console.log('✅ Service Worker activo');

      // Force immediate update check
      reg.update().catch(console.error);

      // Check for updates every 60 seconds
      const intervalId = setInterval(() => {
        console.log('🔄 Verificando actualización del SW...');
        reg.update().catch(console.error);
      }, 60 * 1000);

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🆕 Nueva versión disponible, actualizando...');
            // Skip waiting and activate immediately
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            // Reload to get the new version
            window.location.reload();
          }
        });
      });

      return () => clearInterval(intervalId);
    });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker actualizado');
      window.location.reload();
    });

    // Check for updates when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && registration) {
        console.log('👁️ Pestaña visible, verificando actualizaciones...');
        registration.update().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
