import { useEffect, useState } from "react";
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  Shield,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  Volume2,
  VolumeX,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { EmployeeCard } from "@/components/dashboard/EmployeeCard";
import { EmergencyAlert } from "@/components/dashboard/EmergencyAlert";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { RegisterEmployeeDialog } from "@/components/dashboard/RegisterEmployeeDialog";
import { useToast } from "@/hooks/use-toast";
import { KPIsSection } from "@/components/dashboard/KPIsSection";
import { AttentionQueue } from "@/components/dashboard/AttentionQueue";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { SubscriptionPlans } from "@/components/dashboard/SubscriptionPlans";
import { SubscriptionStatus } from "@/components/dashboard/SubscriptionStatus";
import { ReportingSection } from "@/components/dashboard/ReportingSection";
import { AlertPermissionDialog } from "@/components/dashboard/AlertPermissionDialog";
import { audioManager, requestNotificationPermission } from "@/lib/audioManager";

export function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'alert' | 'offline'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(audioManager.isAudioEnabled());
  
  const { 
    profile, 
    assignedEmployees, 
    emergencyAlerts, 
    subscription,
    leadSettings,
    loadEmployeeData, 
    loadEmergencyAlerts,
    loadSubscriptionStatus,
    loadLeadSettings,
    canAddEmployee,
    setupRealtimeSubscriptions,
    logout 
  } = useAppStore();
  
  const { toast } = useToast();
  const { isEnabled } = useFeatureFlags();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadEmployeeData(),
          loadEmergencyAlerts()
        ]);
        
        toast({
          title: "Dashboard actualizado",
          description: "Datos cargados correctamente",
        });
      } catch (error) {
        toast({
          title: "Error al cargar datos",
          description: "Hubo un problema al cargar la información del dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Setup realtime subscriptions
    const unsubscribe = setupRealtimeSubscriptions();
    
    // CRITICAL: Listen for forced dashboard refresh events
    const handleForceRefresh = () => {
      console.log('🔄 Force refresh triggered - loading emergency alerts immediately');
      loadEmergencyAlerts();
      loadEmployeeData();
    };
    
    window.addEventListener('force-dashboard-refresh', handleForceRefresh);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('force-dashboard-refresh', handleForceRefresh);
    };
  }, [loadEmployeeData, loadEmergencyAlerts, setupRealtimeSubscriptions]);

  // Request audio and notification permissions on first load
  useEffect(() => {
    const checkPermissions = async () => {
      const audioEnabled = localStorage.getItem('audio-alerts-enabled');
      const permissionAsked = localStorage.getItem('alert-permission-asked');
      
      if (!audioEnabled && !permissionAsked) {
        // Wait 1 second before showing dialog to avoid overwhelming user
        setTimeout(() => {
          setShowPermissionDialog(true);
        }, 1000);
      }
    };

    checkPermissions();
  }, []);

  const handleAcceptPermissions = async () => {
    try {
      // Initialize audio
      const audioSuccess = await audioManager.initialize();
      
      // Request notification permission
      const notificationSuccess = await requestNotificationPermission();
      
      localStorage.setItem('alert-permission-asked', 'true');
      setAudioEnabled(audioSuccess);
      setShowPermissionDialog(false);
      
      toast({
        title: "✅ Alertas habilitadas",
        description: audioSuccess 
          ? "Recibirás alertas sonoras y notificaciones" 
          : "Recibirás notificaciones (audio no disponible)",
      });
    } catch (error) {
      console.error('Error enabling permissions:', error);
      toast({
        title: "Error",
        description: "No se pudieron habilitar las alertas",
        variant: "destructive"
      });
    }
  };

  const handleDeclinePermissions = () => {
    localStorage.setItem('alert-permission-asked', 'true');
    setShowPermissionDialog(false);
    
    toast({
      title: "Alertas deshabilitadas",
      description: "Puedes habilitarlas más tarde desde la configuración",
    });
  };

  const toggleAudio = async () => {
    if (audioEnabled) {
      audioManager.disable();
      setAudioEnabled(false);
      toast({
        title: "Audio deshabilitado",
        description: "Las alertas sonoras están desactivadas"
      });
    } else {
      const success = await audioManager.initialize();
      setAudioEnabled(success);
      if (success) {
        toast({
          title: "Audio habilitado",
          description: "Las alertas sonoras están activadas"
        });
      }
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente"
    });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadEmployeeData(),
        loadEmergencyAlerts(),
        loadLeadSettings()
      ]);
      toast({
        title: "Datos actualizados",
        description: "La información se ha actualizado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la información",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = assignedEmployees.filter(employee => {
    const matchesSearch = employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = (() => {
      switch (filterStatus) {
        case 'online':
          return employee.is_online;
        case 'alert':
          return employee.emergency_alert;
        case 'offline':
          return !employee.is_online;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesFilter;
  });

  const activeAlerts = emergencyAlerts.filter(alert => !alert.is_resolved);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Dashboard Refugi Lead</h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenido, {profile?.full_name || 'Refugi Lead'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleAudio}
                title={audioEnabled ? "Deshabilitar alertas sonoras" : "Habilitar alertas sonoras"}
              >
                {audioEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/dashboard/settings'}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Subscription Section */}
        <div className="space-y-4">
          <SubscriptionStatus
            subscription={subscription || { subscribed: false, product_id: null, subscription_end: null, employee_limit: 0 }}
            currentEmployeeCount={assignedEmployees.length}
            onRefresh={loadSubscriptionStatus}
            onViewPlans={() => setShowPlans(!showPlans)}
          />
          
          {showPlans && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-center mb-6">Planes Disponibles</h2>
              <SubscriptionPlans 
                currentProductId={subscription?.product_id}
                onCheckoutStart={() => setShowPlans(false)}
              />
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <StatsOverview 
          employees={assignedEmployees}
          alerts={emergencyAlerts}
        />

        {/* KPIs Section - Feature Flag */}
        {isEnabled('ff_refugi_kpis') && (
          <KPIsSection />
        )}

        {/* Attention Queue - Feature Flag */}
        {isEnabled('ff_refugi_queue') && (
          <AttentionQueue items={[]} />
        )}

        {/* Emergency Alerts */}
        {activeAlerts.length > 0 && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Emergencia ({activeAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.map(alert => (
                  <EmergencyAlert key={alert.id} alert={alert} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reporting Section */}
        <ReportingSection 
          employees={assignedEmployees} 
          alerts={emergencyAlerts} 
        />

        {/* Employees Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Empleadas Asignadas ({filteredEmployees.length})
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {assignedEmployees.filter(e => e.is_online).length} conectadas
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {assignedEmployees.filter(e => e.emergency_alert).length} alertas
                  </Badge>
                </div>
              </div>

              <RegisterEmployeeDialog 
                onEmployeeRegistered={handleRefresh}
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleadas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                {(['all', 'online', 'alert', 'offline'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className="capitalize"
                  >
                    {status === 'all' ? 'Todas' : 
                     status === 'online' ? 'En línea' :
                     status === 'alert' ? 'Alertas' : 'Desconectadas'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Employees Grid */}
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No hay empleadas
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No se encontraron empleadas que coincidan con los filtros aplicados.'
                    : 'No tienes empleadas asignadas en este momento.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map(employee => (
                  <EmployeeCard 
                    key={employee.id} 
                    employee={employee} 
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permission Dialog */}
      <AlertPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onAccept={handleAcceptPermissions}
        onDecline={handleDeclinePermissions}
      />
    </div>
  );
}