import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SubscriptionPlansProps {
  currentProductId?: string | null;
  onCheckoutStart?: () => void;
}

export function SubscriptionPlans({ currentProductId, onCheckoutStart }: SubscriptionPlansProps) {
  const { toast } = useToast();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, planName: string) => {
    try {
      setLoadingPlanId(priceId);
      onCheckoutStart?.();

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el proceso de pago. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlanId(null);
    }
  };

  const plans = Object.values(SUBSCRIPTION_PLANS).filter(plan => plan.product_id !== SUBSCRIPTION_PLANS.individual.product_id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
      {plans.map((plan) => {
        const isCurrentPlan = currentProductId === plan.product_id;
        
        return (
          <Card 
            key={plan.product_id}
            className={`relative flex flex-col ${
              isCurrentPlan 
                ? 'border-primary shadow-lg' 
                : plan.popular 
                  ? 'border-secondary shadow-md' 
                  : ''
            }`}
          >
            {plan.popular && !isCurrentPlan && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  Más Popular
                </Badge>
              </div>
            )}
            {isCurrentPlan && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Tu Plan Actual
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-4xl font-bold text-foreground">{plan.price}€</span>
                <span className="text-muted-foreground">/mes</span>
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                {plan.employee_limit} empleadas máximo
              </p>
            </CardHeader>

            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={isCurrentPlan ? "outline" : "default"}
                disabled={isCurrentPlan || loadingPlanId === plan.price_id}
                onClick={() => handleSubscribe(plan.price_id, plan.name)}
              >
                {loadingPlanId === plan.price_id 
                  ? "Procesando..." 
                  : isCurrentPlan 
                    ? "Plan Actual" 
                    : "Contratar Plan"
                }
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
