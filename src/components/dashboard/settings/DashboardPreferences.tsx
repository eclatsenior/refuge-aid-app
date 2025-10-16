import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

export function DashboardPreferences() {
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
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
  
  const [autoRefresh, setAutoRefresh] = useState(30);
  const [showKpis, setShowKpis] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showQueue, setShowQueue] = useState(true);
  const [mediumRisk, setMediumRisk] = useState(40);
  const [highRisk, setHighRisk] = useState(70);

  useEffect(() => {
    loadLeadSettings();
  }, [loadLeadSettings]);

  useEffect(() => {
    if (leadSettings) {
      setAutoRefresh(leadSettings.auto_refresh_interval);
      setShowKpis(leadSettings.show_kpis_section);
      setShowReports(leadSettings.show_reports_section);
      setShowQueue(leadSettings.show_attention_queue);
      setMediumRisk(leadSettings.risk_threshold_medium);
      setHighRisk(leadSettings.risk_threshold_high);
    }
  }, [leadSettings]);

  const handleUpdate = async (updates: any) => {
    await updateLeadSettings(updates);
    toast({
      title: t('settings-lead:dashboard.saved'),
      variant: "default"
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings-lead:dashboard.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings-lead:dashboard.autoRefresh')}</Label>
              <CardDescription>{t('settings-lead:dashboard.autoRefreshDesc')}</CardDescription>
              <div className="flex items-center gap-4">
                <Slider
                  value={[autoRefresh]}
                  onValueChange={([value]) => setAutoRefresh(value)}
                  onValueCommit={() => handleUpdate({ auto_refresh_interval: autoRefresh })}
                  min={0}
                  max={120}
                  step={15}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-20">
                  {autoRefresh === 0 ? 'OFF' : `${autoRefresh}s`}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings-lead:dashboard.sections')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t('settings-lead:dashboard.showKpis')}</Label>
            <Switch
              checked={showKpis}
              onCheckedChange={(checked) => {
                setShowKpis(checked);
                handleUpdate({ show_kpis_section: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>{t('settings-lead:dashboard.showReports')}</Label>
            <Switch
              checked={showReports}
              onCheckedChange={(checked) => {
                setShowReports(checked);
                handleUpdate({ show_reports_section: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>{t('settings-lead:dashboard.showQueue')}</Label>
            <Switch
              checked={showQueue}
              onCheckedChange={(checked) => {
                setShowQueue(checked);
                handleUpdate({ show_attention_queue: checked });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings-lead:dashboard.riskThresholds')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mediumRisk">{t('settings-lead:dashboard.mediumRisk')}</Label>
            <Input
              id="mediumRisk"
              type="number"
              min="0"
              max="100"
              value={mediumRisk}
              onChange={(e) => setMediumRisk(parseInt(e.target.value))}
              onBlur={() => handleUpdate({ risk_threshold_medium: mediumRisk })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="highRisk">{t('settings-lead:dashboard.highRisk')}</Label>
            <Input
              id="highRisk"
              type="number"
              min="0"
              max="100"
              value={highRisk}
              onChange={(e) => setHighRisk(parseInt(e.target.value))}
              onBlur={() => handleUpdate({ risk_threshold_high: highRisk })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
