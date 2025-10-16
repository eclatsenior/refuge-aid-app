import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageSelector } from "@/components/profile/LanguageSelector";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function AccountSettingsSection() {
  const { t } = useTranslation();
  const { profile } = useAppStore();
  const { toast } = useToast();

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [timezone, setTimezone] = useState(profile?.timezone || "Europe/Madrid");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile?.user_id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          timezone: timezone
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast({
        title: t('settings-lead:account.saved'),
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error al guardar",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings-lead:account.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('settings-lead:account.fullName')}</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('settings-lead:account.email')}</Label>
          <Input
            id="email"
            type="email"
            value={profile?.email || ""}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('settings-lead:account.phone')}</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 123 456"
          />
        </div>

        <div className="space-y-2">
          <Label>{t('settings-lead:account.language')}</Label>
          <LanguageSelector />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">{t('settings-lead:account.timezone')}</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Guardando..." : t('settings-lead:account.save')}
        </Button>
      </CardContent>
    </Card>
  );
}
