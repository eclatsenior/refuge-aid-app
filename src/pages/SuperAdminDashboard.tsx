import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SuperAdminOverview } from '@/components/super-admin/SuperAdminOverview';
import { SuperAdminUsersTab } from '@/components/super-admin/SuperAdminUsersTab';
import { SuperAdminSubscriptionsTab } from '@/components/super-admin/SuperAdminSubscriptionsTab';
import { SuperAdminAlertsTab } from '@/components/super-admin/SuperAdminAlertsTab';
import { SuperAdminMetricsTab } from '@/components/super-admin/SuperAdminMetricsTab';
import { SuperAdminSettingsTab } from '@/components/super-admin/SuperAdminSettingsTab';

export default function SuperAdminDashboard() {
  const { t } = useTranslation('superAdmin');
  const user = useAppStore((state) => state.user);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuperAdminStatus();
  }, [user?.id]);

  const checkSuperAdminStatus = async () => {
    if (!user?.id) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_super_admin', { check_user_id: user.id });
      if (error) throw error;
      setIsSuperAdmin(data === true);
    } catch (error) {
      console.error('Error checking super admin status:', error);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.pushState({}, '', '/perfil');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">{t('accessDenied')}</h1>
          <p className="text-muted-foreground">{t('noPermission')}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('goBack')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                {t('title')}
              </h1>
              <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>
            <TabsTrigger value="subscriptions">{t('tabs.subscriptions')}</TabsTrigger>
            <TabsTrigger value="alerts">{t('tabs.alerts')}</TabsTrigger>
            <TabsTrigger value="metrics">{t('tabs.metrics')}</TabsTrigger>
            <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SuperAdminOverview />
          </TabsContent>

          <TabsContent value="users">
            <SuperAdminUsersTab />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SuperAdminSubscriptionsTab />
          </TabsContent>

          <TabsContent value="alerts">
            <SuperAdminAlertsTab />
          </TabsContent>

          <TabsContent value="metrics">
            <SuperAdminMetricsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SuperAdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
