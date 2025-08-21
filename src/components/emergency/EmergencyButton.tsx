import { useState } from "react";
import { AlertTriangle, Phone, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface EmergencyButtonProps {
  isDiscreetMode?: boolean;
  onEmergencyAction: (action: 'call' | 'whatsapp' | 'sms') => void;
}

export function EmergencyButton({ isDiscreetMode, onEmergencyAction }: EmergencyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleEmergencyPress = () => {
    setIsPressed(true);
    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    setTimeout(() => setIsPressed(false), 200);
  };

  const handleCall112 = () => {
    onEmergencyAction('call');
    // In a real app, this would open the phone dialer
    if (confirm("¿Deseas llamar al 112? Se abrirá tu aplicación de teléfono.")) {
      window.open('tel:112');
    }
  };

  const handleContactTrusted = () => {
    onEmergencyAction('whatsapp');
    // In a real app, this would send to trusted contacts via WhatsApp/SMS
    const message = encodeURIComponent("Necesito ayuda. Estoy en riesgo. Este es un aviso automático de Refugi.");
    // Simulating WhatsApp link (would use actual contact number)
    window.open(`https://wa.me/?text=${message}`);
  };

  if (isDiscreetMode) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">Modo Privado</h3>
              <p className="text-sm text-muted-foreground">Acceso seguro activado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "h-32 w-32 rounded-full text-xl font-bold shadow-emergency",
              "bg-emergency hover:bg-emergency/90 text-emergency-foreground",
              "transform transition-transform active:scale-95",
              "focus:outline-none focus:ring-4 focus:ring-emergency focus:ring-offset-4",
              isPressed && "scale-95"
            )}
            onClick={handleEmergencyPress}
            aria-label="Botón de emergencia - pulsa para obtener ayuda inmediata"
          >
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle size={32} />
              <span>AYUDA</span>
            </div>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle className="text-center text-lg font-bold text-emergency">
              ¿Necesitas ayuda inmediata?
            </SheetTitle>
            <SheetDescription className="text-center">
              Elige la opción más segura para tu situación actual
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col gap-4 mt-6 pb-6">
            <Button
              size="lg"
              variant="outline"
              onClick={handleCall112}
              className="h-16 text-left justify-start gap-4 border-emergency/20 hover:bg-emergency/10"
            >
              <Phone className="h-6 w-6 text-emergency" />
              <div>
                <div className="font-semibold">Llamar al 112</div>
                <div className="text-sm text-muted-foreground">Emergencias - Policía, Ambulancia</div>
              </div>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={handleContactTrusted}
              className="h-16 text-left justify-start gap-4 border-primary/20 hover:bg-primary/10"
            >
              <MessageSquare className="h-6 w-6 text-primary" />
              <div>
                <div className="font-semibold">Avisar contactos de confianza</div>
                <div className="text-sm text-muted-foreground">Envía alerta por WhatsApp/SMS</div>
              </div>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="text-center max-w-xs">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pulsa el botón rojo para acceder a opciones de ayuda inmediata. 
          Tu ubicación puede ser compartida solo si das tu consentimiento.
        </p>
      </div>
    </div>
  );
}