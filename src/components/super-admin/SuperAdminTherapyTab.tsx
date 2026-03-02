import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, GripVertical, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface TherapyRoute {
  id: string;
  route_key: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

interface TherapyModule {
  id: string;
  route_id: string;
  module_key: string;
  title: string;
  description: string;
  content: string;
  duration: number;
  type: string;
  sort_order: number;
  is_active: boolean;
}

const ICON_OPTIONS = [
  { value: 'heart', label: '❤️ Corazón' },
  { value: 'wind', label: '🌬️ Viento' },
  { value: 'shield', label: '🛡️ Escudo' },
  { value: 'flower', label: '🌸 Flor' },
  { value: 'book', label: '📖 Libro' },
  { value: 'clock', label: '⏰ Reloj' },
];

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Azul' },
  { value: 'coral', label: 'Coral' },
  { value: 'green', label: 'Verde' },
  { value: 'purple', label: 'Morado' },
  { value: 'gray-gradient', label: 'Gris' },
];

const MODULE_TYPES = [
  { value: 'breathing', label: 'Respiración' },
  { value: 'grounding', label: 'Grounding' },
  { value: 'education', label: 'Educación' },
  { value: 'tool', label: 'Herramienta' },
  { value: 'reflection', label: 'Reflexión' },
];

