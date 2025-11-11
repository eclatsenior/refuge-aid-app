import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Copy, CheckCircle, Share, ExternalLink } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const InstallationSettingsSection = () => {
  const { t } = useTranslation();
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const appUrl = window.location.origin;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast({
        title: t('settings-lead:installation.linkCopied'),
        description: t('settings-lead:installation.linkCopiedDescription')
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t('settings-lead:installation.errorCopying'),
        description: t('settings-lead:installation.errorCopyingDescription'),
        variant: "destructive"
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Refugio - Cuidado Emocional',
          text: 'Descarga la app de Refugio para cuidado emocional',
          url: appUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyLink();
    }
  };

  const handleInstall = async () => {
    const success = await install();
    
    if (success) {
      toast({
        title: t('settings-lead:installation.installSuccess'),
        description: t('settings-lead:installation.installDescription')
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado de Instalación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t('settings-lead:installation.title')}
              </CardTitle>
              <CardDescription>
                {t('settings-lead:installation.subtitle')}
              </CardDescription>
            </div>
            
            {isInstalled && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {t('settings-lead:installation.installed')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">{t('settings-lead:installation.installSuccess')}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings-lead:installation.installDescription')}
              </p>
            </div>
          ) : canInstall ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('settings-lead:installation.installBenefits')}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• {t('settings-lead:installation.benefit1')}</li>
                <li>• {t('settings-lead:installation.benefit2')}</li>
                <li>• {t('settings-lead:installation.benefit3')}</li>
                <li>• {t('settings-lead:installation.benefit4')}</li>
              </ul>
              
              {isIOS ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      {t('settings-lead:installation.viewInstructions')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('settings-lead:installation.iosInstructions')}</DialogTitle>
                      <DialogDescription className="text-left space-y-4 pt-4">
                        <p>{t('settings-lead:installation.iosInstructions')}:</p>
                        
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>{t('settings-lead:installation.iosStep1')} <Share className="inline h-4 w-4" /></li>
                          <li>{t('settings-lead:installation.iosStep2')}</li>
                          <li>{t('settings-lead:installation.iosStep3')}</li>
                        </ol>

                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            💡 <strong>{t('common:note')}:</strong> {t('settings-lead:installation.iosNote')}
                          </p>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button onClick={handleInstall} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  {t('settings-lead:installation.installApp')}
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                {t('settings-lead:installation.notAvailable')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compartir App */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            {t('settings-lead:installation.shareTitle')}
          </CardTitle>
          <CardDescription>
            {t('settings-lead:installation.shareDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <code className="text-sm flex-1 truncate">{appUrl}</code>
            <Button
              size="icon"
              variant="ghost"
              onClick={copyLink}
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyLink} variant="outline" className="flex-1 gap-2">
              <Copy className="h-4 w-4" />
              {t('settings-lead:installation.copyLink')}
            </Button>
            
            {navigator.share && (
              <Button onClick={shareLink} variant="outline" className="flex-1 gap-2">
                <Share className="h-4 w-4" />
                {t('settings-lead:installation.share')}
              </Button>
            )}
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> {t('settings-lead:installation.tip')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recursos Adicionales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            {t('settings-lead:installation.resources')}
          </CardTitle>
          <CardDescription>
            {t('settings-lead:installation.resourcesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              <span>{t('settings-lead:installation.resource1')}</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              <span>{t('settings-lead:installation.resource2')}</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              <span>{t('settings-lead:installation.resource3')}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
