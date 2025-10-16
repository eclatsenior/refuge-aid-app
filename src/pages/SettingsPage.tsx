import { useState } from "react";
import { ArrowLeft, Plus, Bell, Lock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TrustedContactsList } from "@/components/settings/TrustedContactsList";
import { TrustedContactDialog } from "@/components/settings/TrustedContactDialog";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const { settings, updateSettings } = useAppStore();
  const { t } = useTranslation('settings');

  const handleToggleVibration = (checked: boolean) => {
    updateSettings({ phoneVibration: checked });
    toast.success(checked ? t('notifications.vibrationEnabled') : t('notifications.vibrationDisabled'));
  };

  const handleToggleSoundAlerts = (checked: boolean) => {
    updateSettings({ soundAlerts: checked });
    toast.success(checked ? t('notifications.soundEnabled') : t('notifications.soundDisabled'));
  };

  const handleToggleDiscreetMode = (checked: boolean) => {
    updateSettings({ isDiscreetMode: checked });
    toast.success(checked ? t('privacy.discreetEnabled') : t('privacy.discreetDisabled'));
  };

  const handleToggleShareLocation = (checked: boolean) => {
    updateSettings({ locationConsent: checked });
    toast.success(checked ? t('privacy.locationEnabled') : t('privacy.locationDisabled'));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("/")}
            aria-label={t('back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Emergency Contacts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📞</span>
              {t('emergencyContacts.title')}
            </CardTitle>
            <CardDescription>
              {t('emergencyContacts.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TrustedContactsList onAddContact={() => setIsContactDialogOpen(true)} />
            
            <Button
              onClick={() => setIsContactDialogOpen(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('emergencyContacts.add')}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="vibration" className="flex-1 cursor-pointer">
                {t('notifications.vibration')}
              </Label>
              <Switch
                id="vibration"
                checked={settings.phoneVibration}
                onCheckedChange={handleToggleVibration}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sound" className="flex-1 cursor-pointer">
                {t('notifications.soundAlerts')}
              </Label>
              <Switch
                id="sound"
                checked={settings.soundAlerts}
                onCheckedChange={handleToggleSoundAlerts}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('privacy.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="discreet" className="cursor-pointer">
                  {t('privacy.discreetMode')}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('privacy.discreetDescription')}
                </p>
              </div>
              <Switch
                id="discreet"
                checked={settings.isDiscreetMode}
                onCheckedChange={handleToggleDiscreetMode}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="location" className="cursor-pointer flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('privacy.shareLocation')}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('privacy.shareLocationDescription')}
                </p>
              </div>
              <Switch
                id="location"
                checked={settings.locationConsent}
                onCheckedChange={handleToggleShareLocation}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Dialog */}
      <TrustedContactDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
      />
    </div>
  );
}
