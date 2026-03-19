import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

interface CreateUserDialogProps {
  defaultRole?: 'employee' | 'refugi_lead';
  onCreated: () => void;
  trigger?: React.ReactNode;
}

export function CreateUserDialog({ defaultRole = 'employee', onCreated, trigger }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    password: '',
    phone: '',
    role: defaultRole,
    company_name: '',
    company_website: '',
    company_role: '',
  });

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
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: {
          action: 'create_user',
          email: form.email,
          fullName: form.fullName,
          password: form.password,
          phone: form.phone || undefined,
          role: form.role,
          company_name: form.company_name || undefined,
          company_website: form.company_website || undefined,
          company_role: form.company_role || undefined,
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Usuario ${form.role === 'refugi_lead' ? '(empresa)' : ''} creado correctamente`);
      setForm({ email: '', fullName: '', password: '', phone: '', role: defaultRole, company_name: '', company_website: '', company_role: '' });
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Crear Usuario
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Crear Nuevo Usuario
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Rol</Label>
            <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Usuario Normal (Employee)</SelectItem>
                <SelectItem value="refugi_lead">Empresa (Refugi Lead)</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              <div>
                <Label>Nombre de la empresa</Label>
                <Input value={form.company_name} onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Mi Empresa S.L." />
              </div>
              <div>
                <Label>Web de la empresa</Label>
                <Input value={form.company_website} onChange={(e) => setForm(f => ({ ...f, company_website: e.target.value }))} placeholder="https://miempresa.com" />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input value={form.company_role} onChange={(e) => setForm(f => ({ ...f, company_role: e.target.value }))} placeholder="CEO, RRHH, etc." />
              </div>
            </>
          )}

          <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
            {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
