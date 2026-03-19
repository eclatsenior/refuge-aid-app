import { useState, useEffect } from 'react';
import { Building2, Users, CreditCard, Eye, Search, ChevronLeft, ChevronRight, Mail, UserPlus, Power, PowerOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CreateUserDialog } from './CreateUserDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Company {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  company_website: string | null;
  company_role: string | null;
  created_at: string;
  employee_count: number;
  subscription: {
    status: string;
    employee_limit: number;
    current_period_end: string | null;
    product_id: string;
    stripe_subscription_id: string | null;
  } | null;
}

interface CompanyDetails {
  company: Company;
  employees: Array<{
    user_id: string;
    full_name: string;
    email: string;
    phone: string | null;
    created_at: string;
    last_mood: number | null;
    last_check_in: string | null;
  }>;
  recentAlerts: Array<{
    id: string;
    alert_type: string;
    is_resolved: boolean;
    created_at: string;
    employee_name: string;
  }>;
  totalSessions30d: number;
}

export function AdminSoporteCompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_companies' }
      });
      if (error) throw error;
      setCompanies(data.companies || []);
    } catch (err: any) {
      console.error('Error loading companies:', err);
      toast.error('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (userId: string) => {
    setLoadingDetails(true);
    setDetailsOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_company_details', userId }
      });
      if (error) throw error;
      setSelectedCompany(data);
    } catch (err: any) {
      console.error('Error loading company details:', err);
      toast.error('Error al cargar detalles de la empresa');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleStatus = async (userId: string, disable: boolean) => {
    setTogglingUser(userId);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'toggle_user_status', userId, disabled: disable }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(disable ? 'Empresa dada de baja' : 'Empresa dada de alta');
      loadCompanies();
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado');
    } finally {
      setTogglingUser(null);
    }
  };

  const filteredCompanies = companies.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      (c.company_name || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Gestión de Empresas (Refugi Leads)
          </h2>
          <p className="text-sm text-muted-foreground">{companies.length} empresas registradas</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadCompanies}>
          Actualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{companies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Con Suscripción Activa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {companies.filter(c => c.subscription?.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Empleados Asignados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {companies.reduce((sum, c) => sum + c.employee_count, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sin Suscripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {companies.filter(c => !c.subscription || c.subscription.status !== 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Empleados</TableHead>
                    <TableHead>Suscripción</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{company.full_name}</p>
                          <p className="text-sm text-muted-foreground">{company.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{company.company_name || 'Sin nombre'}</p>
                          {company.company_website && (
                            <a
                              href={company.company_website.startsWith('http') ? company.company_website : `https://${company.company_website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              {company.company_website}
                            </a>
                          )}
                          {company.company_role && (
                            <p className="text-xs text-muted-foreground">{company.company_role}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{company.employee_count}</span>
                          {company.subscription && (
                            <span className="text-muted-foreground text-xs">
                              / {company.subscription.employee_limit}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.subscription ? (
                          <div className="space-y-1">
                            <Badge variant={company.subscription.status === 'active' ? 'default' : 'destructive'}>
                              {company.subscription.status}
                            </Badge>
                            {company.subscription.stripe_subscription_id ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Stripe
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                Manual
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary">Sin suscripción</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(company.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(company.user_id)}
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCompanies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron empresas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Detalles de la Empresa
            </DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : selectedCompany ? (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Información del Responsable</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Nombre:</span> {selectedCompany.company.full_name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedCompany.company.email}</p>
                    <p><span className="text-muted-foreground">Teléfono:</span> {selectedCompany.company.phone || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Datos de la Empresa</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Empresa:</span> {selectedCompany.company.company_name || '-'}</p>
                    <p><span className="text-muted-foreground">Web:</span> {selectedCompany.company.company_website || '-'}</p>
                    <p><span className="text-muted-foreground">Cargo:</span> {selectedCompany.company.company_role || '-'}</p>
                    <p><span className="text-muted-foreground">Sesiones (30d):</span> {selectedCompany.totalSessions30d}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Subscription */}
              {selectedCompany.company.subscription && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Suscripción
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Estado:</span>{' '}
                      <Badge variant={selectedCompany.company.subscription.status === 'active' ? 'default' : 'destructive'}>
                        {selectedCompany.company.subscription.status}
                      </Badge>
                    </p>
                    <p><span className="text-muted-foreground">Límite empleados:</span> {selectedCompany.company.subscription.employee_limit}</p>
                    <p><span className="text-muted-foreground">Vence:</span> {selectedCompany.company.subscription.current_period_end ? format(new Date(selectedCompany.company.subscription.current_period_end), 'dd/MM/yyyy HH:mm') : '-'}</p>
                  </CardContent>
                </Card>
              )}

              {/* Employees */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Empleados Asignados ({selectedCompany.employees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCompany.employees.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Último Ánimo</TableHead>
                            <TableHead>Último Check-in</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCompany.employees.map((emp) => (
                            <TableRow key={emp.user_id}>
                              <TableCell className="font-medium">{emp.full_name}</TableCell>
                              <TableCell className="text-sm">{emp.email}</TableCell>
                              <TableCell>
                                {emp.last_mood !== null ? (
                                  <Badge variant={emp.last_mood >= 4 ? 'default' : emp.last_mood >= 3 ? 'secondary' : 'destructive'}>
                                    {emp.last_mood}/5
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {emp.last_check_in ? format(new Date(emp.last_check_in), 'dd/MM/yyyy HH:mm') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">Sin empleados asignados</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              {selectedCompany.recentAlerts.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Alertas Recientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCompany.recentAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between text-sm p-2 rounded border">
                          <div>
                            <span className="font-medium">{alert.employee_name}</span>
                            <span className="text-muted-foreground ml-2">{alert.alert_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={alert.is_resolved ? 'secondary' : 'destructive'}>
                              {alert.is_resolved ? 'Resuelta' : 'Pendiente'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(alert.created_at), 'dd/MM HH:mm')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
