import { useState, useEffect } from "react";
import { Home, Calendar, NotebookPen, Heart, MapPin, Settings, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

const useNavigationItems = (isDiscreetMode?: boolean) => {
  const { t } = useTranslation('common');
  
  const allItems = [
    { icon: Home, label: t('nav.home'), path: "/", hideInDiscreet: true },
    { icon: Calendar, label: t('nav.tracking'), path: "/seguimiento", hideInDiscreet: false },
    { icon: NotebookPen, label: t('nav.notes'), path: "/notas", hideInDiscreet: true },
    { icon: Shield, label: t('nav.path'), path: "/camino", hideInDiscreet: false },
    { icon: MapPin, label: t('nav.resources'), path: "/recursos", hideInDiscreet: false },
  ];
  
  return isDiscreetMode ? allItems.filter(item => !item.hideInDiscreet) : allItems;
};

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isDiscreetMode?: boolean;
}

export function Navigation({ currentPath, onNavigate, isDiscreetMode }: NavigationProps) {
  const navigationItems = useNavigationItems(isDiscreetMode);
  const { i18n } = useTranslation();
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);
  
  // Detectar pantallas muy pequeñas (<360px)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsVerySmallScreen(window.innerWidth < 360);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Ajustar scroll inicial en RTL (árabe)
  useEffect(() => {
    const isRTL = i18n.language === 'ar';
    if (isRTL && isVerySmallScreen) {
      const nav = document.querySelector('nav.navigation-scroll');
      if (nav) {
        nav.scrollLeft = nav.scrollWidth;
      }
    }
  }, [i18n.language, isVerySmallScreen]);
  
  return (
    <nav className="navigation-scroll fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 overflow-x-auto">
      <div className={cn(
        "flex items-center py-2 mx-auto",
        isVerySmallScreen 
          ? "gap-1 px-2 justify-start min-w-max" 
          : "gap-2 px-3 justify-around max-w-md"
      )}>
        {navigationItems.map(({ icon: Icon, label, path }) => {
          const isActive = currentPath === path;
          const displayLabel = isDiscreetMode && label === "Inicio" ? "Notas" : label;
          
          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg transition-colors shrink-0",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isVerySmallScreen ? "px-2" : "px-3",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              aria-label={`Navegar a ${displayLabel}`}
            >
              <Icon size={isVerySmallScreen ? 18 : 20} />
              <span className={cn(
                "font-medium whitespace-nowrap",
                isVerySmallScreen ? "text-[10px]" : "text-xs"
              )}>
                {displayLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}