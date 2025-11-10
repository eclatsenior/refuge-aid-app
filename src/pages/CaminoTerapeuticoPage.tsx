import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Shield, Clock, Wind, Flower, RotateCcw, Book, MessageSquare, Wrench, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserMenu } from "@/components/layout/UserMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { VideoPlayer } from "@/components/therapy/VideoPlayer";
import { useTherapyVideos } from "@/hooks/useTherapyVideos";

interface CaminoTerapeuticoPageProps {
  onNavigate: (path: string) => void;
}

interface Route {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  color: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: number;
  content: string;
  type: 'breathing' | 'grounding' | 'education' | 'tool' | 'reflection';
}

const routes: Route[] = [
  {
    id: 'estabilizacion',
    title: 'Estabilización emocional',
    description: 'Baja la intensidad y regresa al ahora.',
    duration: '15-20 min',
    icon: <Heart className="h-6 w-6" />,
    color: 'blue',
    modules: [
      {
        id: 'breathing',
        title: 'Respiración 4-7-8',
        description: 'Técnica de respiración para calmar el sistema nervioso',
        duration: 5,
        type: 'breathing',
        content: 'La respiración 4-7-8 ayuda a activar el sistema nervioso parasimpático, reduciendo la ansiedad y promoviendo la calma.'
      },
      {
        id: 'grounding',
        title: 'Grounding 5-4-3-2-1',
        description: 'Ejercicio de conexión con el presente',
        duration: 3,
        type: 'grounding',
        content: 'Este ejercicio te ayuda a reconectar con el momento presente usando tus cinco sentidos.'
      },
      {
        id: 'toolbox',
        title: 'Caja de herramientas rápidas',
        description: 'Personaliza tu kit de emergencia emocional',
        duration: 10,
        type: 'tool',
        content: 'Crea tu colección personal de frases, imágenes, canciones y recursos que te brindan calma y seguridad.'
      }
    ]
  },
  {
    id: 'ansiedad',
    title: 'Ansiedad / Pánico',
    description: 'Guía breve para atravesar el pico.',
    duration: '8-12 min',
    icon: <Wind className="h-6 w-6" />,
    color: 'coral',
    modules: [
      {
        id: 'wave',
        title: 'Atraviesa la ola',
        description: 'Audio guiado para crisis de pánico',
        duration: 5,
        type: 'breathing',
        content: 'Recordar: el pánico es como una ola. Tiene un pico y después baja. No luches contra ella, déjala pasar.'
      },
      {
        id: 'timer',
        title: 'Temporizador de crisis',
        description: 'Instrucciones paso a paso con cronómetro',
        duration: 3,
        type: 'tool',
        content: 'Un temporizador que te guía minuto a minuto durante una crisis de ansiedad.'
      },
      {
        id: 'tracking',
        title: 'Registro rápido',
        description: 'Anota desencadenante y niveles antes/después',
        duration: 2,
        type: 'reflection',
        content: 'Identificar patrones te ayuda a prepararte mejor para futuras situaciones.'
      }
    ]
  },
  {
    id: 'trauma',
    title: 'Trauma y disociación',
    description: 'Anclajes cuando te desconectas.',
    duration: '10-15 min',
    icon: <Shield className="h-6 w-6" />,
    color: 'gray-gradient',
    modules: [
      {
        id: 'grounding-intensive',
        title: 'Volver al presente',
        description: 'Botón de anclaje inmediato',
        duration: 2,
        type: 'grounding',
        content: 'Técnicas intensivas de grounding para momentos de disociación.'
      },
      {
        id: 'anchor-plan',
        title: 'Plan personal de anclaje',
        description: 'Estrategias personalizadas para reconectar',
        duration: 8,
        type: 'tool',
        content: 'Desarrolla tu plan personalizado de técnicas que te ayuden a volver al presente.'
      },
      {
        id: 'mantra',
        title: 'Mantras de seguridad',
        description: 'Frases poderosas para momentos difíciles',
        duration: 3,
        type: 'education',
        content: 'Mantras: "Estoy aquí · Estoy a salvo · Esto pasará"'
      }
    ]
  },
  {
    id: 'violencia',
    title: 'Violencia de género o abuso sexual',
    description: 'Plan de seguridad y apoyo.',
    duration: '20-30 min',
    icon: <Shield className="h-6 w-6" />,
    color: 'purple',
    modules: [
      {
        id: 'safety-plan',
        title: 'Plan de seguridad',
        description: 'Estrategia personalizada para situaciones de riesgo',
        duration: 15,
        type: 'tool',
        content: 'Crea tu plan de seguridad: contactos, rutas de escape, palabras clave y recursos de emergencia.'
      },
      {
        id: 'evidence',
        title: 'Guardar pruebas de forma segura',
        description: 'Checklist para documentar situaciones',
        duration: 10,
        type: 'education',
        content: 'Guía sobre cómo documentar y guardar pruebas de forma segura y privada.'
      },
      {
        id: 'resources-24h',
        title: 'Recursos 24/7',
        description: 'Acceso directo a ayuda especializada',
        duration: 5,
        type: 'tool',
        content: 'Recursos especializados disponibles las 24 horas para situaciones de violencia de género.'
      }
    ]
  },
  {
    id: 'aromaterapia',
    title: 'Aromaterapia',
    description: 'Calma a través del sentido del olfato.',
    duration: '5-10 min',
    icon: <Flower className="h-6 w-6" />,
    color: 'green',
    modules: [
      {
        id: 'library',
        title: 'Biblioteca de aromas',
        description: 'Beneficios y contraindicaciones',
        duration: 5,
        type: 'education',
        content: 'Conoce los diferentes aceites esenciales y sus efectos calmantes.'
      },
      {
        id: 'routine',
        title: 'Rutina guiada de 3 minutos',
        description: 'Sesión corta de aromaterapia',
        duration: 3,
        type: 'breathing',
        content: 'Una rutina breve que combina aromaterapia con respiración consciente.'
      },
      {
        id: 'alternatives',
        title: 'Alternativas sensoriales',
        description: 'Opciones si no tienes aceites',
        duration: 3,
        type: 'tool',
        content: 'Técnicas alternativas usando otros sentidos cuando no tienes aceites esenciales.'
      }
    ]
  }
];

