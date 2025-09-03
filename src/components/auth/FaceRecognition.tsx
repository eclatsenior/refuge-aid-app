import { useState, useEffect } from "react";
import { Camera, Check, X, Loader2, Shield, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

interface FaceRecognitionProps {
  onComplete: (success: boolean) => void;
  isRefugiLead?: boolean;
}

export function FaceRecognition({ onComplete, isRefugiLead = false }: FaceRecognitionProps) {
  const [step, setStep] = useState<'camera' | 'scanning' | 'success' | 'error'>('camera');
  const [progress, setProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  
  const { signIn } = useAppStore();
  const { toast } = useToast();

  useEffect(() => {
    // Simular activación de cámara
    const timer = setTimeout(() => {
      setCameraActive(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const startScanning = () => {
    setStep('scanning');
    
    // Simular proceso de escaneo
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      setProgress(Math.min(currentProgress, 100));
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        // Simular éxito del reconocimiento facial
        setTimeout(() => {
          setStep('success');
          // Auto login simulado
          setTimeout(() => {
            handleFaceRecognitionSuccess();
          }, 1500);
        }, 500);
      }
    }, 200);
  };

  const handleFaceRecognitionSuccess = async () => {
    // Simular login automático con reconocimiento facial
    try {
      // En una implementación real, aquí se haría la autenticación biométrica
      // Por ahora simulamos un login exitoso
      const mockEmail = isRefugiLead ? "lead@refugi.com" : "employee@refugi.com";
      const mockPassword = "biometric_auth_token";
      
      const { error } = await signIn(mockEmail, mockPassword);
      
      if (!error) {
        toast({
          title: "Autenticación biométrica exitosa",
          description: `Bienvenido de vuelta${isRefugiLead ? ', Refugi Lead' : ''}`,
        });
        onComplete(true);
      } else {
        // Fallback a login manual
        onComplete(false);
      }
    } catch (error) {
      console.error("Face recognition error:", error);
      setStep('error');
      setTimeout(() => onComplete(false), 2000);
    }
  };

  const handleCancel = () => {
    onComplete(false);
  };

  const renderCameraView = () => (
    <>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/20 backdrop-blur-sm">
            <Camera className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-foreground">Reconocimiento Facial</CardTitle>
        <p className="text-muted-foreground text-sm">
          Posiciona tu rostro dentro del marco para continuar
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          {/* Simulación de cámara */}
          <div className="aspect-square bg-muted/20 border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center">
            {cameraActive ? (
              <div className="relative w-48 h-48 rounded-full border-4 border-primary/50 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-2 border-primary animate-pulse flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-primary/20 flex items-center justify-center">
                    <Shield className="h-12 w-12 text-primary" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-sm text-muted-foreground">Iniciando cámara...</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={startScanning}
            disabled={!cameraActive}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Scan className="mr-2 h-4 w-4" />
            Escanear
          </Button>
        </div>
      </CardContent>
    </>
  );

  const renderScanningView = () => (
    <>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/20 backdrop-blur-sm animate-pulse">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>
        <CardTitle className="text-foreground">Escaneando...</CardTitle>
        <p className="text-muted-foreground text-sm">
          Mantén tu rostro quieto durante el escaneo
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-center text-sm text-muted-foreground">
            {Math.round(progress)}% completado
          </p>
        </div>
      </CardContent>
    </>
  );

  const renderSuccessView = () => (
    <>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 rounded-full bg-safe/20 backdrop-blur-sm">
            <Check className="h-8 w-8 text-safe" />
          </div>
        </div>
        <CardTitle className="text-foreground">¡Autenticación exitosa!</CardTitle>
        <p className="text-muted-foreground text-sm">
          Reconocimiento facial completado correctamente
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-safe">
            <Check className="h-16 w-16" />
          </div>
        </div>
      </CardContent>
    </>
  );

  const renderErrorView = () => (
    <>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 rounded-full bg-destructive/20 backdrop-blur-sm">
            <X className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <CardTitle className="text-foreground">Error de reconocimiento</CardTitle>
        <p className="text-muted-foreground text-sm">
          No se pudo completar la autenticación biométrica
        </p>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleCancel}
          variant="outline"
          className="w-full"
        >
          Volver al login
        </Button>
      </CardContent>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 backdrop-blur-sm bg-card/80 shadow-soft">
          {step === 'camera' && renderCameraView()}
          {step === 'scanning' && renderScanningView()}
          {step === 'success' && renderSuccessView()}
          {step === 'error' && renderErrorView()}
        </Card>
      </div>
    </div>
  );
}