import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VaultUnlockProps {
  open: boolean;
  onSuccess: (token: string) => void;
  onForgotPassword: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

export function VaultUnlock({ open, onSuccess, onForgotPassword }: VaultUnlockProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Verificar si hay bloqueo activo
    const lockData = sessionStorage.getItem('vault_lock');
    if (lockData) {
      const lockTime = parseInt(lockData);
      const now = Date.now();
      if (now < lockTime) {
        setLockedUntil(lockTime);
      } else {
        sessionStorage.removeItem('vault_lock');
        sessionStorage.removeItem('vault_attempts');
      }
    }

    // Cargar intentos previos
    const attemptsData = sessionStorage.getItem('vault_attempts');
    if (attemptsData) {
      setAttempts(parseInt(attemptsData));
    }
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((lockedUntil - now) / 1000);
      
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        sessionStorage.removeItem('vault_lock');
        sessionStorage.removeItem('vault_attempts');
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockedUntil]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockedUntil) {
      toast({
        title: 'Bloqueado temporalmente',
        description: `Espera ${formatCountdown(countdown)} para intentar de nuevo`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!password) {
      toast({
        title: 'Error',
        description: 'Ingresa tu contraseña',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-vault-password', {
        body: { password }
      });
      
      if (error) throw error;
      
      if (data.error) {
        // Contraseña incorrecta
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        sessionStorage.setItem('vault_attempts', newAttempts.toString());
        
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_DURATION;
          setLockedUntil(lockTime);
          sessionStorage.setItem('vault_lock', lockTime.toString());
          
          toast({
            title: 'Bloqueado',
            description: `Demasiados intentos fallidos. Bloqueado por 15 minutos`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Contraseña incorrecta',
            description: `${MAX_ATTEMPTS - newAttempts} intentos restantes`,
            variant: 'destructive',
          });
        }
        
        setPassword('');
        return;
      }
      
      // Éxito
      sessionStorage.removeItem('vault_attempts');
      sessionStorage.setItem('vault_token', data.token);
      setAttempts(0);
      setPassword('');
      
      toast({
        title: '🔓 Caja Fuerte desbloqueada',
        description: 'Accediendo a tus notas seguras...',
      });
      
      onSuccess(data.token);
    } catch (error: any) {
      console.error('Error al verificar contraseña:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo verificar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <DialogTitle>Desbloquear Caja Fuerte</DialogTitle>
          </div>
          <DialogDescription>
            Ingresa tu contraseña para acceder a tus notas protegidas
          </DialogDescription>
        </DialogHeader>
        
        {lockedUntil ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
            <div className="text-center">
              <p className="font-semibold text-destructive">Bloqueado temporalmente</p>
              <p className="text-sm text-muted-foreground mt-2">
                Podrás intentar de nuevo en:
              </p>
              <p className="text-2xl font-bold text-primary mt-2">
                {formatCountdown(countdown)}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vault-password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vault-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="Ingresa tu contraseña"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {attempts > 0 && (
                <p className="text-sm text-warning flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {MAX_ATTEMPTS - attempts} intentos restantes
                </p>
              )}
            </div>
            
            <DialogFooter className="flex-col gap-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Verificando...' : 'Desbloquear'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onForgotPassword}
                className="w-full"
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
