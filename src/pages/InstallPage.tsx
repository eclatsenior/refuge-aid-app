import { useState } from "react";
import { Shield, Download, Check, Smartphone, Monitor, Chrome, Apple, Globe, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { PlatformInstructions } from "@/components/installation/PlatformInstructions";
import { useTranslation } from "react-i18next";

interface InstallPageProps {
  onNavigate?: (path: string) => void;
}

export function InstallPage({ onNavigate }: InstallPageProps) {
  const { canInstall, isInstalled, install, platform, browser, hasNativePrompt } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const { t } = useTranslation(['install', 'common']);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    if (!hasNativePrompt) {
      // Si no hay prompt nativo, mostrar instrucciones manuales
      console.warn('⚠️ No native install prompt available. Showing manual instructions.');
      setShowManualInstructions(true);
      setIsInstalling(false);
      return;
    }
    
    const success = await install();
    setIsInstalling(false);
    
    if (success && onNavigate) {
      // Redirect to auth after successful install
      setTimeout(() => onNavigate('/auth'), 1500);
    }
  };

  const handleGoToAuth = () => {
    if (onNavigate) {
      onNavigate('/auth');
    } else {
      window.location.href = '/auth';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Refugi</span>
          </div>
          <Button 
            variant="outline" 
            onClick={handleGoToAuth}
            className="gap-2"
          >
            {t('common:buttons.login', 'Iniciar sesión')}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-primary/20 backdrop-blur-sm">
              <Download className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {t('install:title', 'Instala Refugi')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('install:subtitle', 'Tu espacio seguro, siempre contigo. Acceso rápido desde cualquier dispositivo.')}
            </p>
          </div>

          {/* Installation Status */}
          {isInstalled ? (
            <Card className="max-w-md mx-auto bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3 text-green-700 dark:text-green-300">
                  <Check className="h-6 w-6" />
                  <p className="font-semibold">{t('install:alreadyInstalled', '¡App ya instalada!')}</p>
                </div>
                <Button 
                  onClick={handleGoToAuth}
                  className="w-full mt-4"
                >
                  {t('install:openApp', 'Abrir aplicación')}
                </Button>
              </CardContent>
            </Card>
          ) : canInstall && !platform.isIOS ? (
            <div className="flex flex-col items-center gap-4">
              <Button 
                size="lg"
                onClick={handleInstall}
                disabled={isInstalling}
                className="gap-2 text-lg px-8 py-6"
              >
                <Download className="h-5 w-5" />
                {isInstalling ? t('install:installing', 'Instalando...') : t('install:installNow', 'Instalar ahora')}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t('install:detected', 'Detectamos:')} <Badge variant="secondary">{browser} en {platform.name}</Badge>
              </p>
            </div>
          ) : null}
        </div>

        {/* Benefits Section */}
        <Card className="mb-12 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              {t('install:benefits.title', 'Beneficios de instalar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('install:benefits.quickAccess', 'Acceso rápido')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('install:benefits.quickAccessDesc', 'Abre desde tu escritorio o pantalla de inicio')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('install:benefits.offline', 'Funciona offline')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('install:benefits.offlineDesc', 'Accede a tu información sin conexión a internet')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('install:benefits.notifications', 'Notificaciones instantáneas')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('install:benefits.notificationsDesc', 'Recibe alertas importantes en tiempo real')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('install:benefits.updates', 'Actualizaciones automáticas')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('install:benefits.updatesDesc', 'Siempre tendrás la versión más reciente')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Tabs */}
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t('install:instructions.title', 'Instrucciones de instalación')}</CardTitle>
            <CardDescription>
              {t('install:instructions.subtitle', 'Selecciona tu dispositivo para ver instrucciones específicas')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={platform.isDesktop ? "desktop" : "mobile"} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="desktop" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  {t('install:tabs.desktop', 'Ordenador')}
                </TabsTrigger>
                <TabsTrigger value="mobile" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  {t('install:tabs.mobile', 'Móvil')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="desktop" className="space-y-4">
                <PlatformInstructions 
                  type="desktop"
                  platform={platform}
                  browser={browser}
                />
              </TabsContent>

              <TabsContent value="mobile" className="space-y-4">
                <PlatformInstructions 
                  type="mobile"
                  platform={platform}
                  browser={browser}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="mt-8 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              {t('install:share.title', 'Comparte con tu equipo')}
            </CardTitle>
            <CardDescription>
              {t('install:share.subtitle', 'Envía este enlace a tus empleadas para que instalen la app')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={window.location.href}
                className="flex-1 px-3 py-2 rounded-md bg-muted border border-border text-sm"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
              >
                {t('common:buttons.copy', 'Copiar')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-lg text-muted-foreground">
            {t('install:cta.ready', '¿Lista para empezar?')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGoToAuth}>
              {t('install:cta.register', 'Registrarme ahora')}
            </Button>
            <Button size="lg" variant="outline" onClick={handleGoToAuth}>
              {t('install:cta.login', 'Ya tengo cuenta')}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog con instrucciones manuales */}
      <Dialog open={showManualInstructions} onOpenChange={setShowManualInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('install:instructions.manual.title')}</DialogTitle>
            <DialogDescription>
              {browser === 'Chrome' && platform.isDesktop && (
                <div className="space-y-3 pt-4">
                  <p className="text-foreground">{t('install:instructions.manual.chrome.intro')}</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.chrome.step1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.chrome.step2') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.chrome.step3') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.chrome.step4') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.chrome.step5') }} />
                  </ol>
                </div>
              )}
              
              {browser === 'Edge' && platform.isDesktop && (
                <div className="space-y-3 pt-4">
                  <p className="text-foreground">{t('install:instructions.manual.edge.intro')}</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.edge.step1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.edge.step2') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.edge.step3') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.edge.step4') }} />
                  </ol>
                </div>
              )}

              {browser === 'Brave' && platform.isDesktop && (
                <div className="space-y-3 pt-4">
                  <p className="text-foreground">{t('install:instructions.manual.brave.intro')}</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.brave.step1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.brave.step2') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.brave.step3') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('install:instructions.manual.brave.step4') }} />
                  </ol>
                </div>
              )}
              
              <div className="bg-muted p-3 rounded-lg mt-4">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>{t('install:instructions.manual.note.title')}</strong> {t('install:instructions.manual.note.text')}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
