import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VaultUnlockProps {
  open: boolean;
  onSuccess: (token: string) => void;
  onForgotPassword: () => void;
  onClose?: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos
const REQUEST_TIMEOUT = 30000; // 30 segundos timeout

export function VaultUnlock({ open, onSuccess, onForgotPassword, onClose }: VaultUnlockProps) {
  const { t } = useTranslation('notes');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockedUntil) {
      toast({
        title: t('vault.unlock.lockedToast'),
        description: t('vault.unlock.lockedToastDescription').replace('{time}', formatCountdown(countdown)),
        variant: 'destructive',
      });
      return;
    }
    
    if (!password) {
      toast({
        title: t('vault.setup.errorTitle'),
        description: t('errors.passwordRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    console.log('[VaultUnlock] Attempting to verify password...');
    
    // Set timeout for the request
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutRef.current = setTimeout(() => {
        reject(new Error('Request timeout - please try again'));
      }, REQUEST_TIMEOUT);
    });
    
    try {
      const requestPromise = supabase.functions.invoke('verify-vault-password', {
        body: { password }
      });
      
      // Race between request and timeout
      const { data, error } = await Promise.race([
        requestPromise,
        timeoutPromise
      ]) as Awaited<typeof requestPromise>;
      
      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      console.log('[VaultUnlock] Response received:', { 
        success: data?.success, 
        hasToken: !!data?.token,
        hasError: !!error || !!data?.error 
      });
      
      // Error de red o función no disponible
      if (error) {
        console.error('[VaultUnlock] Function error:', error);
        throw error;
      }
      
      // Contraseña incorrecta (ahora viene como success: false)
      if (!data?.success || data?.error) {
        console.log('[VaultUnlock] Password incorrect, incrementing attempts');
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        sessionStorage.setItem('vault_attempts', newAttempts.toString());
        
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_DURATION;
          setLockedUntil(lockTime);
          sessionStorage.setItem('vault_lock', lockTime.toString());
          
          toast({
            title: t('vault.unlock.tooManyAttempts'),
            description: t('vault.unlock.tooManyAttemptsDescription'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('vault.unlock.incorrectPassword'),
            description: `${MAX_ATTEMPTS - newAttempts} ${t('vault.unlock.attemptsRemaining')}`,
            variant: 'destructive',
          });
        }
        
        setPassword('');
        return;
      }
      
      // Éxito
      console.log('[VaultUnlock] Password verified successfully');
      sessionStorage.removeItem('vault_attempts');
      sessionStorage.setItem('vault_token', data.token);
      if (data.data_key) {
        setVaultDataKey(data.data_key);
      }
      setAttempts(0);
      setPassword('');
      
      toast({
        title: t('vault.unlock.successTitle'),
        description: t('vault.unlock.successDescription'),
      });
      
      onSuccess(data.token);
    } catch (error: any) {
      console.error('[VaultUnlock] Error verifying password:', error);
      
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Check if it's a timeout error
      if (error.message === 'Request timeout - please try again') {
        toast({
          title: t('vault.unlock.timeoutTitle'),
          description: t('vault.unlock.timeoutDescription'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('vault.unlock.errorTitle'),
          description: error.message || t('vault.unlock.errorDescription'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <DialogTitle>{t('vault.unlock.title')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('vault.unlock.description')}
          </DialogDescription>
        </DialogHeader>
        
        {lockedUntil ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
            <div className="text-center">
              <p className="font-semibold text-destructive">{t('vault.unlock.locked')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('vault.unlock.lockedDescription')}
              </p>
              <p className="text-2xl font-bold text-primary mt-2">
                {formatCountdown(countdown)}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vault-password">{t('vault.unlock.passwordLabel')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vault-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder={t('vault.unlock.passwordPlaceholder')}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {attempts > 0 && (
                <p className="text-sm text-warning flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {MAX_ATTEMPTS - attempts} {t('vault.unlock.attemptsRemaining')}
                </p>
              )}
            </div>
            
            <DialogFooter className="flex-col gap-2">
              <Button type="submit" disabled={isLoading} className="w-full gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('vault.unlock.verifyingButton')}
                  </>
                ) : (
                  t('vault.unlock.submitButton')
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onForgotPassword}
                className="w-full"
                disabled={isLoading}
              >
                {t('vault.unlock.forgotPassword')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
