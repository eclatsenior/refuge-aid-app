import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export function PaymentCanceledPage() {
  const handleRetry = () => {
    window.location.href = "/stripe-test-secret";
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-orange-700">Pago Cancelado</CardTitle>
          <CardDescription>
            Has cancelado el proceso de pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No se ha realizado ningún cargo.
            </p>
            <p className="text-xs text-muted-foreground">
              Puedes intentarlo de nuevo cuando lo desees.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRetry}
              className="w-full"
              size="lg"
            >
              Volver a intentar
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
