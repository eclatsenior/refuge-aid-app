import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface DiscreetVaultUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const REQUEST_TIMEOUT = 30000;

export function DiscreetVaultUnlockDialog({ open, onOpenChange, onSuccess }: DiscreetVaultUnlockDialogProps) {
  const { t } = useTranslation('home');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const lockData = sessionStorage.getItem('discreet_vault_lock');
    if (lockData) {
      const lockTime = parseInt(lockData);
      if (Date.now() < lockTime) {
        setLockedUntil(lockTime);
      } else {
        sessionStorage.removeItem('discreet_vault_lock');
        sessionStorage.removeItem('discreet_vault_attempts');
      }
    }
    const attemptsData = sessionStorage.getItem('discreet_vault_attempts');
    if (attemptsData) setAttempts(parseInt(attemptsData));
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        sessionStorage.removeItem('discreet_vault_lock');
        sessionStorage.removeItem('discreet_vault_attempts');
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedUntil || !password) return;

    setIsLoading(true);
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutRef.current = setTimeout(() => reject(new Error('timeout')), REQUEST_TIMEOUT);
    });

    try {
      const requestPromise = supabase.functions.invoke('verify-vault-password', {
        body: { password }
      });

      const { data, error } = await Promise.race([requestPromise, timeoutPromise]) as Awaited<typeof requestPromise>;
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }

      if (error) throw error;

      if (!data?.success) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        sessionStorage.setItem('discreet_vault_attempts', newAttempts.toString());

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_DURATION;
          setLockedUntil(lockTime);
          sessionStorage.setItem('discreet_vault_lock', lockTime.toString());
        }

        toast({
          title: t('vaultUnlock.incorrectPassword'),
          description: `${MAX_ATTEMPTS - newAttempts} ${t('vaultUnlock.attemptsRemaining')}`,
          variant: 'destructive',
        });
        setPassword('');
        return;
      }

      // Success
      sessionStorage.removeItem('discreet_vault_attempts');
      setAttempts(0);
      setPassword('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      toast({
        title: t('vaultUnlock.errorTitle'),
        description: t('vaultUnlock.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <DialogTitle>{t('vaultUnlock.title')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('vaultUnlock.description')}
          </DialogDescription>
        </DialogHeader>

        {lockedUntil ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
            <div className="text-center">
              <p className="font-semibold text-destructive">{t('vaultUnlock.locked')}</p>
              <p className="text-2xl font-bold text-primary mt-2">{formatCountdown(countdown)}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discreet-vault-password">{t('vaultUnlock.passwordLabel')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="discreet-vault-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder={t('vaultUnlock.passwordPlaceholder')}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {attempts > 0 && (
                <p className="text-sm text-warning flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {MAX_ATTEMPTS - attempts} {t('vaultUnlock.attemptsRemaining')}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full gap-2">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t('vaultUnlock.verifying')}</>
                ) : (
                  t('vaultUnlock.submit')
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
