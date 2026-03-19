import { useState } from 'react';
import { Wrench, Mail, KeyRound, ShieldCheck, UserCheck, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

export function AdminSoporteSupportTab() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [unlockEmail, setUnlockEmail] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [messageRecipient, setMessageRecipient] = useState('');
  const [messageText, setMessageText] = useState('');

  const handleUnlockAccount = async () => {
    if (!unlockEmail) return;
    setLoading('unlock');
    try {
      const { data, error } = await supabase.functions.invoke('admin-unlock-account', {
        body: { email: unlockEmail }
      });
      if (error) throw error;
      toast.success('Cuenta desbloqueada correctamente');
      setUnlockEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Error al desbloquear cuenta');
    } finally {
      setLoading(null);
    }
  };

  const handleResendVerification = async () => {
    if (!verifyEmail) return;
    setLoading('verify');
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: { email: verifyEmail, userName: 'Usuario' }
      });
      if (error) throw error;
      toast.success('Email de verificación reenviado');
      setVerifyEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar verificación');
    } finally {
      setLoading(null);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!resetEmail) return;
    setLoading('reset');
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'send_password_reset', email: resetEmail }
      });
      if (error) throw error;
      toast.success('Email de recuperación enviado');
      setResetEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar reset');
    } finally {
      setLoading(null);
    }
  };

  const handleSendMessage = async () => {
    if (!messageRecipient || !messageText) return;
    setLoading('message');
    try {
      // Find user by email
      const { data: profile } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_users', search: messageRecipient, limit: 1 }
      });

      if (!profile?.users?.[0]) {
        toast.error('Usuario no encontrado');
        return;
      }

      const recipientId = profile.users[0].user_id;

      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: {
          action: 'send_admin_message',
          recipientId,
          message: messageText
        }
      });
      if (error) throw error;
      toast.success('Mensaje enviado');
      setMessageRecipient('');
      setMessageText('');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar mensaje');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Herramientas de Soporte
        </h2>
        <p className="text-sm text-muted-foreground">Acciones rápidas para soporte de primera línea</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Unlock Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Desbloquear Cuenta
            </CardTitle>
            <CardDescription>Desbloquea una cuenta que ha sido bloqueada por intentos fallidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Email del usuario</Label>
              <Input
                value={unlockEmail}
                onChange={(e) => setUnlockEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                type="email"
              />
            </div>
            <Button
              onClick={handleUnlockAccount}
              disabled={!unlockEmail || loading === 'unlock'}
              className="w-full gap-2"
            >
              {loading === 'unlock' ? <LoadingSpinner size="sm" /> : <ShieldCheck className="w-4 h-4" />}
              Desbloquear
            </Button>
          </CardContent>
        </Card>

        {/* Resend Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Reenviar Verificación
            </CardTitle>
            <CardDescription>Reenvía el email de verificación de cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Email del usuario</Label>
              <Input
                value={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                type="email"
              />
            </div>
            <Button
              onClick={handleResendVerification}
              disabled={!verifyEmail || loading === 'verify'}
              className="w-full gap-2"
            >
              {loading === 'verify' ? <LoadingSpinner size="sm" /> : <Mail className="w-4 h-4" />}
              Reenviar Verificación
            </Button>
          </CardContent>
        </Card>

        {/* Password Reset */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Enviar Reset de Contraseña
            </CardTitle>
            <CardDescription>Envía un email de recuperación de contraseña al usuario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Email del usuario</Label>
              <Input
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                type="email"
              />
            </div>
            <Button
              onClick={handleSendPasswordReset}
              disabled={!resetEmail || loading === 'reset'}
              className="w-full gap-2"
            >
              {loading === 'reset' ? <LoadingSpinner size="sm" /> : <KeyRound className="w-4 h-4" />}
              Enviar Reset
            </Button>
          </CardContent>
        </Card>

        {/* Send Message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-600" />
              Enviar Mensaje
            </CardTitle>
            <CardDescription>Envía un mensaje interno a cualquier usuario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Email del destinatario</Label>
              <Input
                value={messageRecipient}
                onChange={(e) => setMessageRecipient(e.target.value)}
                placeholder="usuario@ejemplo.com"
                type="email"
              />
            </div>
            <div>
              <Label>Mensaje</Label>
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe tu mensaje..."
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageRecipient || !messageText || loading === 'message'}
              className="w-full gap-2"
            >
              {loading === 'message' ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
              Enviar Mensaje
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
