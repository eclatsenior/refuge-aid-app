import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VaultResetCompleteProps {
  open: boolean;
  onClose: () => void;
  resetToken: string;
  onSuccess: () => void;
}

export function VaultResetComplete({ open, onClose, resetToken, onSuccess }: VaultResetCompleteProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    // Validaciones
    if (newPassword.length < 8) {
      toast({
        title: 'Contraseña muy corta',
        description: 'La contraseña debe tener al menos 8 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Las contraseñas no coinciden',
        description: 'Por favor verifica que ambas contraseñas sean iguales',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Llamar a reset-vault-password
      const { data, error } = await supabase.functions.invoke('reset-vault-password', {
        body: { resetToken, newPassword }
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: '✅ Contraseña actualizada',
        description: 'Tu Caja Fuerte tiene una nueva contraseña',
      });
      
      // Limpiar sessionStorage y resetear estados
      sessionStorage.removeItem('vault_token');
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al resetear contraseña:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Solicitud Aprobada
          </DialogTitle>
          <DialogDescription>
            Tu Refugi Lead ha aprobado tu solicitud. Establece una nueva contraseña para tu Caja Fuerte.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-warning/10 p-3 rounded-lg border border-warning/20 text-sm text-warning">
            <strong>⚠️ Importante:</strong> Las notas antiguas no podrán descifrarse con esta nueva contraseña.
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Esta ventana es válida por 30 minutos desde la aprobación.
          </p>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleResetPassword} 
            disabled={isLoading || !newPassword || !confirmPassword}
          >
            {isLoading ? 'Actualizando...' : 'Establecer contraseña'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
