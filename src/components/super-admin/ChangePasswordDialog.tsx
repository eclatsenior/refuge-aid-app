import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  user: { user_id: string; email: string; full_name: string } | null;
  onSuccess: () => void;
}

function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function ChangePasswordDialog({ open, onClose, user, onSuccess }: ChangePasswordDialogProps) {
  const { t } = useTranslation('superAdmin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copyToClipboard, setCopyToClipboard] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleGeneratePassword = () => {
    const password = generateRandomPassword();
    setNewPassword(password);
    setConfirmPassword(password);
    setShowPassword(true);
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (newPassword.length < 8) {
      toast.error(t('users.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('users.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { 
          action: 'set_user_password',
          userId: user.user_id,
          newPassword
        }
      });

      if (error) throw error;

      if (copyToClipboard) {
        await navigator.clipboard.writeText(newPassword);
        toast.success(t('users.passwordCopied'));
      }

      toast.success(t('users.passwordChanged'));
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast.error(t('users.errorChangingPassword'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setCopyToClipboard(true);
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.changePasswordTitle', { name: user.full_name })}</DialogTitle>
          <DialogDescription>
            {t('users.changePasswordDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('users.newPassword')}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Button type="button" variant="outline" onClick={handleGeneratePassword}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('users.generateRandom')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('users.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="copyClipboard"
              checked={copyToClipboard}
              onCheckedChange={(checked) => setCopyToClipboard(checked as boolean)}
            />
            <Label htmlFor="copyClipboard" className="text-sm font-normal cursor-pointer">
              <Copy className="w-3 h-3 inline mr-1" />
              {t('users.copyToClipboard')}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !newPassword || !confirmPassword}>
            {loading ? t('users.saving') : t('users.setPassword')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
