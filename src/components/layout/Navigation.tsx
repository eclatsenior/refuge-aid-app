import { useState } from "react";
import { Home, Calendar, NotebookPen, Heart, MapPin, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { icon: Home, label: "Inicio", path: "/" },
  { icon: Calendar, label: "Seguimiento", path: "/seguimiento" },
  { icon: NotebookPen, label: "Notas", path: "/notas" },
  { icon: Heart, label: "Calma", path: "/calma" },
  { icon: MapPin, label: "Recursos", path: "/recursos" },
];

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isDiscreetMode?: boolean;
}

export function Navigation({ currentPath, onNavigate, isDiscreetMode }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {navigationItems.map(({ icon: Icon, label, path }) => {
          const isActive = currentPath === path;
          const displayLabel = isDiscreetMode && label === "Inicio" ? "Notas" : label;
          
          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              aria-label={`Navegar a ${displayLabel}`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{displayLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}