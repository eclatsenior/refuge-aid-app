import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

export function NotificationsSettingsSection() {
  const { t } = useTranslation();
  const { leadSettings, loadLeadSettings, updateLeadSettings } = useAppStore();
  const { toast } = useToast();

  if (!leadSettings) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");

  useEffect(() => {
    loadLeadSettings();
  }, [loadLeadSettings]);

  useEffect(() => {
    if (leadSettings) {
      setAudioAlerts(leadSettings.audio_alerts_enabled);
      setPushNotifications(leadSettings.push_notifications_enabled);
      setEmailNotifications(leadSettings.email_notifications_enabled);
      setQuietStart(leadSettings.quiet_hours_start);
      setQuietEnd(leadSettings.quiet_hours_end);
    }
  }, [leadSettings]);

  const handleUpdate = async (updates: any) => {
    await updateLeadSettings(updates);
    toast({
      title: t('settings-lead:notifications.saved'),
      variant: "default"
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings-lead:notifications.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings-lead:notifications.audioAlerts')}</Label>
              <CardDescription>{t('settings-lead:notifications.audioAlertsDesc')}</CardDescription>
            </div>
            <Switch
              checked={audioAlerts}
              onCheckedChange={(checked) => {
                setAudioAlerts(checked);
                handleUpdate({ audio_alerts_enabled: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings-lead:notifications.pushNotifications')}</Label>
              <CardDescription>{t('settings-lead:notifications.pushNotificationsDesc')}</CardDescription>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={(checked) => {
                setPushNotifications(checked);
                handleUpdate({ push_notifications_enabled: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings-lead:notifications.emailNotifications')}</Label>
              <CardDescription>{t('settings-lead:notifications.emailNotificationsDesc')}</CardDescription>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={(checked) => {
                setEmailNotifications(checked);
                handleUpdate({ email_notifications_enabled: checked });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings-lead:notifications.quietHours')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietStart">{t('settings-lead:notifications.quietHoursStart')}</Label>
              <Input
                id="quietStart"
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                onBlur={() => handleUpdate({ quiet_hours_start: quietStart })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietEnd">{t('settings-lead:notifications.quietHoursEnd')}</Label>
              <Input
                id="quietEnd"
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                onBlur={() => handleUpdate({ quiet_hours_end: quietEnd })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
