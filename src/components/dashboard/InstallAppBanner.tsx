import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const InstallAppBanner = () => {
  const { t } = useTranslation('dashboard');
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(
    localStorage.getItem('pwa-banner-dismissed') === 'true'
  );
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { toast } = useToast();

  // No mostrar si está instalada, fue descartada, o no se puede instalar
  if (isInstalled || isDismissed || !canInstall) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
    toast({
      title: t('installBanner.dismissed'),
      description: t('installBanner.dismissedDescription')
    });
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    const success = await install();
    
    if (success) {
      toast({
        title: t('installBanner.installed'),
        description: t('installBanner.installedDescription')
      });
    } else {
      toast({
        title: t('installBanner.couldNotInstall'),
        description: t('installBanner.couldNotInstallDescription'),
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/20 mt-1">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                📱 {t('installBanner.title')}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('installBanner.description')}
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isIOS ? t('installBanner.seeInstructions') : t('installBanner.installNow')}
                </Button>
                
                <Button 
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                >
                  {t('installBanner.later')}
                </Button>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* iOS Instructions */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('installBanner.iosTitle')}</DialogTitle>
            <DialogDescription className="text-left space-y-4 pt-4">
              <p>{t('installBanner.iosDescription')}</p>
              
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>{t('installBanner.iosStep1')} <Share className="inline h-4 w-4" /></li>
                <li>{t('installBanner.iosStep2')}</li>
                <li>{t('installBanner.iosStep3')}</li>
              </ol>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {t('installBanner.iosNote')}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
