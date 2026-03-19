import { useState } from 'react';
import { UserPlus, Building2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

interface CreateUserDialogProps {
  onCreated: () => void;
  trigger?: React.ReactNode;
}

type Step = 'choose' | 'form';

export function CreateUserDialog({ onCreated, trigger }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('choose');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    password: '',
    phone: '',
    role: '' as 'employee' | 'refugi_lead',
    company_name: '',
    company_website: '',
    company_role: '',
    employee_limit: '15',
  });

  const reset = () => {
    setStep('choose');
    setForm({ email: '', fullName: '', password: '', phone: '', role: '' as any, company_name: '', company_website: '', company_role: '', employee_limit: '15' });
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  const chooseRole = (role: 'employee' | 'refugi_lead') => {
    setForm(f => ({ ...f, role }));
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!form.email || !form.fullName || !form.password) {
      toast.error('Email, nombre y contraseña son obligatorios');
      return;
    }
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, any> = {
        action: 'create_user',
        email: form.email,
        fullName: form.fullName,
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
      };

      if (form.role === 'refugi_lead') {
        body.company_name = form.company_name || undefined;
        body.company_website = form.company_website || undefined;
        body.company_role = form.company_role || undefined;
        body.employee_limit = parseInt(form.employee_limit) || 15;
      }

      const { data, error } = await supabase.functions.invoke('super-admin-data', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        form.role === 'refugi_lead'
          ? `Empresa "${form.company_name || form.fullName}" creada con límite de ${form.employee_limit} empleados`
          : `Usuario "${form.fullName}" creado correctamente`
      );
      handleOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Crear Cuenta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {step === 'choose' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                ¿Qué tipo de cuenta deseas crear?
              </DialogTitle>
              <DialogDescription>
                Selecciona el tipo de cuenta para continuar con el registro.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => chooseRole('employee')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div className="p-3 rounded-full bg-secondary group-hover:bg-primary/10 transition-colors">
                  <User className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">Usuario Normal</p>
                  <p className="text-xs text-muted-foreground mt-1">Cuenta individual sin gestión de empleados</p>
                </div>
              </button>
              <button
                onClick={() => chooseRole('refugi_lead')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div className="p-3 rounded-full bg-secondary group-hover:bg-primary/10 transition-colors">
                  <Building2 className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">Empresa</p>
                  <p className="text-xs text-muted-foreground mt-1">Cuenta con gestión de empleados y suscripción</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {form.role === 'refugi_lead' ? (
                  <Building2 className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                {form.role === 'refugi_lead' ? 'Nueva Empresa' : 'Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription>
                {form.role === 'refugi_lead'
                  ? 'Completa los datos de la empresa y su responsable.'
                  : 'Completa los datos del nuevo usuario.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <Label>Nombre completo *</Label>
                <Input value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="María García" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@ejemplo.com" type="email" />
              </div>
              <div>
                <Label>Contraseña *</Label>
                <Input value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" type="password" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" />
              </div>

              {form.role === 'refugi_lead' && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Datos de la empresa</p>
                  </div>
                  <div>
                    <Label>Nombre de la empresa</Label>
                    <Input value={form.company_name} onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Mi Empresa S.L." />
                  </div>
                  <div>
                    <Label>Web de la empresa</Label>
                    <Input value={form.company_website} onChange={(e) => setForm(f => ({ ...f, company_website: e.target.value }))} placeholder="https://miempresa.com" />
                  </div>
                  <div>
                    <Label>Cargo del responsable</Label>
                    <Input value={form.company_role} onChange={(e) => setForm(f => ({ ...f, company_role: e.target.value }))} placeholder="CEO, RRHH, etc." />
                  </div>
                  <div>
                    <Label>Límite de empleados a asignar</Label>
                    <Input
                      value={form.employee_limit}
                      onChange={(e) => setForm(f => ({ ...f, employee_limit: e.target.value }))}
                      placeholder="15"
                      type="number"
                      min="1"
                      max="1000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Cantidad máxima de empleados que podrá gestionar esta empresa.</p>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep('choose')} className="flex-1">
                  Atrás
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 gap-2">
                  {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
                  {loading ? 'Creando...' : 'Crear'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
