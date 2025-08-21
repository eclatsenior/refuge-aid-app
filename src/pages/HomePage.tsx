import { useState, useEffect } from "react";
import { Shield, Settings, Eye, EyeOff } from "lucide-react";
import { EmergencyButton } from "@/components/emergency/EmergencyButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { settings, updateSettings, trustedContacts, checkIns, triggerEmergency } = useAppStore();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const handleEmergencyAction = (action: 'call' | 'whatsapp' | 'sms') => {
    triggerEmergency(action);
    
    if (action === 'call') {
      toast({
        title: "Llamada de emergencia",
        description: "Abriendo marcador para llamar al 112..."
      });
    } else {
      toast({
        title: "Alerta enviada",
        description: `Notificando a tus contactos de confianza vía ${action === 'whatsapp' ? 'WhatsApp' : 'SMS'}...`
      });
    }
  };
  
  const toggleDiscreetMode = () => {
    updateSettings({ isDiscreetMode: !settings.isDiscreetMode });
    toast({
      title: settings.isDiscreetMode ? "Modo normal activado" : "Modo discreto activado",
      description: settings.isDiscreetMode 
        ? "La aplicación muestra su interfaz normal" 
        : "La aplicación ahora parece una app de notas"
    });
  };
  
  const getLastCheckIn = () => {
    if (checkIns.length === 0) return null;
    return checkIns[checkIns.length - 1];
  };
  
  const lastCheckIn = getLastCheckIn();
  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  if (settings.isDiscreetMode) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mis Notas</h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDiscreetMode}
            className="gap-2"
          >
            <Eye size={16} />
            Mostrar
          </Button>
        </header>
        
        <div className="space-y-4">
          <EmergencyButton 
            isDiscreetMode={true} 
            onEmergencyAction={handleEmergencyAction}
          />
          
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Tienes acceso seguro a todas tus funciones. 
                Pulsa "Mostrar" para volver al modo normal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-hero p-4 pb-20">
      <header className="flex justify-between items-center mb-8 pt-2">
        <div className="text-white">
          <h1 className="text-2xl font-bold">Refugi</h1>
          <p className="text-white/80 text-sm">
            {timeFormatter.format(currentTime)} - {currentTime.toLocaleDateString('es-ES', { 
              weekday: 'long' 
            })}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDiscreetMode}
            className="text-white hover:bg-white/20 gap-2"
          >
            <EyeOff size={16} />
            Discreto
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/ajustes')}
            className="text-white hover:bg-white/20"
          >
            <Settings size={20} />
          </Button>
        </div>
      </header>
      
      <main className="space-y-8">
        <div className="flex flex-col items-center justify-center py-12">
          <EmergencyButton 
            onEmergencyAction={handleEmergencyAction}
          />
        </div>
        
        <div className="grid gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Estado de Seguridad</CardTitle>
                <Badge 
                  variant={lastCheckIn?.status === 'ok' ? 'default' : 'destructive'}
                  className="bg-white/20 text-white border-white/30"
                >
                  {lastCheckIn?.status === 'ok' ? 'Seguro' : 
                   lastCheckIn?.status === 'anxious' ? 'Ansiedad' : 
                   lastCheckIn?.status === 'alert' ? 'Alerta' : 'Sin registro'}
                </Badge>
              </div>
              <CardDescription className="text-white/70">
                {lastCheckIn 
                  ? `Último registro: ${lastCheckIn.timestamp.toLocaleDateString('es-ES')}`
                  : 'No hay registros recientes'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onNavigate('/seguimiento')}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Registrar estado actual
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield size={20} />
                <CardTitle className="text-lg">Red de Apoyo</CardTitle>
              </div>
              <CardDescription className="text-white/70">
                {trustedContacts.length > 0 
                  ? `${trustedContacts.length} contactos de confianza configurados`
                  : 'Configura tus contactos de emergencia'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onNavigate('/ajustes')}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                {trustedContacts.length > 0 ? 'Gestionar contactos' : 'Añadir contactos'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}