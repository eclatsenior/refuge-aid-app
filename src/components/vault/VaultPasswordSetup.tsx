import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Lock, Shield, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VaultPasswordSetupProps {
  open: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  isManagedByLead?: boolean;
}

export function VaultPasswordSetup({ open, onSuccess, onClose, isManagedByLead = false }: VaultPasswordSetupProps) {
  const { t } = useTranslation('notes');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [hasConfirmedUnderstanding, setHasConfirmedUnderstanding] = useState(false);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return t('vault.setup.validationMinLength');
    }
    if (!/[A-Z]/.test(pwd)) {
      return t('vault.setup.validationUppercase');
    }
    if (!/[a-z]/.test(pwd)) {
      return t('vault.setup.validationLowercase');
    }
    if (!/[0-9]/.test(pwd)) {
      return t('vault.setup.validationNumber');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { password?: string; confirmPassword?: string } = {};
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('vault.setup.validationMismatch');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!hasConfirmedUnderstanding) {
      toast({
        title: t('vault.setup.errorTitle'),
        description: t('vault.setup.confirmRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    console.log('[VaultPasswordSetup] Submitting password setup...');
    
    try {
      const { data, error } = await supabase.functions.invoke('set-vault-password', {
        body: { password }
      });
      
      console.log('[VaultPasswordSetup] Response:', { data, error });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: t('vault.setup.successTitle'),
        description: t('vault.setup.successDescription'),
      });
      
      setPassword('');
      setConfirmPassword('');
      setHasConfirmedUnderstanding(false);
      onSuccess();
    } catch (error: any) {
      console.error('[VaultPasswordSetup] Error:', error);
      toast({
        title: t('vault.setup.errorTitle'),
        description: error.message || t('vault.setup.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <DialogTitle>{t('vault.setup.title')}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {t('vault.setup.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Critical Warning - One Time Setup */}
        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="text-destructive">{t('vault.setup.oneTimeWarning')}</strong>
            <p className="text-muted-foreground mt-1">
              {t('vault.setup.oneTimeWarningDescription')}
            </p>
          </div>
        </div>

        {/* Info about reset process */}
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg border border-border">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            {isManagedByLead ? (
              <p>{t('vault.setup.resetInfoManaged')}</p>
            ) : (
              <p>{t('vault.setup.resetInfoSelfService')}</p>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t('vault.setup.passwordLabel')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: undefined });
                }}
                className="pl-9"
                placeholder={t('vault.setup.passwordPlaceholder')}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('vault.setup.passwordRequirements')}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('vault.setup.confirmPasswordLabel')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors({ ...errors, confirmPassword: undefined });
                }}
                className="pl-9"
                placeholder={t('vault.setup.confirmPasswordPlaceholder')}
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <Checkbox
              id="confirm-understanding"
              checked={hasConfirmedUnderstanding}
              onCheckedChange={(checked) => setHasConfirmedUnderstanding(checked === true)}
              disabled={isLoading}
            />
            <label
              htmlFor="confirm-understanding"
              className="text-sm leading-tight cursor-pointer"
            >
              <span className="font-medium text-warning">{t('vault.setup.confirmCheckboxLabel')}</span>
            </label>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !hasConfirmedUnderstanding} 
              className="w-full"
            >
              {isLoading ? t('vault.setup.submittingButton') : t('vault.setup.submitButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
