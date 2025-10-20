import { useState } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const InstallAppBanner = () => {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(
    localStorage.getItem('pwa-banner-dismissed') === 'true'
  );
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { toast } = useToast();

  // No mostrar si está instalada, fue descartada, o no se puede instalar
  if (isInstalled || isDismissed || !canInstall) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
    toast({
      title: "Banner ocultado",
      description: "Puedes instalar la app desde Configuración > Instalación"
    });
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    const success = await install();
    
    if (success) {
      toast({
        title: "¡App instalada!",
        description: "Refugio se ha instalado correctamente en tu dispositivo"
      });
    } else {
      toast({
        title: "No se pudo instalar",
        description: "Intenta instalarlo desde la configuración del navegador",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/20 mt-1">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                📱 Instala Refugio en tu dispositivo
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Accede más rápido y recibe notificaciones instantáneas instalando la app
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isIOS ? 'Ver instrucciones' : 'Instalar ahora'}
                </Button>
                
                <Button 
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                >
                  Más tarde
                </Button>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Instrucciones para iOS */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar en iPhone/iPad</DialogTitle>
            <DialogDescription className="text-left space-y-4 pt-4">
              <p>Para instalar Refugio en tu dispositivo iOS:</p>
              
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Toca el botón de <strong>Compartir</strong> <Share className="inline h-4 w-4" /> en Safari</li>
                <li>Desplázate hacia abajo y selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                <li>Toca <strong>"Añadir"</strong> en la esquina superior derecha</li>
              </ol>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Nota:</strong> Esta función solo está disponible en Safari en iOS
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
