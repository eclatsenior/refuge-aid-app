import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

  const handleUpdate = () => {
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

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
        const installingWorker = reg.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🆕 Nueva versión disponible');
            setNewWorker(installingWorker);
            setUpdateAvailable(true);
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

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <Card className="p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Nueva versión disponible
              </p>
              <p className="text-xs text-muted-foreground">
                Actualiza para obtener las últimas mejoras y correcciones
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleUpdate}
                className="flex-1"
              >
                Actualizar ahora
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
