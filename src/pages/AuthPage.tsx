import { useState, useEffect } from "react";
import { Eye, EyeOff, Scan, Shield, User, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/useAppStore";
import { FaceRecognition } from "@/components/auth/FaceRecognition";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRefugiLead, setIsRefugiLead] = useState(false);
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  
  const { signIn, signUp, user, profile } = useAppStore();
  const { toast } = useToast();

  // Redirect authenticated users automatically
  useEffect(() => {
    if (user && profile) {
      console.log('✅ User authenticated, redirecting...', { role: profile.role });
      
      // Small delay to ensure state is synchronized
      setTimeout(() => {
        if (profile.role === 'employee') {
          window.location.href = '/';
        } else if (profile.role === 'refugi_lead') {
          // App.tsx will handle dashboard rendering
          window.location.reload();
        }
      }, 100);
    }
  }, [user, profile]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize credentials
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    
    if (!normalizedEmail || !normalizedPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(normalizedEmail, normalizedPassword);
      if (error) {
        toast({
          title: "Error de autenticación",
          description: error.message || "Credenciales incorrectas",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize credentials
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedFullName = fullName.trim();
    
    if (!normalizedEmail || !normalizedPassword || !normalizedFullName) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    // Validar campos de empresa si es Refugi Lead
    if (isRefugiLead) {
      if (!companyName.trim()) {
        toast({
          title: "Error",
          description: "Por favor ingresa el nombre de la empresa",
          variant: "destructive"
        });
        return;
      }
      if (!companyWebsite.trim()) {
        toast({
          title: "Error",
          description: "Por favor ingresa el website de la empresa",
          variant: "destructive"
        });
        return;
      }
      if (!companyRole.trim()) {
        toast({
          title: "Error",
          description: "Por favor ingresa tu rol en la empresa",
          variant: "destructive"
        });
        return;
      }
      
      // Validar formato URL
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(companyWebsite.trim())) {
        toast({
          title: "Error",
          description: "Por favor ingresa un website válido",
          variant: "destructive"
        });
        return;
      }
    }

    // Validación de contraseña: mínimo 8 caracteres
    if (normalizedPassword.length < 8) {
      toast({
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Validación adicional para Refugi Leads: mayúsculas, minúsculas y números
    if (isRefugiLead) {
      const hasUpperCase = /[A-Z]/.test(normalizedPassword);
      const hasLowerCase = /[a-z]/.test(normalizedPassword);
      const hasNumber = /\d/.test(normalizedPassword);

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        toast({
          title: "Contraseña débil",
          description: "Para cuentas empresariales, la contraseña debe incluir mayúsculas, minúsculas y números",
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const role = isRefugiLead ? 'refugi_lead' : 'employee';
      const companyData = isRefugiLead ? {
        company_name: companyName.trim(),
        company_website: companyWebsite.trim(),
        company_role: companyRole.trim()
      } : undefined;

      const { error } = await signUp(normalizedEmail, normalizedPassword, normalizedFullName, role, companyData);
      
      if (error) {
        toast({
          title: "Error de registro",
          description: error.message || "No se pudo crear la cuenta",
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Cuenta creada exitosamente",
          description: "Te hemos enviado un email de verificación. Por favor revisa tu bandeja de entrada (y carpeta de spam) y haz clic en el enlace para activar tu cuenta.",
          duration: 8000
        });
        setActiveTab("login");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleResendVerification = async () => {
    const normalizedEmail = resendEmail.trim().toLowerCase();
    
    if (!normalizedEmail) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo reenviar el email de verificación",
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Email reenviado",
          description: "Revisa tu correo para verificar tu cuenta (también en spam)",
          duration: 8000
        });
        setShowResendVerification(false);
        setResendEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleFaceRecognition = () => {
    setShowFaceRecognition(true);
  };

  const handleFaceRecognitionComplete = (success: boolean) => {
    setShowFaceRecognition(false);
    if (success) {
      toast({
        title: "Autenticación exitosa",
        description: "Reconocimiento facial completado"
      });
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = resetEmail.trim().toLowerCase();
    
    if (!normalizedEmail) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive"
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/`
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo enviar el email de recuperación",
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Email enviado",
          description: "Revisa tu correo para restablecer tu contraseña (también en spam)",
          duration: 8000
        });
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  if (showFaceRecognition) {
    return (
      <FaceRecognition 
        onComplete={handleFaceRecognitionComplete}
        isRefugiLead={isRefugiLead}
      />
    );
  }

  return (
    <>
      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
        isLoading={isLoading}
        onSubmit={handleForgotPassword}
      />
      
      <ResendVerificationDialog
        open={showResendVerification}
        onOpenChange={setShowResendVerification}
        resendEmail={resendEmail}
        setResendEmail={setResendEmail}
        isLoading={isLoading}
        onSubmit={handleResendVerification}
      />
      
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Refugi</h1>
          <p className="text-muted-foreground">Acceso seguro a tu espacio de apoyo</p>
        </div>

        <Card className="border-border/50 backdrop-blur-sm bg-card/80 shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-foreground">
              Iniciar Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Acceder
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Registrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-input border-border"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-input border-border pr-10"
                        disabled={isLoading}
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

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Accediendo...
                      </>
                    ) : (
                      "Acceder"
                    )}
                  </Button>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                      disabled={isLoading}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </form>

                <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    ℹ️ <strong>¿Cuenta nueva?</strong> Si te autoregistraste como empresa o particular, 
                    debes verificar tu email antes de iniciar sesión. Si fuiste registrada por tu empresa, 
                    puedes acceder inmediatamente. Revisa tu bandeja de entrada (y spam).
                  </p>
                </div>

                <Button
                  type="button"
                  variant="link"
                  className="text-xs mt-2 p-0 h-auto"
                  onClick={() => setShowResendVerification(true)}
                >
                  ¿No recibiste el email de verificación? Reenviar →
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">o</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border hover:bg-accent"
                  onClick={handleFaceRecognition}
                  disabled={isLoading}
                >
                  <Scan className="mr-2 h-4 w-4" />
                  Reconocimiento Facial
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="mb-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    {isRefugiLead ? (
                      <>
                        🏢 <strong>Registro empresarial:</strong> Deberás verificar tu email empresarial 
                        antes de poder acceder a tu dashboard y registrar empleados. La contraseña debe 
                        tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas y números.
                      </>
                    ) : (
                      <>
                        👤 <strong>Registro individual:</strong> Deberás verificar tu email antes de 
                        iniciar sesión. Los empleados registrados por empresas tienen acceso inmediato.
                        La contraseña debe tener al menos 8 caracteres.
                      </>
                    )}
                  </p>
                </div>
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre completo</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-input border-border"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-input border-border"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-input border-border pr-10"
                        disabled={isLoading}
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

                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="refugi-lead" className="text-sm font-medium">
                      Registrar como Refugi Lead
                    </Label>
                    <Switch
                      id="refugi-lead"
                      checked={isRefugiLead}
                      onCheckedChange={setIsRefugiLead}
                      disabled={isLoading}
                    />
                  </div>

                  {isRefugiLead && (
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Nombre de la Empresa *</Label>
                        <Input
                          id="company-name"
                          type="text"
                          placeholder="ej. Refugi Solutions"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company-website">Website de la Empresa *</Label>
                        <Input
                          id="company-website"
                          type="url"
                          placeholder="ej. https://www.ejemplo.com"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company-role">Tu Rol en la Empresa *</Label>
                        <Input
                          id="company-role"
                          type="text"
                          placeholder="ej. Gerente de RRHH"
                          value={companyRole}
                          onChange={(e) => setCompanyRole(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      "Crear cuenta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Tu privacidad y seguridad son nuestra prioridad
        </p>
      </div>
      </div>
    </>
  );
}

function ForgotPasswordDialog({ 
  open, 
  onOpenChange, 
  resetEmail, 
  setResetEmail, 
  isLoading, 
  onSubmit 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  resetEmail: string;
  setResetEmail: (email: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restablecer Contraseña</DialogTitle>
          <DialogDescription>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="tu@email.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar enlace"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResendVerificationDialog({ 
  open, 
  onOpenChange, 
  resendEmail, 
  setResendEmail, 
  isLoading, 
  onSubmit 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  resendEmail: string;
  setResendEmail: (email: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reenviar email de verificación</DialogTitle>
          <DialogDescription>
            Ingresa tu email y te enviaremos nuevamente el enlace de verificación.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="resend-email">Email</Label>
            <Input
              id="resend-email"
              type="email"
              placeholder="tu@email.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                "Reenviar email"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}