import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";

export default function AdminAssignSubscription() {
  const [userEmail, setUserEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof SUBSCRIPTION_PLANS | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAssign = async () => {
    if (!userEmail || !selectedPlan) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const plan = SUBSCRIPTION_PLANS[selectedPlan];
      
      const { data, error } = await supabase.functions.invoke('assign-subscription', {
        body: {
          userEmail,
          productId: plan.product_id,
          priceId: plan.price_id,
          employeeLimit: plan.employee_limit
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Suscripción asignada",
        description: `Plan ${plan.name} asignado a ${userEmail}`,
      });

      setUserEmail("");
      setSelectedPlan("");
    } catch (error: any) {
      console.error('Error assigning subscription:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar la suscripción",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Asignar Suscripción Manualmente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email del Usuario</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan de Suscripción</Label>
            <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as keyof typeof SUBSCRIPTION_PLANS)}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                  <SelectItem key={key} value={key}>
                    {plan.name} - €{plan.price}/mes ({plan.employee_limit} empleadas)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAssign} 
            disabled={isLoading || !userEmail || !selectedPlan}
            className="w-full"
          >
            {isLoading ? "Asignando..." : "Asignar Suscripción"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
