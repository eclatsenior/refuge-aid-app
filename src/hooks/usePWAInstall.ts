import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PlatformInfo {
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  name: string;
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [platform, setPlatform] = useState<PlatformInfo>({
    isWindows: false,
    isMac: false,
    isLinux: false,
    isIOS: false,
    isAndroid: false,
    isDesktop: false,
    name: 'Desconocido'
  });
  const [browser, setBrowser] = useState('Desconocido');

  useEffect(() => {
    // Detectar si ya está instalado
    const checkIfInstalled = () => {
      // PWA instalada
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      
      // iOS Safari standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      
      return false;
    };

    // Detectar plataforma detallada
    const detectPlatform = (): PlatformInfo => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const platform = window.navigator.platform.toLowerCase();
      
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isWindows = /win/.test(platform);
      const isMac = /mac/.test(platform) && !isIOS;
      const isLinux = /linux/.test(platform) && !isAndroid;
      const isDesktop = !isIOS && !isAndroid;
      
      let name = 'Desconocido';
      if (isIOS) name = 'iOS';
      else if (isAndroid) name = 'Android';
      else if (isWindows) name = 'Windows';
      else if (isMac) name = 'macOS';
      else if (isLinux) name = 'Linux';
      
      return {
        isWindows,
        isMac,
        isLinux,
        isIOS,
        isAndroid,
        isDesktop,
        name
      };
    };

    // Detectar navegador
    const detectBrowser = (): string => {
      const userAgent = window.navigator.userAgent;
      
      if (userAgent.indexOf("Edg") > -1) return "Edge";
      if (userAgent.indexOf("Chrome") > -1) return "Chrome";
      if (userAgent.indexOf("Safari") > -1) return "Safari";
      if (userAgent.indexOf("Firefox") > -1) return "Firefox";
      if (userAgent.indexOf("Brave") > -1) return "Brave";
      
      return "Desconocido";
    };

    // Detectar iOS
    const checkIfIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    setIsInstalled(checkIfInstalled());
    setIsIOS(checkIfIOS());
    setPlatform(detectPlatform());
    setBrowser(detectBrowser());

    // Capturar evento de instalación (solo Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Detectar cuando se instala
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      return false;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setInstallPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  return {
    canInstall: !isInstalled && (!!installPrompt || isIOS),
    isInstalled,
    isIOS,
    platform,
    browser,
    install
  };
};
