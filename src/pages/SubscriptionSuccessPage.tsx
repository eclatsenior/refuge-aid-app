import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const loadSubscriptionStatus = useAppStore(state => state.loadSubscriptionStatus);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    
    if (sessionId) {
      console.log("✅ Subscription successful! Session ID:", sessionId);
      
      setTimeout(() => {
        loadSubscriptionStatus();
      }, 2000);
    }
  }, [loadSubscriptionStatus]);

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">¡Suscripción Exitosa!</CardTitle>
          <CardDescription>
            Tu suscripción se ha procesado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Ya puedes empezar a usar todas las funcionalidades de tu plan.
            </p>
            <p className="text-xs text-muted-foreground">
              Estamos actualizando tu cuenta ahora mismo...
            </p>
          </div>

          <Button
            onClick={handleGoToDashboard}
            className="w-full"
            size="lg"
          >
            Ir al Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
