import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function StripeTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Initiating payment...");
      
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {},
      });

      if (error) {
        console.error("❌ Error invoking function:", error);
        throw error;
      }

      if (data?.url) {
        console.log("✅ Redirecting to Stripe Checkout...");
        // Open Stripe Checkout in a new tab
        window.open(data.url, "_blank");
        
        toast({
          title: "Redirigiendo a Stripe",
          description: "Se ha abierto una nueva pestaña con el checkout de Stripe.",
        });
      } else {
        throw new Error("No se recibió URL de pago");
      }
    } catch (error) {
      console.error("❌ Payment error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la sesión de pago. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Página de Prueba de Stripe</CardTitle>
          <CardDescription>
            Prueba de integración de pagos con Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta es una página de prueba. Solo para testing de la integración de Stripe.
            </AlertDescription>
          </Alert>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Producto:</span>
              <span className="text-sm font-medium">Test Payment</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Precio:</span>
              <span className="text-sm font-medium">1,00 €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Product ID:</span>
              <span className="text-xs font-mono">prod_TD9wgu82DL64xM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Price ID:</span>
              <span className="text-xs font-mono">price_1SGjcBR3C9Xn67YcSRn18bDC</span>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando sesión de pago...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar 1€
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Al hacer clic, se abrirá una nueva pestaña con el checkout seguro de Stripe
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
