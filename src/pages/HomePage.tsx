import { useState, useEffect } from "react";
import { Shield, Settings, Eye, EyeOff } from "lucide-react";
import { EmergencyButton } from "@/components/emergency/EmergencyButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { safeToLocaleDateString } from "@/lib/dateUtils";
import { MessagingButton } from "@/components/messaging/MessagingButton";
import { MessageCenter } from "@/components/messaging/MessageCenter";
import { useTranslation } from "react-i18next";

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { settings, updateSettings, trustedContacts, checkIns, triggerEmergency } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [messageCenterOpen, setMessageCenterOpen] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const handleEmergencyAction = (action: 'call' | 'whatsapp' | 'sms') => {
    if (action === 'call') {
      toast({
        title: t('emergency.callTitle'),
        description: t('emergency.callDescription')
      });
    } else {
      const method = action === 'whatsapp' ? 'WhatsApp' : 'SMS';
      toast({
        title: t('emergency.alertSent'),
        description: t('emergency.alertDescription', { method })
      });
    }
  };
  
  const toggleDiscreetMode = () => {
    updateSettings({ isDiscreetMode: !settings.isDiscreetMode });
    toast({
      title: settings.isDiscreetMode ? t('modeToggle.normalActivated') : t('modeToggle.discreetActivated'),
      description: settings.isDiscreetMode 
        ? t('modeToggle.normalDescription') 
        : t('modeToggle.discreetDescription')
    });
  };
  
  const getLastCheckIn = () => {
    if (checkIns.length === 0) return null;
    return checkIns[checkIns.length - 1];
  };
  
  const lastCheckIn = getLastCheckIn();
  
  // Debug logging to understand the lastCheckIn object structure
  console.log('lastCheckIn:', lastCheckIn);
  if (lastCheckIn) {
    console.log('lastCheckIn.timestamp:', lastCheckIn.timestamp);
    console.log('lastCheckIn.timestamp type:', typeof lastCheckIn.timestamp);
    console.log('lastCheckIn.timestamp instanceof Date:', lastCheckIn.timestamp instanceof Date);
  }
  
  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  if (settings.isDiscreetMode) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('discreetMode.title')}</h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDiscreetMode}
            className="gap-2 border border-border/50"
          >
            <Eye size={16} />
            {t('discreetMode.show')}
          </Button>
        </header>
        
        <div className="space-y-4">
          <EmergencyButton 
            isDiscreetMode={true} 
            onEmergencyAction={handleEmergencyAction}
          />
          
          <Card className="bg-card/90 border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {t('discreetMode.description')}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <MessagingButton onClick={() => setMessageCenterOpen(true)} />
        <MessageCenter open={messageCenterOpen} onOpenChange={setMessageCenterOpen} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-dark p-4 pb-20">
      <header className="flex justify-between items-center mb-8 pt-2">
        <div className="text-foreground">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/ab59b871-ef85-416f-b9a7-a56d51de5d43.png" 
              alt="Refugi Logo" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-2xl font-bold drop-shadow-lg">{t('title')}</h1>
          </div>
          <p className="text-muted-foreground text-sm drop-shadow-sm">
            {timeFormatter.format(currentTime)} - {currentTime.toLocaleDateString('es-ES', { 
              weekday: 'long' 
            })}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDiscreetMode}
            className="text-foreground hover:bg-secondary/50 gap-2 border border-border/50"
          >
            <EyeOff size={16} />
            {t('discreetMode.hide')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/ajustes')}
            className="text-foreground hover:bg-secondary/50 border border-border/50"
          >
            <Settings size={20} />
          </Button>
        </div>
      </header>
      
      <main className="space-y-8">
        <div className="flex flex-col items-center justify-center py-12">
          <EmergencyButton 
            onEmergencyAction={handleEmergencyAction}
          />
        </div>
        
        <div className="grid gap-4">
          <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-mint">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground">{t('safetyStatus.title')}</CardTitle>
                <Badge 
                  variant={lastCheckIn?.status === 'ok' ? 'default' : 'destructive'}
                  className={`${
                    lastCheckIn?.status === 'ok' 
                      ? 'bg-mint/20 text-mint-foreground border-mint/30' 
                      : lastCheckIn?.status === 'anxious' 
                        ? 'bg-coral/20 text-coral-foreground border-coral/30'
                        : 'bg-warning/20 text-warning-foreground border-warning/30'
                  }`}
                >
                  {lastCheckIn?.status === 'ok' ? t('safetyStatus.safe') : 
                   lastCheckIn?.status === 'anxious' ? t('safetyStatus.anxious') : 
                   lastCheckIn?.status === 'alert' ? t('safetyStatus.alert') : t('safetyStatus.noRecords')}
                </Badge>
              </div>
              <CardDescription className="text-muted-foreground">
                {lastCheckIn 
                  ? t('safetyStatus.lastCheckIn', { date: safeToLocaleDateString(lastCheckIn.timestamp, 'es-ES') })
                  : t('safetyStatus.noRecent')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onNavigate('/seguimiento')}
                variant="secondary"
                size="sm"
                className="w-full bg-mint/20 hover:bg-mint/30 text-mint-foreground border-mint/30 shadow-mint"
              >
                {t('safetyStatus.registerNow')}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-cyan">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-cyan" />
                <CardTitle className="text-lg text-foreground">{t('supportNetwork.title')}</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                {trustedContacts.length > 0 
                  ? t('supportNetwork.contacts', { count: trustedContacts.length })
                  : t('supportNetwork.noContacts')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onNavigate('/ajustes')}
                variant="secondary"
                size="sm"
                className="w-full bg-cyan/20 hover:bg-cyan/30 text-cyan-foreground border-cyan/30 shadow-cyan"
              >
                {trustedContacts.length > 0 ? t('supportNetwork.manage') : t('supportNetwork.add')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <MessagingButton onClick={() => setMessageCenterOpen(true)} />
      <MessageCenter open={messageCenterOpen} onOpenChange={setMessageCenterOpen} />
    </div>
  );
}