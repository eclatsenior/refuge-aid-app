import { useState, useEffect } from "react";
import { Heart, Lock, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { safeToLocaleTimeString } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { UserMenu } from "@/components/layout/UserMenu";
import { DiscreetVaultUnlockDialog } from "@/components/discreet/DiscreetVaultUnlockDialog";
import { TrackingSummary } from "@/components/tracking/TrackingSummary";
import { TrackingHistory } from "@/components/tracking/TrackingHistory";

interface TrackingPageProps {
  onNavigate: (path: string) => void;
}

export function TrackingPage({ onNavigate }: TrackingPageProps) {
  const [vaultUnlockOpen, setVaultUnlockOpen] = useState(false);
  const { checkIns, addCheckIn, settings, updateSettings, updateEmployeePresence, profile } = useAppStore();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('tracking');
  const { t: tHome } = useTranslation('home');

  // Heartbeat system
  useEffect(() => {
    const updatePresence = () => updateEmployeePresence(true);
    updatePresence();
    const heartbeatInterval = setInterval(updatePresence, 2 * 60 * 1000);
    const handleVisibilityChange = () => { if (!document.hidden) updatePresence(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updateEmployeePresence(false);
    };
  }, [updateEmployeePresence]);

  const handleCheckIn = async (status: 'ok' | 'anxious' | 'alert') => {
    const mood = status === 'ok' ? 8 : status === 'anxious' ? 4 : 2;

    if (profile?.user_id) {
      const { error } = await supabase
        .from('mood_check_ins')
        .insert({
          employee_id: profile.user_id,
          mood_level: mood,
          status,
          location_data: settings.locationConsent
            ? { approximate: true, timestamp: new Date().toISOString() }
            : null
        });

      if (error) {
        toast({ title: t('toast.error'), description: t('toast.errorDescription'), variant: "destructive" });
        return;
      }

      await supabase
        .from('employee_status')
        .update({ mood_level: mood, last_check_in: new Date().toISOString() })
        .eq('employee_id', profile.user_id);
    }

    addCheckIn({ mood, status, timestamp: new Date(), location: settings.locationConsent ? 'Ubicación aproximada' : undefined });

    toast({
      title: t(`toast.${status}`),
      description: t('toast.saved'),
      variant: status === 'alert' ? 'destructive' : 'default'
    });

    if (status === 'alert') {
      setTimeout(() => {
        toast({ title: t('toast.needHelp'), description: t('toast.useEmergency'), duration: 8000 });
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <UserMenu onNavigate={onNavigate} />
      </header>

      {/* Always show check-in buttons */}
      <Card className="mb-8 bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                settings.isDiscreetMode
                  ? 'bg-primary/20 cursor-pointer hover:bg-primary/30 transition-colors'
                  : 'bg-primary/20'
              }`}
              onClick={settings.isDiscreetMode ? () => setVaultUnlockOpen(true) : undefined}
              role={settings.isDiscreetMode ? 'button' : undefined}
              tabIndex={settings.isDiscreetMode ? 0 : undefined}
              aria-label={settings.isDiscreetMode ? tHome('vaultUnlock.title') : undefined}
            >
              {settings.isDiscreetMode ? (
                <Lock className="h-5 w-5 text-primary" />
              ) : (
                <Heart className="h-5 w-5 text-primary" />
              )}
            </div>
            {t('todayQuestion')}
          </CardTitle>
          <CardDescription className="text-base">{t('todayDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {([
              { status: 'ok' as const, icon: CheckCircle, color: 'mint', titleKey: 'status.stable.title', descKey: 'status.stable.description' },
              { status: 'anxious' as const, icon: Clock, color: 'coral', titleKey: 'status.anxious.title', descKey: 'status.anxious.description' },
              { status: 'alert' as const, icon: AlertCircle, color: 'emergency', titleKey: 'status.alert.title', descKey: 'status.alert.description' },
            ]).map(({ status, icon: Icon, color, titleKey, descKey }) => (
              <Button
                key={status}
                variant="outline"
                onClick={() => handleCheckIn(status)}
                className={`h-20 justify-start gap-6 bg-${color}/10 hover:bg-${color}/20 text-${color} border-${color}/20 rounded-2xl shadow-soft`}
              >
                <div className={`h-14 w-14 rounded-full bg-gradient-to-br from-${color} to-${color}/80 flex items-center justify-center shadow-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground">{t(titleKey)}</div>
                  <div className="text-sm text-muted-foreground">{t(descKey)}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary with period filters and interactive day heart */}
      <div className="mb-8">
        <TrackingSummary checkIns={checkIns} />
      </div>

      <DiscreetVaultUnlockDialog
        open={vaultUnlockOpen}
        onOpenChange={setVaultUnlockOpen}
        onSuccess={() => {
          updateSettings({ isDiscreetMode: false });
          toast({
            title: tHome('modeToggle.normalActivated'),
            description: tHome('modeToggle.normalDescription'),
          });
        }}
      />
    </div>
  );
}
