import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Copy } from "lucide-react";

interface CreateUserResult {
  success: boolean;
  user_id: string;
  email: string;
  subscription_end: string;
  password: string;
}

export default function AdminCreateRefugiLeadTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreateUserResult | null>(null);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!email || !password || !fullName) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-refugi-lead-test', {
        body: {
          email,
          password,
          fullName
        }
      });

      if (error) throw error;

      // Store password for display (only in test environment)
      const resultWithPassword = {
        ...data,
        password
      };

      setResult(resultWithPassword);

      toast({
        title: "✅ Usuario creado exitosamente",
        description: `Refugi Lead ${email} creado con Plan Básico activo`,
      });

      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (error: any) {
      console.error('Error creating Refugi Lead test user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Usuario Refugi Lead de Prueba</CardTitle>
          <CardDescription>
            Genera un nuevo usuario Refugi Lead con Plan Básico activo por 1 año
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@refugi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="text"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Visible para facilitar las pruebas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Usuario de Prueba"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={isLoading || !email || !password || !fullName}
            className="w-full"
          >
            {isLoading ? "Creando usuario..." : "Crear Refugi Lead de Prueba"}
          </Button>

          {result && (
            <Alert className="border-primary/20 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>
                <div className="space-y-3 mt-2">
                  <h3 className="font-semibold text-foreground">✅ Usuario creado exitosamente</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-background/50">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-mono text-sm">{result.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.email, "Email")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-background/50">
                      <div>
                        <p className="text-xs text-muted-foreground">Contraseña</p>
                        <p className="font-mono text-sm">{result.password}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.password, "Contraseña")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="p-2 rounded bg-background/50">
                      <p className="text-xs text-muted-foreground">Plan</p>
                      <p className="text-sm font-medium">Plan Básico (10 empleadas)</p>
                    </div>

                    <div className="p-2 rounded bg-background/50">
                      <p className="text-xs text-muted-foreground">Suscripción activa hasta</p>
                      <p className="text-sm font-medium">{formatDate(result.subscription_end)}</p>
                    </div>

                    <div className="p-2 rounded bg-background/50">
                      <p className="text-xs text-muted-foreground">User ID</p>
                      <p className="font-mono text-xs break-all">{result.user_id}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Para iniciar sesión:
                    </p>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Ve a <span className="font-mono text-foreground">/auth</span></li>
                      <li>Usa las credenciales mostradas arriba</li>
                      <li>Accede al dashboard de Refugi Lead</li>
                    </ol>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
