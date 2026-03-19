import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, FileDown, LogOut, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SuperAdminOverview } from '@/components/super-admin/SuperAdminOverview';
import { SuperAdminUsersTab } from '@/components/super-admin/SuperAdminUsersTab';
import { SuperAdminSubscriptionsTab } from '@/components/super-admin/SuperAdminSubscriptionsTab';
import { SuperAdminAlertsTab } from '@/components/super-admin/SuperAdminAlertsTab';
import { SuperAdminMetricsTab } from '@/components/super-admin/SuperAdminMetricsTab';
import { SuperAdminSettingsTab } from '@/components/super-admin/SuperAdminSettingsTab';
import { SuperAdminVaultResetTab } from '@/components/super-admin/SuperAdminVaultResetTab';
import { SuperAdminVideosTab } from '@/components/super-admin/SuperAdminVideosTab';
import { SuperAdminTherapyTab } from '@/components/super-admin/SuperAdminTherapyTab';
import { AdminSoporteCompaniesTab } from '@/components/admin-soporte/AdminSoporteCompaniesTab';
import { AdminSoporteSupportTab } from '@/components/admin-soporte/AdminSoporteSupportTab';
import { CreateUserDialog } from '@/components/admin-soporte/CreateUserDialog';
import { useSuperAdminReportGeneration } from '@/hooks/useSuperAdminReportGeneration';

export default function AdminSoportePage() {
  const user = useAppStore((state) => state.user);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { generatePDF, isGenerating } = useSuperAdminReportGeneration();

  useEffect(() => {
    checkSuperAdminStatus();
  }, [user?.id]);

  const checkSuperAdminStatus = async () => {
    if (!user?.id) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_super_admin', { check_user_id: user.id });
      if (error) throw error;
      setIsSuperAdmin(data === true);
    } catch (error) {
      console.error('Error checking super admin status:', error);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos para acceder a este panel.</p>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Panel de Administración</h1>
              <p className="text-muted-foreground text-sm">Soporte y gestión integral de la plataforma</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generatePDF} disabled={isGenerating} variant="outline" className="gap-2">
              {isGenerating ? (
                <LoadingSpinner size="sm" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isGenerating ? 'Generando...' : 'Reporte PDF'}
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="icon" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full md:min-w-0">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="users">Usuarios</TabsTrigger>
              <TabsTrigger value="companies">Empresas</TabsTrigger>
              <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
              <TabsTrigger value="vault">Caja Fuerte</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="therapy">Terapia</TabsTrigger>
              <TabsTrigger value="support">Soporte</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
              <TabsTrigger value="settings">Config</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <SuperAdminOverview />
          </TabsContent>

          <TabsContent value="users">
            <SuperAdminUsersTab />
          </TabsContent>

          <TabsContent value="companies">
            <AdminSoporteCompaniesTab />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SuperAdminSubscriptionsTab />
          </TabsContent>

          <TabsContent value="alerts">
            <SuperAdminAlertsTab />
          </TabsContent>

          <TabsContent value="vault">
            <SuperAdminVaultResetTab />
          </TabsContent>

          <TabsContent value="videos">
            <SuperAdminVideosTab />
          </TabsContent>

          <TabsContent value="therapy">
            <SuperAdminTherapyTab />
          </TabsContent>

          <TabsContent value="support">
            <AdminSoporteSupportTab />
          </TabsContent>

          <TabsContent value="metrics">
            <SuperAdminMetricsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SuperAdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
