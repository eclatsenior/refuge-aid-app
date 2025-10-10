import { useState, useEffect } from "react";
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
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { StripeTestPage } from "@/pages/StripeTestPage";
import { PaymentSuccessPage } from "@/pages/PaymentSuccessPage";
import { PaymentCanceledPage } from "@/pages/PaymentCanceledPage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAppStore } from "@/store/useAppStore";

const queryClient = new QueryClient();

const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { 
    isAuthenticated, 
    user, 
    userRole, 
    profile,
    settings, 
    initializeAuth 
  } = useAppStore();
  
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Listen to URL changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // Initialize authentication on app load
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        console.log('🔄 Starting app initialization...');
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 10000)
        );
        
        await Promise.race([
          initializeAuth(),
          timeoutPromise
        ]);
        
        if (isMounted) {
          console.log('✅ App initialization complete');
          setIsInitializing(false);
        }
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        if (isMounted) {
          // Even on error, stop loading to prevent infinite spinner
          setIsInitializing(false);
        }
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
    };
  }, [initializeAuth]);
  
  // Check if user has seen manifesto (only for employees)
  const [manifestoSeen, setManifestoSeen] = useState(
    sessionStorage.getItem('manifesto_seen') === 'true'
  );
  
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
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
      case "/stripe-test-secret":
        return <StripeTestPage />;
      case "/payment-success":
        return <PaymentSuccessPage />;
      case "/payment-canceled":
        return <PaymentCanceledPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const renderApp = () => {
    // Show loading during initialization
    if (isInitializing) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }
    
    // Special routes that don't require authentication
    const publicRoutes = ["/stripe-test-secret", "/payment-success", "/payment-canceled"];
    if (publicRoutes.includes(currentPath)) {
      return renderCurrentPage();
    }
    
    // If not authenticated, show AuthPage
    if (!isAuthenticated || !user) {
      return <AuthPage />;
    }
    
    // If Refugi Lead, show DashboardPage
    if (userRole === 'refugi_lead') {
      return <DashboardPage />;
    }
    
    // If employee, show main app with navigation
    if (userRole === 'employee') {
      return (
        <>
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
              onClose={() => {
                sessionStorage.setItem('manifesto_seen', 'true');
                setManifestoSeen(true);
              }}
            />
          )}
        </>
      );
    }
    
    // Fallback to AuthPage
    return <AuthPage />;
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {renderApp()}
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
