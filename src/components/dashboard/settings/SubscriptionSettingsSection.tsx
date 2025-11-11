import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/dateUtils';
import { getTranslatedPlanName } from '@/lib/subscriptionPlans';

export function SubscriptionSettingsSection() {
  const { t, i18n } = useTranslation();
  const { subscription, assignedEmployees } = useAppStore();
  const { toast } = useToast();

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleOpenCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { return_url: window.location.href }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: t('settings-lead:subscription.errorOpening'),
        description: t('settings-lead:subscription.tryAgainLater'),
        variant: "destructive"
      });
    }
  };

  const getPlanName = () => {
    if (!subscription?.product_id) return t('settings-lead:subscription.noSubscription');
    return getTranslatedPlanName(subscription.product_id, (key: string) => t(`subscription:${key}`));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), 'PP', { 
      locale: getDateFnsLocale(i18n.language) 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings-lead:subscription.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('settings-lead:subscription.currentPlan')}</span>
            <Badge variant={subscription?.subscribed ? "default" : "secondary"}>
              {getPlanName()}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('settings-lead:subscription.renewalDate')}</span>
            <span className="text-sm font-medium">
              {formatDate(subscription?.subscription_end || null)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('settings-lead:subscription.employeeLimit')}</span>
            <span className="text-sm font-medium">
              {subscription?.employee_limit || 0}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('settings-lead:subscription.employeesUsed')}</span>
            <Badge variant={assignedEmployees.length >= (subscription?.employee_limit || 0) ? "destructive" : "outline"}>
              {assignedEmployees.length} / {subscription?.employee_limit || 0}
            </Badge>
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <Button
            onClick={handleOpenCustomerPortal}
            className="w-full"
            variant="default"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('settings-lead:subscription.manageInStripe')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
