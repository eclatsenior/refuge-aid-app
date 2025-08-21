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
import { useAppStore } from "@/store/useAppStore";

const queryClient = new QueryClient();

const App = () => {
  const [currentPath, setCurrentPath] = useState("/");
  const { settings } = useAppStore();
  
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };
  
  const renderCurrentPage = () => {
    switch (currentPath) {
      case "/seguimiento":
        return <TrackingPage />;
      case "/notas":
        return <NotesPage onNavigate={handleNavigate} />;
      case "/calma":
        return <CalmPage />;
      case "/recursos":
        return <ResourcesPage />;
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
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
