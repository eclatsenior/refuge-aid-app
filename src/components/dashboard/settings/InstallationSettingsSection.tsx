import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Copy, CheckCircle, Share, ExternalLink } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const InstallationSettingsSection = () => {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const appUrl = window.location.origin;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "Puedes compartir este enlace con tus empleadas"
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el enlace",
        variant: "destructive"
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Refugio - Cuidado Emocional',
          text: 'Descarga la app de Refugio para cuidado emocional',
          url: appUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyLink();
    }
  };

  const handleInstall = async () => {
    const success = await install();
    
    if (success) {
      toast({
        title: "¡App instalada!",
        description: "Refugio se ha instalado correctamente"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado de Instalación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Estado de la Aplicación
              </CardTitle>
              <CardDescription>
                Información sobre la instalación de Refugio
              </CardDescription>
            </div>
            
            {isInstalled && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Instalada
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">App instalada correctamente</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Refugio está instalada en tu dispositivo y funcionando correctamente.
              </p>
            </div>
          ) : canInstall ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Instala Refugio en tu dispositivo para:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Acceso más rápido desde tu pantalla de inicio</li>
                <li>• Notificaciones instantáneas de alertas</li>
                <li>• Funciona sin conexión (offline)</li>
                <li>• Experiencia de app nativa</li>
              </ul>
              
              {isIOS ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Ver instrucciones de instalación
                    </Button>
                  </DialogTrigger>
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
              ) : (
                <Button onClick={handleInstall} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Instalar aplicación
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                La instalación no está disponible en este navegador. Intenta abrir Refugio en Chrome (Android) o Safari (iOS).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compartir App */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Compartir con Empleadas
          </CardTitle>
          <CardDescription>
            Comparte el enlace de Refugio con tus empleadas para que puedan instalarlo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <code className="text-sm flex-1 truncate">{appUrl}</code>
            <Button
              size="icon"
              variant="ghost"
              onClick={copyLink}
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyLink} variant="outline" className="flex-1 gap-2">
              <Copy className="h-4 w-4" />
              Copiar enlace
            </Button>
            
            {navigator.share && (
              <Button onClick={shareLink} variant="outline" className="flex-1 gap-2">
                <Share className="h-4 w-4" />
                Compartir
              </Button>
            )}
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Tus empleadas podrán instalar la app directamente desde este enlace
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recursos Adicionales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Recursos
          </CardTitle>
          <CardDescription>
            Guías y recursos sobre la instalación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              <span>Las actualizaciones se instalan automáticamente</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              <span>La app funciona offline una vez instalada</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              <span>Recibe notificaciones instantáneas de alertas</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
