import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface CartaBienvenidaPageProps {
  onNavigate: (path: string) => void;
}

export function CartaBienvenidaPage({ onNavigate }: CartaBienvenidaPageProps) {
  const [hasRead, setHasRead] = useState(false);
  
  const handleContinue = () => {
    // Marcar como leído en localStorage
    localStorage.setItem('manifesto_seen', 'true');
    onNavigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8 pt-8">
          <div className="h-16 w-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center shadow-elegant">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Carta de Bienvenida</h1>
          <p className="text-muted-foreground">Un mensaje de nosotras para ti</p>
        </header>

        <Card className="mb-8 bg-card/90 backdrop-blur-sm border-white/20 shadow-elegant">
          <CardContent className="p-8 space-y-6 text-base leading-relaxed">
            <p>
              <strong>Nosotras, mujeres con historias.</strong> Mujeres con cicatrices, con memorias que aún tiemblan.
            </p>
            
            <p>
              Mujeres que han sentido el miedo en el cuerpo, la culpa impuesta, la soledad después del grito, el juicio después del dolor.
            </p>
            
            <p>
              Nosotras, que sabemos lo que es disociar para sobrevivir, desaparecer para que no duela, callar para que no duela más.
            </p>
            
            <div className="bg-primary/10 p-6 rounded-xl border border-primary/20 my-8">
              <p className="text-lg font-semibold text-center text-primary">
                "Estás viva. No estás sola. Esto no es tu culpa."
              </p>
            </div>
            
            <p>
              Nosotras, hoy nos unimos para crear algo que nunca existió para nosotras: una herramienta que te abrace sin preguntas, que te devuelva al presente sin juicio, que te diga:
              <strong> "Estás viva. No estás sola. Esto no es tu culpa."</strong>
            </p>
            
            <p>
              Creamos Refugio no como una app más, sino como un lugar digital donde el cuerpo, la mente y la memoria puedan encontrar oxígeno.
            </p>
            
            <div className="bg-accent/10 p-6 rounded-xl border border-accent/20 my-8">
              <p className="text-lg font-semibold text-center text-accent-foreground">
                "Una guía silenciosa cuando todo afuera grita."
              </p>
            </div>
            
            <p>
              Una mano invisible cuando disociar se convierte en la única salida. Una voz que te recuerda que no eres débil por estar herida, sino poderosa por estar de pie.
            </p>
            
            <p>
              Convocamos a mujeres que no olvidan. A las que sanan y a las que aún tiemblan. A las que quieran transformar el trauma en herramienta, el dolor en propósito, la memoria en red de cuidado.
            </p>
            
            <p>
              Queremos construir este refugio entre todas. Porque nadie más que nosotras sabe lo que duele. Y nadie mejor que nosotras sabrá lo que puede aliviar.
            </p>
            
            <p>
              <strong>Refugio es nuestro grito sereno. Nuestro código de cuidado. Nuestro espacio íntimo de resistencia emocional.</strong>
            </p>
            
            <p>
              Si alguna vez necesitaste esto, quizás es tu momento de ayudar a que exista.
            </p>
            
            <div className="text-right pt-4">
              <p className="font-bold text-lg">
                Firma,<br />
                <span className="text-primary">Nosotras.</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={handleContinue}
            size="lg"
            className="px-8 py-4 text-lg font-semibold shadow-elegant"
          >
            Entiendo y continúo
          </Button>
        </div>
      </div>
    </div>
  );
}