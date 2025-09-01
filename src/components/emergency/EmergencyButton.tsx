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
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useNativeFeatures } from "@/hooks/useNativeFeatures";

interface EmergencyButtonProps {
  isDiscreetMode?: boolean;
  onEmergencyAction: (action: 'call' | 'whatsapp' | 'sms') => void;
}

export function EmergencyButton({ isDiscreetMode, onEmergencyAction }: EmergencyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const { isNative, openExternalApp } = useNativeFeatures();
  
  const handleEmergencyPress = async () => {
    setIsPressed(true);
    
    // Native haptic feedback
    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        // Fallback for web
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
    
    // Llamada automática al 112
    onEmergencyAction('call');
    await openExternalApp('tel:112');
    
    setTimeout(() => setIsPressed(false), 200);
  };

  const handleCall112 = async () => {
    onEmergencyAction('call');
    
    // Llamada automática sin confirmación
    await openExternalApp('tel:112');
    
    // Mostrar feedback visual y opción de contactar confianza
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('emergency-call-initiated'));
    }
  };

  const handleContactTrusted = async () => {
    onEmergencyAction('whatsapp');
    
    const message = encodeURIComponent("Te escribo desde Refugi, y necesito tu ayuda");
    await openExternalApp(`https://wa.me/?text=${message}`);
  };

  if (isDiscreetMode) {
    return (
      <Card className="w-full max-w-sm bg-gradient-card shadow-soft border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Modo Privado</h3>
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
              "h-40 w-40 rounded-full text-xl font-bold shadow-glow relative overflow-hidden",
              "bg-gradient-to-br from-coral via-emergency to-coral/80",
              "hover:from-coral/90 hover:via-emergency/90 hover:to-coral/70",
              "text-white border-4 border-white/20",
              "transform transition-all duration-300 active:scale-95",
              "focus:outline-none focus:ring-4 focus:ring-coral/30 focus:ring-offset-4",
              "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
              isPressed && "scale-95"
            )}
            onClick={handleEmergencyPress}
            aria-label="Botón de emergencia - pulsa para obtener ayuda inmediata"
          >
            <div className="flex flex-col items-center gap-3 relative z-10">
              <AlertTriangle size={36} className="drop-shadow-sm" />
              <span className="text-lg font-bold tracking-wide drop-shadow-sm">AYUDA</span>
            </div>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-auto bg-gradient-card backdrop-blur-sm border-t border-white/20">
          <SheetHeader>
            <SheetTitle className="text-center text-xl font-bold text-foreground">
              Llamada al 112 iniciada
            </SheetTitle>
            <SheetDescription className="text-center text-muted-foreground">
              Se está conectando con emergencias. ¿Deseas avisar también a tus contactos de confianza?
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col gap-4 mt-8 pb-8">
            <Button
              size="lg"
              variant="outline"
              onClick={handleContactTrusted}
              className="h-20 text-left justify-start gap-4 bg-cyan/5 border-cyan/20 hover:bg-cyan/10 hover:border-cyan/30 rounded-2xl shadow-soft"
            >
              <div className="h-12 w-12 rounded-full bg-cyan/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-cyan" />
              </div>
              <div>
                <div className="font-bold text-lg text-foreground">Avisar contactos de confianza</div>
                <div className="text-sm text-muted-foreground">Envía: "Te escribo desde Refugi, y necesito tu ayuda"</div>
              </div>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="text-center max-w-xs">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pulsa el botón rojo para llamar automáticamente al 112 y acceder a más opciones de ayuda. 
          Tu ubicación puede ser compartida solo si das tu consentimiento.
        </p>
      </div>
    </div>
  );
}