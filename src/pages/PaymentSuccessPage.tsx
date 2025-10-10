import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function PaymentSuccessPage() {
  useEffect(() => {
    // Get session_id from URL if needed for verification
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    
    if (sessionId) {
      console.log("✅ Payment successful! Session ID:", sessionId);
    }
  }, []);

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">¡Pago Exitoso!</CardTitle>
          <CardDescription>
            Tu pago de prueba se ha procesado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              El pago de <span className="font-bold text-foreground">1,00 €</span> se ha completado exitosamente.
            </p>
            <p className="text-xs text-muted-foreground">
              Esta fue una transacción de prueba con Stripe.
            </p>
          </div>

          <Button
            onClick={handleGoHome}
            className="w-full"
            size="lg"
          >
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
