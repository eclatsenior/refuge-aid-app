import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

interface CartaBienvenidaPageProps {
  onNavigate: (path: string) => void;
}

const tourSteps = [
  {
    title: "Nosotras, mujeres con historias",
    content: "Mujeres con cicatrices, con memorias que aún tiemblan. Mujeres que han sentido el miedo en el cuerpo, la culpa impuesta, la soledad después del grito.",
    highlight: null
  },
  {
    title: "Sabemos lo que es sobrevivir",
    content: "Nosotras, que sabemos lo que es disociar para sobrevivir, desaparecer para que no duela, callar para que no duela más.",
    highlight: null
  },
  {
    title: "Un mensaje para ti",
    content: "Hoy nos unimos para crear algo que nunca existió para nosotras: una herramienta que te abrace sin preguntas, que te devuelva al presente sin juicio.",
    highlight: "Estás viva. No estás sola. Esto no es tu culpa."
  },
  {
    title: "Creamos Refugio",
    content: "No como una app más, sino como un lugar digital donde el cuerpo, la mente y la memoria puedan encontrar oxígeno.",
    highlight: "Una guía silenciosa cuando todo afuera grita."
  },
  {
    title: "Una red de cuidado",
    content: "Convocamos a mujeres que no olvidan. A las que sanan y a las que aún tiemblan. A las que quieran transformar el trauma en herramienta, el dolor en propósito.",
    highlight: null
  },
  {
    title: "Nuestro grito sereno",
    content: "Refugio es nuestro código de cuidado. Nuestro espacio íntimo de resistencia emocional. Si alguna vez necesitaste esto, quizás es tu momento de ayudar a que exista.",
    highlight: null
  }
];

export function CartaBienvenidaPage({ onNavigate }: CartaBienvenidaPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleContinue();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleContinue = () => {
    localStorage.setItem('manifesto_seen', 'true');
    onNavigate('/');
  };

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col p-4">
      {/* Header */}
      <header className="text-center pt-8 pb-6">
        <div className="h-12 w-12 rounded-full bg-gradient-primary mx-auto mb-3 flex items-center justify-center shadow-elegant">
          <Heart className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Carta de Bienvenida</h1>
      </header>

      {/* Progress indicator */}
      <div className="flex justify-center mb-6 animate-fade-in">
        <div className="flex space-x-2">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 rounded-full transition-all duration-500 hover-scale ${
                index === currentStep 
                  ? 'bg-primary shadow-glow' 
                  : index < currentStep 
                    ? 'bg-primary/60' 
                    : 'bg-muted'
              }`}
              style={{ 
                animationDelay: `${index * 0.1}s`,
                transform: index === currentStep ? 'scale(1.2)' : 'scale(1)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <Card className="bg-card/95 backdrop-blur-sm border-white/20 shadow-elegant mx-auto w-full max-w-md animate-fade-in">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-center text-foreground animate-scale-in">
              {currentTourStep.title}
            </h2>
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-sm leading-relaxed text-muted-foreground text-center">
                {currentTourStep.content}
              </p>
              
              {currentTourStep.highlight && (
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 animate-scale-in" style={{ animationDelay: '0.4s' }}>
                  <p className="text-sm font-medium text-center text-primary">
                    "{currentTourStep.highlight}"
                  </p>
                </div>
              )}
            </div>

            {isLastStep && (
              <div className="text-center pt-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <p className="text-sm font-medium">
                  Firma,<br />
                  <span className="text-primary">Nosotras.</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 pb-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <Button
          onClick={handlePrev}
          variant="ghost"
          size="sm"
          disabled={currentStep === 0}
          className="flex items-center gap-1 hover-scale transition-all duration-200"
        >
          <ChevronLeft size={16} />
          Anterior
        </Button>

        <span className="text-xs text-muted-foreground pulse">
          {currentStep + 1} de {tourSteps.length}
        </span>

        <Button
          onClick={handleNext}
          size="sm"
          className="flex items-center gap-1 hover-scale transition-all duration-200"
        >
          {isLastStep ? 'Continuar' : 'Siguiente'}
          {!isLastStep && <ChevronRight size={16} />}
        </Button>
      </div>
    </div>
  );
}