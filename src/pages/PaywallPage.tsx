import { Shield, AlertCircle, Lock, Heart, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IndividualSubscriptionPlans } from "@/components/subscription/IndividualSubscriptionPlans";
import { useAppStore } from "@/store/useAppStore";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-primary/10">
      <CardHeader>
        <Icon className="w-10 h-10 text-primary mb-2" />
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function PaywallPage() {
  const { logout } = useAppStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="w-16 h-16 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Bienvenida a Refugi
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Una aplicación diseñada para tu seguridad y bienestar.
              Elige un plan para comenzar a protegerte.
            </p>
          </div>

          <IndividualSubscriptionPlans />

          <Card className="bg-gradient-to-br from-muted/50 to-muted/20 border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="w-6 h-6 text-primary" />
                ¿Tu organización ya usa Refugi?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Si tu empresa u organización ya tiene una cuenta de Refugi,
                pídele a tu coordinadora que te añada como empleada.
                <strong className="text-foreground"> No necesitarás pagar por tu propia suscripción.</strong>
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleLogout}>
                  Cambiar de cuenta
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={AlertCircle}
              title="Alertas de Emergencia"
              description="Envía alertas instantáneas a tus contactos de confianza con tu ubicación"
            />
            <FeatureCard
              icon={Lock}
              title="Totalmente Privado"
              description="Tus datos están cifrados end-to-end y solo tú puedes acceder a ellos"
            />
            <FeatureCard
              icon={Heart}
              title="Apoyo Continuo"
              description="Recursos y herramientas para tu bienestar emocional disponibles 24/7"
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              ¿Tienes dudas? Contáctanos en{" "}
              <a href="mailto:soporte@refugi.app" className="text-primary hover:underline">
                soporte@refugi.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
