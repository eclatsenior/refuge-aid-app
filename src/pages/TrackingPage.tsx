import { useState, useEffect } from "react";
import { Calendar, Clock, TrendingUp, AlertCircle, CheckCircle, Heart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore, type CheckIn } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { ensureDate, safeToDateString, safeToLocaleTimeString, safeToLocaleDateString, safeGetTime } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { UserMenu } from "@/components/layout/UserMenu";
import { DiscreetVaultUnlockDialog } from "@/components/discreet/DiscreetVaultUnlockDialog";

interface TrackingPageProps {
  onNavigate: (path: string) => void;
}

export function TrackingPage({ onNavigate }: TrackingPageProps) {
  const [selectedStatus, setSelectedStatus] = useState<'ok' | 'anxious' | 'alert' | null>(null);
  const [vaultUnlockOpen, setVaultUnlockOpen] = useState(false);
  const { checkIns, addCheckIn, settings, updateSettings, updateEmployeePresence, profile } = useAppStore();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('tracking');
  const { t: tHome } = useTranslation('home');

  // Heartbeat system - update presence every 2 minutes while on this page
  useEffect(() => {
    const updatePresence = () => {
      updateEmployeePresence(true);
    };

    // Initial update
    updatePresence();

    // Set up interval for heartbeat
    const heartbeatInterval = setInterval(updatePresence, 2 * 60 * 1000); // 2 minutes

    // Update presence when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Mark as offline when leaving the page
      updateEmployeePresence(false);
    };
  }, [updateEmployeePresence]);
  
  const handleCheckIn = async (status: 'ok' | 'anxious' | 'alert') => {
    const mood = status === 'ok' ? 8 : status === 'anxious' ? 4 : 2;
    
    // Guardar en Supabase
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
        console.error('Error al guardar check-in:', error);
        toast({
          title: t('toast.error'),
          description: t('toast.errorDescription'),
          variant: "destructive"
        });
        return;
      }

      // También actualizar employee_status con el último mood
      const { error: statusError } = await supabase
        .from('employee_status')
        .update({
          mood_level: mood,
          last_check_in: new Date().toISOString()
        })
        .eq('employee_id', profile.user_id);

      if (statusError) {
        console.error('Error al actualizar estado:', statusError);
      }
    }

    // Guardar en localStorage para acceso offline
    const newCheckIn: Omit<CheckIn, 'id'> = {
      mood,
      status,
      timestamp: new Date(),
      location: settings.locationConsent ? 'Ubicación aproximada' : undefined
    };
    
    addCheckIn(newCheckIn);
    
    toast({
      title: t(`toast.${status}`),
      description: t('toast.saved'),
      variant: status === 'alert' ? 'destructive' : 'default'
    });
    
    if (status === 'alert') {
      // In a real app, this could trigger additional actions
      setTimeout(() => {
        toast({
          title: t('toast.needHelp'),
          description: t('toast.useEmergency'),
          duration: 8000
        });
      }, 2000);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-safe text-safe-foreground';
      case 'anxious':
        return 'bg-warning text-warning-foreground';
      case 'alert':
        return 'bg-emergency text-emergency-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ok':
        return t('status.stable.label');
      case 'anxious':
        return t('status.anxious.label');
      case 'alert':
        return t('status.alert.label');
      default:
        return t('status.stable.label');
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4" />;
      case 'anxious':
        return <Clock className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };
  
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };
  
  const getCheckInForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return checkIns.find(checkIn => 
      safeToDateString(checkIn.timestamp) === dateStr
    );
  };
  
  const getWeeklyStats = () => {
    const last7Days = getLast7Days();
    const weekCheckIns = last7Days.map(date => getCheckInForDate(date)).filter(Boolean);
    
    const okCount = weekCheckIns.filter(c => c?.status === 'ok').length;
    const anxiousCount = weekCheckIns.filter(c => c?.status === 'anxious').length;
    const alertCount = weekCheckIns.filter(c => c?.status === 'alert').length;
    
    return { okCount, anxiousCount, alertCount, totalDays: last7Days.length };
  };
  
  const stats = getWeeklyStats();
  const last7Days = getLast7Days();
  const todayCheckIn = getCheckInForDate(new Date());
  
  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <UserMenu onNavigate={onNavigate} />
      </header>
      
      {!todayCheckIn && (
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
            <CardDescription className="text-base">
              {t('todayDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <Button
                onClick={() => handleCheckIn('ok')}
                className="h-20 justify-start gap-6 bg-mint/10 hover:bg-mint/20 text-mint border-mint/20 rounded-2xl shadow-soft relative overflow-hidden group"
                variant="outline"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-mint to-mint/80 flex items-center justify-center shadow-lg">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground">{t('status.stable.title')}</div>
                  <div className="text-sm text-muted-foreground">{t('status.stable.description')}</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCheckIn('anxious')}
                className="h-20 justify-start gap-6 bg-coral/10 hover:bg-coral/20 text-coral border-coral/20 rounded-2xl shadow-soft relative overflow-hidden group"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-coral to-coral/80 flex items-center justify-center shadow-lg">
                  <Clock size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground">{t('status.anxious.title')}</div>
                  <div className="text-sm text-muted-foreground">{t('status.anxious.description')}</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCheckIn('alert')}
                className="h-20 justify-start gap-6 bg-emergency/10 hover:bg-emergency/20 text-emergency border-emergency/20 rounded-2xl shadow-soft relative overflow-hidden group"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emergency to-emergency/80 flex items-center justify-center shadow-lg">
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground">{t('status.alert.title')}</div>
                  <div className="text-sm text-muted-foreground">{t('status.alert.description')}</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {todayCheckIn && (
        <Card className="mb-8 bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg ${
                  todayCheckIn.status === 'ok' ? 'bg-gradient-to-br from-mint to-mint/80' :
                  todayCheckIn.status === 'anxious' ? 'bg-gradient-to-br from-coral to-coral/80' :
                  'bg-gradient-to-br from-emergency to-emergency/80'
                }`}>
                  <div className="text-white">
                    {todayCheckIn.status === 'ok' ? <CheckCircle size={24} /> :
                     todayCheckIn.status === 'anxious' ? <Clock size={24} /> :
                     <AlertCircle size={24} />}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-lg text-foreground">{t('statusRegistered')}</div>
                  <div className="text-sm text-muted-foreground">
                    {safeToLocaleTimeString(todayCheckIn.timestamp, i18n.language, {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <Badge className={`${
                todayCheckIn.status === 'ok' ? 'bg-mint/20 text-mint border-mint/30' :
                todayCheckIn.status === 'anxious' ? 'bg-coral/20 text-coral border-coral/30' :
                'bg-emergency/20 text-emergency border-emergency/30'
              }`}>
                {getStatusLabel(todayCheckIn.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="mb-8 bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-cyan" />
            </div>
            {t('weeklySummary.title')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('weeklySummary.description', { 
              registered: stats.okCount + stats.anxiousCount + stats.alertCount, 
              total: stats.totalDays 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-mint/20 flex items-center justify-center">
                <div className="text-2xl font-bold text-mint">{stats.okCount}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">{t('weeklySummary.stableDays')}</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-coral/20 flex items-center justify-center">
                <div className="text-2xl font-bold text-coral">{stats.anxiousCount}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">{t('weeklySummary.anxiousDays')}</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-emergency/20 flex items-center justify-center">
                <div className="text-2xl font-bold text-emergency">{stats.alertCount}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">{t('weeklySummary.alertDays')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            {t('last7Days')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {last7Days.map((date, index) => {
              const checkIn = getCheckInForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-2 font-medium">
                    {date.toLocaleDateString(i18n.language, { weekday: 'short' })}
                  </div>
                  <div className="text-sm mb-3 font-semibold">
                    {date.getDate()}
                  </div>
                  <div className={`w-10 h-10 mx-auto rounded-full border-2 flex items-center justify-center shadow-sm ${
                    isToday ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  } ${
                    checkIn 
                      ? checkIn.status === 'ok' ? 'bg-gradient-to-br from-mint to-mint/80' :
                        checkIn.status === 'anxious' ? 'bg-gradient-to-br from-coral to-coral/80' :
                        'bg-gradient-to-br from-emergency to-emergency/80'
                      : 'bg-muted/50'
                  }`}>
                    {checkIn ? (
                      <div className="text-white">
                        {checkIn.status === 'ok' ? <CheckCircle className="h-4 w-4" /> :
                         checkIn.status === 'anxious' ? <Clock className="h-4 w-4" /> :
                         <AlertCircle className="h-4 w-4" />}
                      </div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {checkIns.length > 0 && (
        <Card className="mt-8 bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">{t('recentHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkIns
                .sort((a, b) => safeGetTime(b.timestamp) - safeGetTime(a.timestamp))
                .slice(0, 5)
                .map((checkIn, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${
                        checkIn.status === 'ok' ? 'bg-gradient-to-br from-mint to-mint/80' :
                        checkIn.status === 'anxious' ? 'bg-gradient-to-br from-coral to-coral/80' :
                        'bg-gradient-to-br from-emergency to-emergency/80'
                      }`}>
                        <div className="text-white">
                          {checkIn.status === 'ok' ? <CheckCircle className="h-4 w-4" /> :
                           checkIn.status === 'anxious' ? <Clock className="h-4 w-4" /> :
                           <AlertCircle className="h-4 w-4" />}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{getStatusLabel(checkIn.status)}</div>
                        <div className="text-sm text-muted-foreground">
                          {safeToLocaleDateString(checkIn.timestamp, i18n.language, {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      
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