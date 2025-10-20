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
  const [isPreparingInstall, setIsPreparingInstall] = useState(false);
  const [engagementProgress, setEngagementProgress] = useState(0);

  useEffect(() => {
    console.log('🔍 PWA Install Hook initialized');
    
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

    const detectedPlatform = detectPlatform();
    const detectedBrowser = detectBrowser();
    const installed = checkIfInstalled();

    setIsInstalled(installed);
    setIsIOS(checkIfIOS());
    setPlatform(detectedPlatform);
    setBrowser(detectedBrowser);

    // Log current status
    console.log('📊 Current PWA Status:', {
      isInstalled: installed,
      browser: detectedBrowser,
      platform: detectedPlatform,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    });

    // Capturar evento de instalación (solo Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('✅ beforeinstallprompt event fired!', e);
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsPreparingInstall(false); // Dejar de preparar, ya tenemos el prompt
    };

    // Detectar cuando se instala
    const handleAppInstalled = () => {
      console.log('✅ App installed successfully!');
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    // Engagement tracking para simular progreso
    let engagementScore = 0;
    
    const trackEngagement = () => {
      engagementScore = Math.min(engagementScore + 10, 100);
      setEngagementProgress(engagementScore);
      
      if (engagementScore >= 50 && !installPrompt) {
        setIsPreparingInstall(true);
      }
    };

    // Solo mostrar "preparando" en navegadores compatibles
    if (!installed && detectedPlatform.isDesktop && ['Chrome', 'Edge', 'Brave'].includes(detectedBrowser)) {
      setIsPreparingInstall(true);
      console.log('⏳ Iniciando estado de preparación para instalación...');
    }

    // Timeout: si después de 3 segundos no hay prompt, mostrar instrucciones manuales
    const timeout = setTimeout(() => {
      if (!installPrompt && detectedPlatform.isDesktop && ['Chrome', 'Edge', 'Brave'].includes(detectedBrowser)) {
        console.warn('⏰ beforeinstallprompt timeout (3s) - showing manual instructions fallback');
        setIsPreparingInstall(false);
      }
    }, 3000);

    // Debug info después del timeout
    setTimeout(() => {
      console.log('🔧 PWA Install Diagnosis:', {
        hasInstallPrompt: !!installPrompt,
        isPreparingInstall,
        engagementProgress,
        canShowInstallUI: !installed && detectedPlatform.isDesktop,
        browser: detectedBrowser,
        platform: detectedPlatform.name
      });
    }, 3500);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('scroll', trackEngagement, { passive: true });
    window.addEventListener('click', trackEngagement);
    window.addEventListener('mousemove', trackEngagement);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('scroll', trackEngagement);
      window.removeEventListener('click', trackEngagement);
      window.removeEventListener('mousemove', trackEngagement);
      clearTimeout(timeout);
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
    // Mostrar botón en desktop Chrome/Edge/Brave SIEMPRE (aunque no haya prompt)
    canInstall: !isInstalled && (
      !!installPrompt || 
      isIOS || 
      (platform.isDesktop && ['Chrome', 'Edge', 'Brave'].includes(browser))
    ),
    isInstalled,
    isIOS,
    platform,
    browser,
    install,
    hasNativePrompt: !!installPrompt, // Indica si hay prompt nativo disponible
    isPreparingInstall, // Estado de preparación
    engagementProgress // Progreso de engagement 0-100
  };
};
