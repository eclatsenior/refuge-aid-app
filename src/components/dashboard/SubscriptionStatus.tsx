import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Calendar, Users, ExternalLink, RefreshCw } from "lucide-react";
import { getPlanNameByProductId } from "@/lib/subscriptionPlans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTranslation } from 'react-i18next';

interface SubscriptionStatusProps {
  subscription: {
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
    employee_limit: number;
  };
  currentEmployeeCount: number;
  onRefresh: () => void;
  onViewPlans: () => void;
}

export function SubscriptionStatus({ 
  subscription, 
  currentEmployeeCount, 
  onRefresh,
  onViewPlans 
}: SubscriptionStatusProps) {
  const { toast } = useToast();
  const { t } = useTranslation('subscription');
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const usagePercentage = subscription.employee_limit > 0 
    ? (currentEmployeeCount / subscription.employee_limit) * 100 
    : 0;
  
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = currentEmployeeCount >= subscription.employee_limit;

  const handleManageSubscription = async () => {
    try {
      setIsLoadingPortal(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: t('status.error'),
        description: t('status.errorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!subscription.subscribed || !subscription.product_id) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            {t('status.noSubscription')}
          </CardTitle>
          <CardDescription>
            {t('status.noSubscriptionDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onViewPlans} className="w-full">
            {t('status.viewPlans')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const planName = getPlanNameByProductId(subscription.product_id);
  const endDate = subscription.subscription_end 
    ? new Date(subscription.subscription_end).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'No disponible';

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {planName}
              <Badge variant="outline" className="ml-2">{t('status.active')}</Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t('status.renewal')}: {endDate}
              </span>
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {t('status.employeesRegistered')}
            </span>
            <span className={isAtLimit ? 'text-destructive font-semibold' : ''}>
              {currentEmployeeCount} / {subscription.employee_limit}
            </span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-2 ${isNearLimit ? 'bg-destructive/20' : ''}`}
          />
          {isNearLimit && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {isAtLimit 
                ? t('status.atLimit')
                : t('status.nearLimit')
              }
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleManageSubscription}
            disabled={isLoadingPortal}
            className="flex-1"
          >
            {isLoadingPortal ? t('status.opening') : t('status.manage')}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <Button 
            onClick={onViewPlans}
            variant="outline"
            className="flex-1"
          >
            {t('status.viewOtherPlans')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
