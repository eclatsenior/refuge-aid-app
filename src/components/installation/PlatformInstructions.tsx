import { Chrome, Globe, Apple, Smartphone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface PlatformInstructionsProps {
  type: "desktop" | "mobile";
  platform: {
    isWindows: boolean;
    isMac: boolean;
    isLinux: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isDesktop: boolean;
    name: string;
  };
  browser: string;
}

export function PlatformInstructions({ type, platform, browser }: PlatformInstructionsProps) {
  const { t } = useTranslation('install');

  if (type === "desktop") {
    return (
      <div className="space-y-6">
        {/* Chrome/Edge Instructions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Chrome className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Chrome / Edge / Brave</h3>
            {(browser === "Chrome" || browser === "Edge" || browser === "Brave") && (
              <Badge variant="secondary">Tu navegador</Badge>
            )}
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">1.</span>
              <p>{t('instructions.desktop.chrome.step1', 'Haz clic en el icono de instalación (⊕) en la barra de direcciones')}</p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">2.</span>
              <p>{t('instructions.desktop.chrome.step2', 'O ve a Menú (⋮) → "Instalar Refugi..."')}</p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">3.</span>
              <p>{t('instructions.desktop.chrome.step3', 'Confirma la instalación')}</p>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">4.</span>
              <p>{t('instructions.desktop.chrome.step4', 'La app se abrirá automáticamente y aparecerá en tu escritorio')}</p>
            </div>
          </div>
        </div>

        {/* Safari Instructions */}
        {platform.isMac && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Apple className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Safari (macOS)</h3>
              {browser === "Safari" && (
                <Badge variant="secondary">Tu navegador</Badge>
              )}
            </div>
            <Alert>
              <AlertDescription className="text-sm">
                {t('instructions.desktop.safari.note', 'Safari en macOS tiene soporte limitado para PWAs. Recomendamos usar Chrome o Edge para la mejor experiencia.')}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Firefox Instructions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Firefox</h3>
            {browser === "Firefox" && (
              <Badge variant="secondary">Tu navegador</Badge>
            )}
          </div>
          <Alert>
            <AlertDescription className="text-sm">
              {t('instructions.desktop.firefox.note', 'Firefox no soporta instalación de PWAs en escritorio. Recomendamos usar Chrome, Edge o Brave.')}
            </AlertDescription>
          </Alert>
        </div>

        {/* Generic Instructions */}
        {browser === "Desconocido" && (
          <Alert>
            <AlertDescription>
              <p className="font-semibold mb-2">{t('instructions.desktop.generic.title', 'Navegador no detectado')}</p>
              <p className="text-sm">
                {t('instructions.desktop.generic.description', 'Para instalar la app, recomendamos usar Google Chrome, Microsoft Edge o Brave. Descarga uno de estos navegadores y vuelve a esta página.')}
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Mobile Instructions
  return (
    <div className="space-y-6">
      {/* iOS Safari Instructions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Apple className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">iPhone / iPad (Safari)</h3>
          {platform.isIOS && (
            <Badge variant="secondary">Tu dispositivo</Badge>
          )}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="font-semibold text-foreground">1.</span>
            <p>{t('instructions.mobile.ios.step1', 'Abre esta página en Safari (no Chrome)')}</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-foreground">2.</span>
            <p>{t('instructions.mobile.ios.step2', 'Toca el botón de compartir (□↑) en la parte inferior')}</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-foreground">3.</span>
            <p>{t('instructions.mobile.ios.step3', 'Desplázate y selecciona "Añadir a pantalla de inicio"')}</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-foreground">4.</span>
            <p>{t('instructions.mobile.ios.step4', 'Toca "Añadir" en la esquina superior derecha')}</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-foreground">5.</span>
            <p>{t('instructions.mobile.ios.step5', 'La app aparecerá en tu pantalla de inicio')}</p>
          </div>
        </div>
        
        {platform.isIOS && (
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
              💡 {t('instructions.mobile.ios.tip', 'Importante: En iOS, solo Safari permite instalar apps web. Si usas Chrome, copia este enlace y ábrelo en Safari.')}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Android Chrome Instructions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Android (Chrome / Edge)</h3>
          {platform.isAndroid && (
            <Badge variant="secondary">Tu dispositivo</Badge>
          )}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="font-semibold text-foreground">1.</span>
            <p>{t('instructions.mobile.android.step1', 'Toca el botón de instalación que aparece en la parte superior')}</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-foreground">2.</span>
            <p>{t('instructions.mobile.android.step2', 'O ve a Menú (⋮) → "Instalar aplicación"')}</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-foreground">3.</span>
            <p>{t('instructions.mobile.android.step3', 'Confirma la instalación')}</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-foreground">4.</span>
            <p>{t('instructions.mobile.android.step4', 'La app se agregará a tu pantalla de inicio automáticamente')}</p>
          </div>
        </div>
      </div>

      {/* Android Firefox */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Android (Firefox)</h3>
        </div>
        <Alert>
          <AlertDescription className="text-sm">
            {t('instructions.mobile.firefox.note', 'Firefox en Android tiene soporte limitado. Recomendamos usar Chrome o Edge para instalar la app.')}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
