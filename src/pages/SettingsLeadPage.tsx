import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { AccountSettingsSection } from "@/components/dashboard/settings/AccountSettingsSection";
import { NotificationsSettingsSection } from "@/components/dashboard/settings/NotificationsSettingsSection";
import { SubscriptionSettingsSection } from "@/components/dashboard/settings/SubscriptionSettingsSection";
import { DashboardPreferences } from "@/components/dashboard/settings/DashboardPreferences";
import { TeamSettingsSection } from "@/components/dashboard/settings/TeamSettingsSection";
import { InstallationSettingsSection } from "@/components/dashboard/settings/InstallationSettingsSection";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAppStore } from "@/store/useAppStore";

interface SettingsLeadPageProps {
  onNavigate?: (path: string) => void;
}

export default function SettingsLeadPage({ onNavigate }: SettingsLeadPageProps = {}) {
  const { t } = useTranslation();
  const { leadSettings, loadLeadSettings } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadLeadSettings();
      setIsLoading(false);
    };
    
    if (!leadSettings) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [leadSettings, loadLeadSettings]);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('/dashboard');
    } else {
      window.location.href = '/dashboard';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('settings-lead:backToDashboard')}
            </Button>
            <h1 className="text-2xl font-bold">{t('settings-lead:title')}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="account">{t('settings-lead:tabs.account')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('settings-lead:tabs.notifications')}</TabsTrigger>
            <TabsTrigger value="subscription">{t('settings-lead:tabs.subscription')}</TabsTrigger>
            <TabsTrigger value="dashboard">{t('settings-lead:tabs.dashboard')}</TabsTrigger>
            <TabsTrigger value="team">{t('settings-lead:tabs.team')}</TabsTrigger>
            <TabsTrigger value="installation">Instalación</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountSettingsSection />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsSettingsSection />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionSettingsSection />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardPreferences />
          </TabsContent>

          <TabsContent value="team">
            <TeamSettingsSection />
          </TabsContent>

          <TabsContent value="installation">
            <InstallationSettingsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
