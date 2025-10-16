import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";

export function TeamSettingsSection() {
  const { t } = useTranslation();
  const { leadSettings, subscription, assignedEmployees, loadLeadSettings, updateLeadSettings } = useAppStore();
  const { toast } = useToast();

  if (!leadSettings || !subscription) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadLeadSettings();
  }, [loadLeadSettings]);

  useEffect(() => {
    if (leadSettings) {
      setWelcomeMessage(leadSettings.welcome_message_template);
    }
  }, [leadSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateLeadSettings({ welcome_message_template: welcomeMessage });
    toast({
      title: t('settings-lead:team.saved'),
      variant: "default"
    });
    setIsSaving(false);
  };

  const usedEmployees = assignedEmployees.length;
  const limitEmployees = subscription?.employee_limit || 0;
  const availableEmployees = limitEmployees - usedEmployees;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('settings-lead:team.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('settings-lead:team.currentLimit')}</span>
              <Badge variant="outline">{limitEmployees} empleadas</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('settings-lead:team.used')}</span>
              <Badge variant={usedEmployees >= limitEmployees ? "destructive" : "default"}>
                {usedEmployees}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('settings-lead:team.available')}</span>
              <Badge variant={availableEmployees > 0 ? "secondary" : "outline"}>
                {availableEmployees}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings-lead:team.welcomeMessage')}</CardTitle>
          <CardDescription>{t('settings-lead:team.welcomeMessageDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Mensaje</Label>
            <Textarea
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={5}
              placeholder="Escribe el mensaje de bienvenida para las nuevas empleadas..."
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Guardando..." : t('settings-lead:team.saved')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
