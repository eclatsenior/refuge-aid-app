import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/useAppStore";

interface PasswordResetCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PasswordResetCodeDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: PasswordResetCodeDialogProps) {
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { setAuth } = useAppStore();

  const handleVerifyCode = async () => {
    setError(null);
    
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!normalizedEmail) {
      setError("Por favor ingresa tu email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Por favor ingresa un email válido");
      return;
    }

    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-reset-code', {
        body: { email: normalizedEmail, code }
      });

      if (verifyError || !data?.valid) {
        setError(data?.error || verifyError?.message || "Código inválido o expirado");
        toast({
          title: "Error",
          description: "Código inválido o expirado",
          variant: "destructive"
        });
      } else {
        toast({
          title: "✓ Código verificado",
          description: "Ahora ingresa tu nueva contraseña"
        });
        setStep('password');
        setError(null);
      }
    } catch (err: any) {
      setError("Error al verificar el código");
      toast({
        title: "Error",
        description: "Error al verificar el código",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleResendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!normalizedEmail) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email primero",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error: resendError } = await supabase.functions.invoke('request-password-reset', {
        body: { email: normalizedEmail }
      });

      if (resendError) {
        toast({
          title: "Error",
          description: resendError.message || "No se pudo reenviar el código",
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Código reenviado",
          description: "Revisa tu email (y spam)",
          duration: 8000
        });
        setCode("");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Error al reenviar el código",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    setError(null);

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!hasUpperCase || !hasNumber) {
      setError("La contraseña debe incluir al menos 1 mayúscula y 1 número");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: resetError } = await supabase.functions.invoke('reset-password-with-code', {
        body: { 
          email: email.trim().toLowerCase(), 
          code, 
          newPassword 
        }
      });

      if (resetError || !data?.success) {
        setError(data?.error || resetError?.message || "Error al cambiar contraseña");
        toast({
          title: "Error",
          description: data?.error || "Error al cambiar contraseña",
          variant: "destructive"
        });
      } else {
        // Update session if provided
        if (data.session && data.user) {
          setAuth(data.user, data.session);
        }

        toast({
          title: "✅ Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada correctamente"
        });
        
        // Reset dialog state
        setStep('code');
        setEmail("");
        setCode("");
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      setError("Error al cambiar contraseña");
      toast({
        title: "Error",
        description: "Error al cambiar contraseña",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", met: newPassword.length >= 8 },
    { label: "Al menos 1 mayúscula", met: /[A-Z]/.test(newPassword) },
    { label: "Al menos 1 número", met: /\d/.test(newPassword) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'code' ? 'Ingresa el código' : 'Nueva contraseña'}
          </DialogTitle>
          <DialogDescription>
            {step === 'code' 
              ? 'Ingresa tu email y el código de 6 dígitos que recibiste por email'
              : 'Elige una contraseña segura para tu cuenta'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'code' ? (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="reset-code-email">Email</Label>
              <Input
                id="reset-code-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-code">Código de recuperación</Label>
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
                disabled={isLoading}
              >
                <InputOTPGroup className="w-full justify-center">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-muted-foreground">
                El código expira en 15 minutos
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleVerifyCode} 
                disabled={isLoading || !email || code.length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar código"
                )}
              </Button>
              
              <Button
                type="button"
                variant="link"
                onClick={handleResendCode}
                disabled={isLoading || !email}
                className="text-xs"
              >
                ¿No recibiste el código? Reenviar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium mb-2">Requisitos:</p>
              <ul className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('code');
                  setNewPassword("");
                  setConfirmPassword("");
                  setError(null);
                }}
                disabled={isLoading}
              >
                Volver
              </Button>
              <Button 
                onClick={handleResetPassword} 
                disabled={isLoading || !newPassword || !confirmPassword}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  "Cambiar contraseña"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
