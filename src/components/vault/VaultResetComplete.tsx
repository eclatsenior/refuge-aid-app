import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('notes');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    // Validaciones
    if (newPassword.length < 8) {
      toast({
        title: t('vault.resetComplete.errorPasswordShort'),
        description: t('vault.resetComplete.errorPasswordShortDescription'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('vault.resetComplete.errorPasswordMismatch'),
        description: t('vault.resetComplete.errorPasswordMismatchDescription'),
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
        title: t('vault.resetComplete.successTitle'),
        description: t('vault.resetComplete.successDescription'),
      });
      
      // Limpiar sessionStorage y resetear estados
      sessionStorage.removeItem('vault_token');
      sessionStorage.removeItem('vault_data_key');
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al resetear contraseña:', error);
      toast({
        title: t('vault.resetComplete.errorTitle'),
        description: error.message || t('vault.resetComplete.errorDescription'),
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
            {t('vault.resetComplete.title')}
          </DialogTitle>
          <DialogDescription>
            {t('vault.resetComplete.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-warning/10 p-3 rounded-lg border border-warning/20 text-sm text-warning">
            <strong>{t('vault.resetComplete.warning')}</strong> {t('vault.resetComplete.warningDescription')}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">{t('vault.resetComplete.newPasswordLabel')}</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('vault.resetComplete.newPasswordPlaceholder')}
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
            <Label htmlFor="confirm-password">{t('vault.resetComplete.confirmPasswordLabel')}</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('vault.resetComplete.confirmPasswordPlaceholder')}
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
            {t('vault.resetComplete.validityNote')}
          </p>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('buttons.cancel')}
          </Button>
          <Button 
            onClick={handleResetPassword} 
            disabled={isLoading || !newPassword || !confirmPassword}
          >
            {isLoading ? t('vault.resetComplete.submittingButton') : t('vault.resetComplete.submitButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
