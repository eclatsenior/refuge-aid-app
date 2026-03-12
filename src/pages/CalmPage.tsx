import { useState } from "react";
import { Play, Pause, RotateCcw, Heart, Clock, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface CalmExercise {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: 'breathing' | 'grounding' | 'visualization' | 'audio';
  instructions: string[];
  audioUrl?: string;
}

const calmExercises: CalmExercise[] = [
  {
    id: '1',
    title: 'Respiración 4-7-8',
    description: 'Técnica de respiración profunda para calmar la ansiedad',
    duration: 5,
    type: 'breathing',
    instructions: [
      'Siéntate cómodamente con la espalda recta',
      'Inhala por la nariz contando hasta 4',
      'Mantén la respiración contando hasta 7',
      'Exhala por la boca contando hasta 8',
      'Repite el ciclo 4 veces más'
    ]
  },
  {
    id: '2',
    title: 'Grounding 5-4-3-2-1',
    description: 'Ejercicio de conexión con el presente usando los sentidos',
    duration: 3,
    type: 'grounding',
    instructions: [
      'Nombra 5 cosas que puedas VER a tu alrededor',
      'Nombra 4 cosas que puedas TOCAR',
      'Nombra 3 cosas que puedas ESCUCHAR',
      'Nombra 2 cosas que puedas OLER',
      'Nombra 1 cosa que puedas SABOREAR'
    ]
  },
  {
    id: '3',
    title: 'Visualización del lugar seguro',
    description: 'Imagina un lugar donde te sientes completamente segura',
    duration: 8,
    type: 'visualization',
    instructions: [
      'Cierra los ojos y respira profundamente',
      'Imagina un lugar donde te sientes completamente segura',
      'Puede ser real o imaginario',
      'Observa todos los detalles: colores, sonidos, olores',
      'Siente la sensación de seguridad en tu cuerpo',
      'Recuerda que siempre puedes volver a este lugar'
    ]
  },
  {
    id: '4',
    title: 'Relajación muscular progresiva',
    description: 'Libera la tensión de todo tu cuerpo paso a paso',
    duration: 10,
    type: 'audio',
    instructions: [
      'Túmbate o siéntate cómodamente',
      'Tensa y relaja cada grupo muscular',
      'Empieza por los dedos de los pies',
      'Continúa hacia arriba por todo el cuerpo',
      'Mantén la tensión 5 segundos, luego relaja',
      'Nota la diferencia entre tensión y relajación'
    ]
  },
  {
    id: '5',
    title: 'Respiración del corazón',
    description: 'Conecta con tu centro de amor y compasión',
    duration: 6,
    type: 'breathing',
    instructions: [
      'Coloca una mano en tu corazón',
      'Respira lenta y profundamente',
      'Siente el calor de tu mano en el pecho',
      'Con cada respiración, envía amor a tu corazón',
      'Extiende ese amor hacia todo tu cuerpo'
    ]
  }
];

export function CalmPage() {
  const [activeExercise, setActiveExercise] = useState<CalmExercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  
  const startExercise = (exercise: CalmExercise) => {
    setActiveExercise(exercise);
    setCurrentStep(0);
    setTimeRemaining(exercise.duration * 60); // Convert to seconds
    setIsPlaying(true);
    
    // Start timer
    const intervalId = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsPlaying(false);
          completeExercise(exercise);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimer(intervalId);
    
    toast({
      title: "Ejercicio iniciado",
      description: `${exercise.title} - ${exercise.duration} minutos`
    });
  };
  
  const pauseExercise = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setIsPlaying(false);
  };
  
  const resumeExercise = () => {
    if (!activeExercise || timeRemaining <= 0) return;
    
    setIsPlaying(true);
    const intervalId = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsPlaying(false);
          completeExercise(activeExercise);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimer(intervalId);
  };
  
  const resetExercise = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setActiveExercise(null);
    setIsPlaying(false);
    setCurrentStep(0);
    setTimeRemaining(0);
  };
  
  const completeExercise = (exercise: CalmExercise) => {
    toast({
      title: "¡Ejercicio completado!",
      description: `Has terminado: ${exercise.title}`,
      duration: 5000
    });
    
    setTimeout(() => {
      resetExercise();
    }, 2000);
  };
  
  const nextStep = () => {
    if (activeExercise && currentStep < activeExercise.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'breathing':
        return <Heart className="h-5 w-5" />;
      case 'grounding':
        return <span className="text-lg">🌱</span>;
      case 'visualization':
        return <span className="text-lg">🌅</span>;
      case 'audio':
        return <Headphones className="h-5 w-5" />;
      default:
        return <Heart className="h-5 w-5" />;
    }
  };
  
  if (activeExercise) {
    const progress = ((activeExercise.duration * 60 - timeRemaining) / (activeExercise.duration * 60)) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-calm p-4 pb-20">
        <div className="max-w-md mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">{activeExercise.title}</h1>
            <div className="text-3xl font-mono text-primary mb-4">
              {formatTime(timeRemaining)}
            </div>
            <Progress value={progress} className="w-full" />
          </header>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Paso {currentStep + 1} de {activeExercise.instructions.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-lg leading-relaxed">
                {activeExercise.instructions[currentStep]}
              </p>
            </CardContent>
          </Card>
          
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            
            <Button
              size="lg"
              onClick={isPlaying ? pauseExercise : resumeExercise}
              className="gap-2"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              {isPlaying ? 'Pausar' : 'Continuar'}
            </Button>
            
            <Button
              variant="outline"
              onClick={nextStep}
              disabled={currentStep === activeExercise.instructions.length - 1}
            >
              Siguiente
            </Button>
          </div>
          
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={resetExercise}
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw size={16} />
              Terminar ejercicio
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Ejercicios de Calma</h1>
        <p className="text-muted-foreground">
          Encuentra la paz interior con estos ejercicios guiados
        </p>
      </header>
      
      <div className="grid gap-4">
        {calmExercises.map((exercise) => (
          <Card key={exercise.id} className="hover:shadow-soft transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getExerciseIcon(exercise.type)}
                  <div>
                    <CardTitle className="text-lg mb-1">{exercise.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {exercise.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Clock size={12} />
                  {exercise.duration}min
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => startExercise(exercise)}
                className="w-full gap-2"
              >
                <Play size={16} />
                Comenzar ejercicio
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          💡 <strong>Consejo:</strong> Practica estos ejercicios regularmente para obtener mejores resultados. 
          Encuentra un lugar tranquilo donde no te interrumpan.
        </p>
      </div>
    </div>
  );
}