export function SuperAdminTherapyTab() {
  const [routes, setRoutes] = useState<TherapyRoute[]>([]);
  const [modules, setModules] = useState<TherapyModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  
  // Route dialog
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TherapyRoute | null>(null);
  const [routeForm, setRouteForm] = useState({ route_key: '', title: '', description: '', duration: '5-8 min', icon: 'heart', color: 'blue' });
  
  // Module dialog
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TherapyModule | null>(null);
  const [moduleRouteId, setModuleRouteId] = useState('');
  const [moduleForm, setModuleForm] = useState({ module_key: '', title: '', description: '', content: '', duration: 5, type: 'breathing' });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [routesRes, modulesRes] = await Promise.all([
        supabase.from('therapy_routes').select('*').order('sort_order'),
        supabase.from('therapy_modules').select('*').order('sort_order')
      ]);
      setRoutes(routesRes.data || []);
      setModules(modulesRes.data || []);
    } catch (err) {
      console.error('Error loading therapy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoute = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: editingRoute 
          ? { action: 'update_therapy_route', id: editingRoute.id, ...routeForm }
          : { action: 'create_therapy_route', ...routeForm, sort_order: routes.length + 1 }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: editingRoute ? '✅ Ruta actualizada' : '✅ Ruta creada' });
      setRouteDialogOpen(false);
      setEditingRoute(null);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('¿Eliminar esta ruta y todos sus módulos? Esta acción no se puede deshacer.')) return;
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'delete_therapy_route', id }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: '✅ Ruta eliminada' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleRoute = async (route: TherapyRoute) => {
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'update_therapy_route', id: route.id, is_active: !route.is_active }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveModule = async () => {
    setSaving(true);
    try {
      const routeModules = modules.filter(m => m.route_id === moduleRouteId);
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: editingModule
          ? { action: 'update_therapy_module', id: editingModule.id, ...moduleForm }
          : { action: 'create_therapy_module', route_id: moduleRouteId, ...moduleForm, sort_order: routeModules.length + 1 }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: editingModule ? '✅ Módulo actualizado' : '✅ Módulo creado' });
      setModuleDialogOpen(false);
      setEditingModule(null);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('¿Eliminar este módulo?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'delete_therapy_module', id }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: '✅ Módulo eliminado' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleModule = async (mod: TherapyModule) => {
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'update_therapy_module', id: mod.id, is_active: !mod.is_active }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openRouteDialog = (route?: TherapyRoute) => {
    if (route) {
      setEditingRoute(route);
      setRouteForm({ route_key: route.route_key, title: route.title, description: route.description, duration: route.duration, icon: route.icon, color: route.color });
    } else {
      setEditingRoute(null);
      setRouteForm({ route_key: '', title: '', description: '', duration: '5-8 min', icon: 'heart', color: 'blue' });
    }
    setRouteDialogOpen(true);
  };

  const openModuleDialog = (routeId: string, mod?: TherapyModule) => {
    setModuleRouteId(routeId);
    if (mod) {
      setEditingModule(mod);
      setModuleForm({ module_key: mod.module_key, title: mod.title, description: mod.description, content: mod.content, duration: mod.duration, type: mod.type });
    } else {
      setEditingModule(null);
      setModuleForm({ module_key: '', title: '', description: '', content: '', duration: 5, type: 'breathing' });
    }
    setModuleDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Gestión del Camino Terapéutico</h2>
          <p className="text-sm text-muted-foreground">{routes.length} rutas · {modules.length} módulos</p>
        </div>
        <Button onClick={() => openRouteDialog()} className="gap-2">
          <Plus size={16} /> Nueva Ruta
        </Button>
      </div>

      <div className="space-y-4">
        {routes.map(route => {
          const routeModules = modules.filter(m => m.route_id === route.id);
          const isExpanded = expandedRoute === route.id;
          
          return (
            <Card key={route.id} className={!route.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpandedRoute(isExpanded ? null : route.id)}>
                    <GripVertical size={16} className="text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {ICON_OPTIONS.find(i => i.value === route.icon)?.label.split(' ')[0]}
                        {route.title}
                        <Badge variant={route.is_active ? 'default' : 'secondary'} className="text-xs">
                          {route.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {routeModules.length} módulos
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{route.description} · {route.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleRoute(route)} title={route.is_active ? 'Desactivar' : 'Activar'}>
                      {route.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openRouteDialog(route)}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRoute(route.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setExpandedRoute(isExpanded ? null : route.id)}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="space-y-3">
                  {routeModules.map(mod => (
                    <div key={mod.id} className={`flex items-center justify-between p-3 rounded-lg border ${!mod.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{mod.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {MODULE_TYPES.find(t => t.value === mod.type)?.label} · {mod.duration} min · Key: {mod.module_key}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleToggleModule(mod)}>
                          {mod.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openModuleDialog(route.id, mod)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteModule(mod.id)}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => openModuleDialog(route.id)} className="w-full gap-2">
                    <Plus size={14} /> Agregar Módulo
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Route Dialog */}
      <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoute ? 'Editar Ruta' : 'Nueva Ruta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Clave única (ej: relajacion)</Label>
              <Input value={routeForm.route_key} onChange={e => setRouteForm(f => ({ ...f, route_key: e.target.value }))} disabled={!!editingRoute} placeholder="clave-unica" />
            </div>
            <div>
              <Label>Título</Label>
              <Input value={routeForm.title} onChange={e => setRouteForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre de la ruta" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={routeForm.description} onChange={e => setRouteForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción breve" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Duración</Label>
                <Input value={routeForm.duration} onChange={e => setRouteForm(f => ({ ...f, duration: e.target.value }))} placeholder="5-8 min" />
              </div>
              <div>
                <Label>Icono</Label>
                <Select value={routeForm.icon} onValueChange={v => setRouteForm(f => ({ ...f, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Select value={routeForm.color} onValueChange={v => setRouteForm(f => ({ ...f, color: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRouteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRoute} disabled={saving || !routeForm.route_key || !routeForm.title}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Editar Módulo' : 'Nuevo Módulo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Clave única (ej: respiracion-basica)</Label>
              <Input value={moduleForm.module_key} onChange={e => setModuleForm(f => ({ ...f, module_key: e.target.value }))} disabled={!!editingModule} placeholder="clave-unica" />
            </div>
            <div>
              <Label>Título</Label>
              <Input value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre del módulo" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción breve" />
            </div>
            <div>
              <Label>Contenido</Label>
              <Textarea value={moduleForm.content} onChange={e => setModuleForm(f => ({ ...f, content: e.target.value }))} placeholder="Texto del contenido del módulo" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duración (min)</Label>
                <Input type="number" value={moduleForm.duration} onChange={e => setModuleForm(f => ({ ...f, duration: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={moduleForm.type} onValueChange={v => setModuleForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODULE_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveModule} disabled={saving || !moduleForm.module_key || !moduleForm.title}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
