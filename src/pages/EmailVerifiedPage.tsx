import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const EmailVerifiedPage = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'refugi_lead' | 'employee' | null>(null);

  useEffect(() => {
    // Try to detect user role for personalized colors
    const detectRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile?.role) {
          setUserRole(profile.role);
        }
      }
    };
    
    detectRole();
  }, []);

  // Determine gradient based on role
  const gradientClass = userRole === 'refugi_lead' 
    ? 'from-[hsl(262,83%,58%)] to-[hsl(280,85%,70%)]' // Blue-violet for Lead
    : 'from-[hsl(350,85%,65%)] to-[hsl(280,85%,70%)]'; // Pink-violet for Individual/default

  const handleGoToLogin = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in duration-500">
        {/* Header with gradient */}
        <div className={`text-center space-y-4 bg-gradient-to-br ${gradientClass} p-8 rounded-t-2xl`}>
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white animate-in zoom-in duration-500 delay-200" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white">
            ¡Felicidades! 🎉
          </h1>
        </div>

        {/* Content Card */}
        <Card className="rounded-t-none shadow-lg border-t-0">
          <CardContent className="pt-8 pb-6 space-y-6">
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <Mail className="w-16 h-16 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  Tu correo ha sido verificado correctamente
                </h2>
                
                <p className="text-muted-foreground text-base leading-relaxed">
                  Tu cuenta en <span className="font-semibold text-primary">Refugi</span> está ahora activa y lista para usar.
                </p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-sm text-foreground font-medium">
                Próximos pasos:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Haz clic en el botón de abajo para ir al inicio de sesión</li>
                <li>Introduce tu correo electrónico y contraseña</li>
                <li>Accede a tu cuenta de Refugi</li>
              </ol>
            </div>

            <Button 
              onClick={handleGoToLogin}
              className="w-full h-12 text-base font-semibold group"
              size="lg"
            >
              Ir a Iniciar Sesión
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              ¿Necesitas ayuda? Contáctanos en{" "}
              <a 
                href="mailto:soporte@refugi.app" 
                className="text-primary hover:underline font-medium"
              >
                soporte@refugi.app
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Footer branding */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © 2025 Refugi. Tu Espacio de Bienestar.
          </p>
        </div>
      </div>
    </div>
  );
};