export function CaminoTerapeuticoPage({ onNavigate }: CaminoTerapeuticoPageProps) {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [currentModule, setCurrentModule] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [completedModules, setCompletedModules] = useState<string[]>(
    JSON.parse(localStorage.getItem('completed_modules') || '[]')
  );
  const [videoWatchedPercentage, setVideoWatchedPercentage] = useState(0);
  
  const { getVideoForModule } = useTherapyVideos();

  // Reset video progress cuando cambia el módulo
  useEffect(() => {
    if (selectedRoute) {
      setVideoWatchedPercentage(0);
    }
  }, [currentModule, selectedRoute]);

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    setCurrentModule(0);
    setVideoWatchedPercentage(0); // Reset al entrar a una ruta
  };

  const handleBack = () => {
    if (selectedRoute) {
      setSelectedRoute(null);
      setCurrentModule(0);
      setShowSummary(false);
    } else {
      onNavigate('/');
    }
  };

  const handleCompleteModule = (moduleId: string) => {
    if (!completedModules.includes(moduleId)) {
      const newCompleted = [...completedModules, moduleId];
      setCompletedModules(newCompleted);
      localStorage.setItem('completed_modules', JSON.stringify(newCompleted));
    }
    
    if (selectedRoute && currentModule < selectedRoute.modules.length - 1) {
      setCurrentModule(currentModule + 1);
      setVideoWatchedPercentage(0); // Reset para el siguiente módulo
    } else if (selectedRoute && currentModule === selectedRoute.modules.length - 1) {
      setShowSummary(true);
    }
  };

  const handleRepeatModule = (moduleIndex: number) => {
    setCurrentModule(moduleIndex);
    setShowSummary(false);
    setVideoWatchedPercentage(0); // Reset al cambiar de módulo
  };

  const handleResetRoute = (routeId: string) => {
    const modulesToRemove = routes.find(r => r.id === routeId)?.modules.map(m => m.id) || [];
    const newCompleted = completedModules.filter(id => !modulesToRemove.includes(id));
    setCompletedModules(newCompleted);
    localStorage.setItem('completed_modules', JSON.stringify(newCompleted));
    setCurrentModule(0);
    setShowSummary(false);
    toast({
      title: "Ruta reiniciada",
      description: "Puedes volver a hacer todos los módulos de esta ruta.",
    });
  };

  const handleResetAll = () => {
    setCompletedModules([]);
    localStorage.setItem('completed_modules', JSON.stringify([]));
    toast({
      title: "Todo el progreso limpiado",
      description: "Puedes volver a hacer todas las rutas desde cero.",
    });
  };

  const getRouteProgress = (route: Route) => {
    const completed = route.modules.filter(module => 
      completedModules.includes(module.id)
    ).length;
    return (completed / route.modules.length) * 100;
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20',
      'coral': 'bg-coral/10 border-coral/20 text-coral hover:bg-coral/20',
      'gray-gradient': 'bg-gradient-to-r from-gray-400/10 to-gray-600/10 border-gray-500/20 text-gray-700 hover:from-gray-400/20 hover:to-gray-600/20',
      'purple': 'bg-purple-500/10 border-purple-500/20 text-purple-600 hover:bg-purple-500/20',
      'green': 'bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20'
    };
    return colorMap[color] || 'bg-muted/10 border-muted/20 text-muted-foreground hover:bg-muted/20';
  };

  const getModuleIcon = (type: Module['type']) => {
    switch (type) {
      case 'breathing':
        return <Wind className="h-5 w-5" />;
      case 'grounding':
        return <Eye className="h-5 w-5" />;
      case 'education':
        return <Book className="h-5 w-5" />;
      case 'tool':
        return <Wrench className="h-5 w-5" />;
      case 'reflection':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  // Vista de resumen después de completar la ruta
  if (selectedRoute && showSummary) {
    return (
      <div className="min-h-screen bg-gradient-calm p-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft size={20} />
              Volver
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold">{selectedRoute.title}</h1>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <RotateCcw size={16} />
                  Reiniciar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Reiniciar esta ruta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto borrará tu progreso en "{selectedRoute.title}" y podrás volver a hacer todos los módulos desde el inicio.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleResetRoute(selectedRoute.id)}>
                    Reiniciar ruta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </header>

          <div className="text-center mb-8">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 mx-auto mb-4 flex items-center justify-center shadow-elegant">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Ruta completada!</h2>
            <p className="text-muted-foreground">
              Has terminado todos los módulos de esta ruta terapéutica.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-center mb-4">
              Volver a cursar módulos
            </h3>
            {selectedRoute.modules.map((module, index) => (
              <Card 
                key={module.id}
                className="cursor-pointer transition-all hover:shadow-soft bg-card/90 backdrop-blur-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-sm">
                        <div className="text-white">
                          {getModuleIcon(module.type)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">{module.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {module.duration} min · {module.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRepeatModule(index)}
                      variant="outline"
                      size="sm"
                    >
                      Volver a cursar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 max-w-xs"
            >
              Volver al inicio
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex-1 max-w-xs gap-2">
                  <RotateCcw size={16} />
                  Reiniciar ruta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Reiniciar esta ruta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto borrará tu progreso en "{selectedRoute.title}" y podrás volver a hacer todos los módulos desde el inicio.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleResetRoute(selectedRoute.id)}>
                    Reiniciar ruta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-8">
            "Cada paso cuenta, incluso si repites el camino."
          </div>
        </div>
      </div>
    );
  }

  if (selectedRoute) {
    const module = selectedRoute.modules[currentModule];
    const progress = ((currentModule + 1) / selectedRoute.modules.length) * 100;
    const videoData = getVideoForModule(selectedRoute.id, module.id);
    const videoRequired = videoData?.is_required || false;
    const canProceed = !videoRequired || videoWatchedPercentage >= 80;
    
    return (
      <div className="min-h-screen bg-gradient-calm p-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft size={20} />
              Volver
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold">{selectedRoute.title}</h1>
              <Progress value={progress} className="w-32 mt-2" />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <RotateCcw size={16} />
                  Reiniciar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Reiniciar esta ruta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto borrará tu progreso en "{selectedRoute.title}" y podrás volver a hacer todos los módulos desde el inicio.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleResetRoute(selectedRoute.id)}>
                    Reiniciar ruta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </header>

          <Card className="mb-6 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {selectedRoute.icon}
                {module.title}
                {videoData && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Video disponible
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Módulo {currentModule + 1} de {selectedRoute.modules.length} · {module.duration} min
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {videoData ? (
                <VideoPlayer
                  videoUrl={videoData.video_url}
                  videoName={videoData.video_name || undefined}
                  required={videoData.is_required}
                  onVideoWatched={setVideoWatchedPercentage}
                />
              ) : (
                <div className="p-4 bg-muted/30 border border-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Sin video asignado todavía
                  </p>
                </div>
              )}
              
              <div className="prose prose-sm">
                <p className="text-base leading-relaxed">{module.content}</p>
              </div>
              
              {module.type === 'breathing' && (
                <div className="text-center p-6 bg-mint/5 rounded-xl">
                  <p className="text-mint font-medium mb-4">Ejercicio de respiración</p>
                  <div className="text-sm text-muted-foreground">
                    Sigue las instrucciones de respiración para completar este módulo.
                  </div>
                </div>
              )}
              
              {module.type === 'grounding' && (
                <div className="text-center p-6 bg-coral/5 rounded-xl">
                  <p className="text-coral font-medium mb-4">Ejercicio de conexión</p>
                  <div className="text-sm text-muted-foreground">
                    Usa tus sentidos para reconectar con el presente.
                  </div>
                </div>
              )}
              
              {module.type === 'tool' && (
                <div className="text-center p-6 bg-cyan/5 rounded-xl">
                  <p className="text-cyan font-medium mb-4">Herramienta práctica</p>
                  <div className="text-sm text-muted-foreground">
                    Personaliza esta herramienta para tu uso personal.
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentModule(Math.max(0, currentModule - 1));
                    setVideoWatchedPercentage(0);
                  }}
                  disabled={currentModule === 0}
                >
                  Anterior
                </Button>
                
                <Button
                  onClick={() => handleCompleteModule(module.id)}
                  className="px-8"
                  disabled={!canProceed}
                >
                  {currentModule === selectedRoute.modules.length - 1
                    ? completedModules.includes(module.id) ? 'Finalizar de nuevo' : 'Finalizar ruta'
                    : completedModules.includes(module.id) ? 'Siguiente ✓' : 'Siguiente'
                  }
                </Button>
              </div>
              
              {!canProceed && (
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Debes ver el video completo para continuar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sección "Volver a cursar módulos" siempre visible */}
          <Card className="mb-6 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Todos los módulos de esta ruta</CardTitle>
              <CardDescription>Puedes saltar a cualquier módulo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedRoute.modules.map((mod, index) => {
                const isCurrentModule = index === currentModule;
                const isCompleted = completedModules.includes(mod.id);
                
                return (
                  <div
                    key={mod.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isCurrentModule 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/20 border-muted hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isCurrentModule ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {getModuleIcon(mod.type)}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${isCurrentModule ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {mod.title}
                          {isCompleted && ' ✓'}
                        </p>
                        <p className="text-xs text-muted-foreground">{mod.duration} min</p>
                      </div>
                    </div>
                    {!isCurrentModule && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRepeatModule(index)}
                      >
                        Ir a módulo
                      </Button>
                    )}
                    {isCurrentModule && (
                      <Badge variant="default" className="text-xs">
                        Actual
                      </Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
          
          <div className="text-center text-sm text-muted-foreground">
            "No eres débil por estar herida, sino poderosa por estar de pie."
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft size={20} />
          Volver
        </Button>
        <UserMenu onNavigate={onNavigate} />
      </header>
      
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center shadow-elegant">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Camino Terapéutico</h1>
          <p className="text-muted-foreground text-lg">
            Rutas guiadas para diferentes necesidades emocionales
          </p>
        </div>

        <div className="grid gap-6">
          {routes.map((route) => {
            const progress = getRouteProgress(route);
            const isStarted = progress > 0;
            
            return (
              <Card 
                key={route.id} 
                className={`cursor-pointer transition-all hover:shadow-soft ${getColorClasses(route.color)}`}
                onClick={() => handleRouteSelect(route)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-sm ${
                        route.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                        route.color === 'coral' ? 'bg-gradient-to-br from-coral to-coral/80' :
                        route.color === 'gray-gradient' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        route.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                        route.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                        'bg-gradient-to-br from-primary to-primary/80'
                      }`}>
                        <div className="text-white">
                          {route.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{route.title}</CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                          {route.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1 shrink-0">
                      <Clock size={12} />
                      {route.duration}
                    </Badge>
                  </div>
                  
                  {isStarted && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progreso</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 space-y-4">
          <div className="p-6 bg-muted/50 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Consejo:</strong> Cada ruta está diseñada para diferentes momentos emocionales. 
              Elige la que más resuene contigo ahora.
            </p>
          </div>

          {completedModules.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <RotateCcw size={16} />
                  Limpiar todo el progreso
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Limpiar todo el progreso?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto borrará el progreso de todas las rutas. Podrás volver a hacer todos los módulos desde el inicio.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll}>
                    Limpiar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}