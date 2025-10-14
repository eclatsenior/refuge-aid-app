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

    if (normalizedPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const role = isRefugiLead ? 'refugi_lead' : 'employee';
      const { error } = await signUp(normalizedEmail, normalizedPassword, normalizedFullName, role);
      
      if (error) {
        toast({
          title: "Error de registro",
          description: error.message || "No se pudo crear la cuenta",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cuenta creada",
          description: "Por favor verifica tu email antes de iniciar sesión."
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
          title: "Email enviado",
          description: "Revisa tu correo para restablecer tu contraseña"
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

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline text-center w-full"
                    disabled={isLoading}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </form>

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
                    ⚠️ Si te registras aquí, debes verificar tu email antes de iniciar sesión. 
                    Los empleados registrados desde el dashboard tienen acceso inmediato.
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