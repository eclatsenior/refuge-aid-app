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
import { InstallPage } from "@/pages/InstallPage";
import { StripeTestPage } from "@/pages/StripeTestPage";
import { PaymentSuccessPage } from "@/pages/PaymentSuccessPage";
import { PaymentCanceledPage } from "@/pages/PaymentCanceledPage";
import { SubscriptionSuccessPage } from "@/pages/SubscriptionSuccessPage";
import { SubscriptionCanceledPage } from "@/pages/SubscriptionCanceledPage";
import ProfilePage from "@/pages/ProfilePage";
import PaywallPage from "@/pages/PaywallPage";
import SettingsPage from "@/pages/SettingsPage";
import SettingsLeadPage from "@/pages/SettingsLeadPage";
import AdminAssignSubscription from "@/pages/AdminAssignSubscription";
import { EmailVerifiedPage } from "@/pages/EmailVerifiedPage";
import { AdminUploadVideosPage } from "@/pages/AdminUploadVideosPage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAppStore } from "@/store/useAppStore";
import { PWAUpdater } from "@/components/pwa/PWAUpdater";
import "@/i18n/config";

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
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
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
  
  // Add timeout for profile loading
  useEffect(() => {
    if (user && !profile && !loadingTimeout) {
      console.log('⏱️ Starting profile loading timeout...');
      const timer = setTimeout(() => {
        console.warn('⚠️ Profile loading timeout - proceeding anyway');
        setLoadingTimeout(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [user, profile, loadingTimeout]);
  
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
        return <TrackingPage onNavigate={handleNavigate} />;
      case "/notas":
        return <NotesPage onNavigate={handleNavigate} />;
      case "/camino":
        return <CaminoTerapeuticoPage onNavigate={handleNavigate} />;
      case "/calma":
        return <CalmPage />;
      case "/recursos":
        return <ResourcesPage onNavigate={handleNavigate} />;
      case "/carta":
        return <CartaBienvenidaPage onNavigate={handleNavigate} isOverlay={false} />;
      case "/ajustes":
        return <SettingsPage onNavigate={handleNavigate} />;
      case "/perfil":
        return <ProfilePage />;
      case "/dashboard/settings":
        return <SettingsLeadPage />;
      case "/admin/assign-subscription":
        return <AdminAssignSubscription />;
      case "/instalar":
        return <InstallPage onNavigate={handleNavigate} />;
      case "/stripe-test-secret":
        return <StripeTestPage />;
      case "/payment-success":
        return <PaymentSuccessPage />;
      case "/payment-canceled":
        return <PaymentCanceledPage />;
      case "/subscription-success":
        return <SubscriptionSuccessPage />;
      case "/subscription-canceled":
        return <SubscriptionCanceledPage />;
      case "/paywall":
        return <PaywallPage />;
      case "/email-verified":
        return <EmailVerifiedPage />;
      case "/admin/upload-videos":
        return <AdminUploadVideosPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const renderApp = () => {
    // FIRST: Handle administrative routes (no authentication or validation needed)
    const adminRoutes = ["/admin/upload-videos", "/admin/assign-subscription"];
    if (adminRoutes.includes(currentPath)) {
      return renderCurrentPage();
    }
    
    // Show loading during initialization
    if (isInitializing) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }
    
    // If user exists but profile is still loading and hasn't timed out
    if (user && !profile && !loadingTimeout) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">Cargando perfil...</p>
          </div>
        </div>
      );
    }
    
    // If profile loading timed out, show error with retry
    if (user && !profile && loadingTimeout) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/10">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Error cargando perfil
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                No se pudo cargar tu perfil. Por favor, intenta nuevamente.
              </p>
              <button
                onClick={() => {
                  setLoadingTimeout(false);
                  initializeAuth();
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Special routes that don't require authentication
    const publicRoutes = ["/instalar", "/stripe-test-secret", "/payment-success", "/payment-canceled", "/subscription-success", "/subscription-canceled", "/email-verified"];
    if (publicRoutes.includes(currentPath)) {
      return renderCurrentPage();
    }
    
    // If not authenticated, show AuthPage
    if (!isAuthenticated || !user) {
      return <AuthPage />;
    }
    
    
    // If Refugi Lead, handle dashboard routes
    if (userRole === 'refugi_lead') {
      if (currentPath === '/dashboard/settings') {
        return <SettingsLeadPage onNavigate={handleNavigate} />;
      }
      // Default to dashboard for any other route
      if (currentPath !== '/dashboard') {
        handleNavigate('/dashboard');
      }
      return <DashboardPage onNavigate={handleNavigate} />;
    }
    
  // If employee, show main app with navigation
    if (userRole === 'employee') {
      // Check if should show paywall
      const { shouldShowPaywall } = useAppStore.getState();
      
      if (shouldShowPaywall()) {
        // Allowed routes without subscription
        const allowedRoutes = [
          '/paywall',
          '/subscription-success',
          '/subscription-canceled',
          '/auth',
          '/admin/upload-videos'
        ];
        
        if (!allowedRoutes.some(route => currentPath.startsWith(route))) {
          console.log('🚫 Paywall: Redirecting to paywall page');
          return <PaywallPage />;
        }
      }
      
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
        <PWAUpdater />
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
