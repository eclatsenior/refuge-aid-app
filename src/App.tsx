import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Navigation } from "@/components/layout/Navigation";
import { HomePage } from "@/pages/HomePage";
import { TrackingPage } from "@/pages/TrackingPage";
import { NotesPage } from "@/pages/NotesPage";
import { CalmPage } from "@/pages/CalmPage";
import { ResourcesPage } from "@/pages/ResourcesPage";
import { CaminoTerapeuticoPage } from "@/pages/CaminoTerapeuticoPage";
import { CartaBienvenidaPage } from "@/pages/CartaBienvenidaPage";
import { useAppStore } from "@/store/useAppStore";

const queryClient = new QueryClient();

const App = () => {
  const [currentPath, setCurrentPath] = useState("/");
  const { settings } = useAppStore();
  
  // Check if user has seen manifesto
  const manifestoSeen = sessionStorage.getItem('manifesto_seen') === 'true';
  
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };
  
  const renderCurrentPage = () => {
    switch (currentPath) {
      case "/seguimiento":
        return <TrackingPage />;
      case "/notas":
        return <NotesPage onNavigate={handleNavigate} />;
      case "/camino":
        return <CaminoTerapeuticoPage onNavigate={handleNavigate} />;
      case "/calma":
        return <CalmPage />;
      case "/recursos":
        return <ResourcesPage />;
      case "/carta":
        return <CartaBienvenidaPage onNavigate={handleNavigate} isOverlay={false} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {renderCurrentPage()}
          <Navigation 
            currentPath={currentPath}
            onNavigate={handleNavigate}
            isDiscreetMode={settings.isDiscreetMode}
          />
          {/* Welcome letter overlay */}
          {!manifestoSeen && (
            <CartaBienvenidaPage 
              onNavigate={handleNavigate} 
              isOverlay={true}
              onClose={() => sessionStorage.setItem('manifesto_seen', 'true')}
            />
          )}
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
