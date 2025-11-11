import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_PLANS, getTranslatedPlanName, getTranslatedFeature } from "@/lib/subscriptionPlans";
import { useTranslation } from 'react-i18next';

export function IndividualSubscriptionPlans() {
  const { toast } = useToast();
  const { t } = useTranslation('subscription');
  const [loading, setLoading] = useState(false);

  const individualPlan = SUBSCRIPTION_PLANS.individual;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-individual-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de checkout');
      }
    } catch (error: any) {
      console.error('Error al crear checkout:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar el proceso de pago. Intenta de nuevo.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto border-primary/20 shadow-xl">
      <CardHeader className="text-center bg-gradient-to-b from-primary/5 to-transparent pb-8">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
            {t('ui.individualPlanLabel')}
          </span>
        </div>
        <CardTitle className="text-3xl font-bold">
          {getTranslatedPlanName(individualPlan.product_id, t)}
        </CardTitle>
        <CardDescription className="text-2xl mt-4">
          <span className="text-5xl font-bold text-foreground">{individualPlan.price}€</span>
          <span className="text-muted-foreground text-lg">{t('ui.perMonth')}</span>
        </CardDescription>
        <p className="text-sm text-muted-foreground mt-2">
          {t('ui.cancelAnytime')}
        </p>
      </CardHeader>
      
      <CardContent className="pt-6">
        <ul className="space-y-4">
          {individualPlan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="w-5 h-5 text-primary shrink-0" />
              </div>
              <span className="text-sm leading-relaxed">
                {getTranslatedFeature(feature, t)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4 pt-6">
        <Button
          className="w-full h-12 text-base font-semibold"
          size="lg"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('plans.processing')}
            </>
          ) : (
            t('ui.startSubscription')
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          {t('ui.securePayment')}
        </p>
      </CardFooter>
    </Card>
  );
}
