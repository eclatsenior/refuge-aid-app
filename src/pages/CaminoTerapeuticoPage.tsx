import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Heart, Shield, Clock, Wind, Flower, RotateCcw, Book, MessageSquare, Wrench, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserMenu } from "@/components/layout/UserMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { VideoPlayer } from "@/components/therapy/VideoPlayer";
import { useTherapyVideos } from "@/hooks/useTherapyVideos";
import { useTherapyRoutes, TherapyRoute, TherapyModule } from "@/hooks/useTherapyRoutes";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface CaminoTerapeuticoPageProps {
  onNavigate: (path: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <Heart className="h-6 w-6" />,
  wind: <Wind className="h-6 w-6" />,
  shield: <Shield className="h-6 w-6" />,
  flower: <Flower className="h-6 w-6" />,
  book: <Book className="h-6 w-6" />,
  wrench: <Wrench className="h-6 w-6" />,
  clock: <Clock className="h-6 w-6" />,
};

export function CaminoTerapeuticoPage({ onNavigate }: CaminoTerapeuticoPageProps) {
  const [selectedRoute, setSelectedRoute] = useState<TherapyRoute | null>(null);
  const [currentModule, setCurrentModule] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [completedModules, setCompletedModules] = useState<string[]>(
    JSON.parse(localStorage.getItem('completed_modules') || '[]')
  );
  const [videoWatchedPercentage, setVideoWatchedPercentage] = useState(0);
  
  const { getVideoForModule, loading: videosLoading } = useTherapyVideos();
  const { routes, loading: routesLoading, error: routesError } = useTherapyRoutes();

  useEffect(() => {
    if (selectedRoute) {
      setVideoWatchedPercentage(0);
    }
  }, [currentModule, selectedRoute]);

  const handleRouteSelect = (route: TherapyRoute) => {
    setSelectedRoute(route);
    setCurrentModule(0);
    setVideoWatchedPercentage(0);
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

  const handleCompleteModule = (moduleKey: string) => {
    if (!completedModules.includes(moduleKey)) {
      const newCompleted = [...completedModules, moduleKey];
      setCompletedModules(newCompleted);
      localStorage.setItem('completed_modules', JSON.stringify(newCompleted));
    }
    
    if (selectedRoute && currentModule < selectedRoute.modules.length - 1) {
      setCurrentModule(currentModule + 1);
      setVideoWatchedPercentage(0);
    } else if (selectedRoute && currentModule === selectedRoute.modules.length - 1) {
      setShowSummary(true);
    }
  };

  const handleRepeatModule = (moduleIndex: number) => {
    setCurrentModule(moduleIndex);
    setShowSummary(false);
    setVideoWatchedPercentage(0);
  };

  const handleResetRoute = (routeKey: string) => {
    const route = routes.find(r => r.route_key === routeKey);
    const modulesToRemove = route?.modules.map(m => m.module_key) || [];
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

  const handleVideoCompleted = async (videoId: string, routeId: string, moduleId: string, duration: number) => {
    try {
      const { error } = await supabase.functions.invoke('track-video-progress', {
        body: {
          video_id: videoId,
          route_id: routeId,
          module_id: moduleId,
          watched_duration_seconds: Math.floor(duration)
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('❌ Error tracking video progress:', error);
    }
  };

  const getRouteProgress = (route: TherapyRoute) => {
    const completed = route.modules.filter(module => 
      completedModules.includes(module.module_key)
    ).length;
    return route.modules.length > 0 ? (completed / route.modules.length) * 100 : 0;
  };

  const getRouteIcon = (iconName: string) => ICON_MAP[iconName] || <Heart className="h-6 w-6" />;

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

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'breathing': return <Wind className="h-5 w-5" />;
      case 'grounding': return <Eye className="h-5 w-5" />;
      case 'education': return <Book className="h-5 w-5" />;
      case 'tool': return <Wrench className="h-5 w-5" />;
      case 'reflection': return <MessageSquare className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getIconBgClass = (color: string) => {
    const map: Record<string, string> = {
      'blue': 'bg-gradient-to-br from-blue-500 to-blue-600',
      'coral': 'bg-gradient-to-br from-coral to-coral/80',
      'gray-gradient': 'bg-gradient-to-br from-gray-400 to-gray-600',
      'purple': 'bg-gradient-to-br from-purple-500 to-purple-600',
      'green': 'bg-gradient-to-br from-green-500 to-green-600',
    };
    return map[color] || 'bg-gradient-to-br from-primary to-primary/80';
  };

  // Loading state
  if (routesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Cargando camino terapéutico...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (routesError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Error al cargar las rutas</p>
          <p className="text-sm text-muted-foreground">{routesError}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Summary view
  if (selectedRoute && showSummary) {
    return (
      <div className="min-h-screen bg-gradient-calm p-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
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
                  <AlertDialogAction onClick={() => handleResetRoute(selectedRoute.route_key)}>
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
            <h3 className="text-lg font-semibold text-center mb-4">Volver a cursar módulos</h3>
            {selectedRoute.modules.map((module, index) => (
              <Card key={module.id} className="cursor-pointer transition-all hover:shadow-soft bg-card/90 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-sm">
                        <div className="text-white">{getModuleIcon(module.type)}</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">{module.title}</h4>
                        <p className="text-sm text-muted-foreground">{module.duration} min · {module.description}</p>
                      </div>
                    </div>
                    <Button onClick={() => handleRepeatModule(index)} variant="outline" size="sm">
                      Volver a cursar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {(() => {
              const currentIndex = routes.findIndex(r => r.route_key === selectedRoute.route_key);
              const nextRoute = currentIndex !== -1 && currentIndex < routes.length - 1 ? routes[currentIndex + 1] : null;
              
              if (nextRoute) {
                return (
                  <Button
                    onClick={() => {
                      setSelectedRoute(nextRoute);
                      setCurrentModule(0);
                      setShowSummary(false);
                      setVideoWatchedPercentage(0);
                      toast({ title: `Iniciando: ${nextRoute.title}`, description: "¡Continúa tu camino terapéutico!" });
                    }}
                    className="w-full max-w-md mx-auto gap-2"
                  >
                    <ArrowRight size={16} />
                    Continuar a: {nextRoute.title}
                  </Button>
                );
              }
              return null;
            })()}
            
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack} className="flex-1 max-w-xs">
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
                    <AlertDialogAction onClick={() => handleResetRoute(selectedRoute.route_key)}>
                      Reiniciar ruta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-8">
            "Cada paso cuenta, incluso si repites el camino."
          </div>
        </div>
      </div>
    );
  }

  // Module view
  if (selectedRoute) {
    const module = selectedRoute.modules[currentModule];
    if (!module) {
      setCurrentModule(0);
      return null;
    }
    const progress = ((currentModule + 1) / selectedRoute.modules.length) * 100;
    const videoData = getVideoForModule(selectedRoute.route_key, module.module_key);
    const fallbackSignedUrl = videoData?.video_url?.includes('/object/sign/') ? videoData.video_url : null;
    const playableVideoUrl = videoData?.signed_url || fallbackSignedUrl || null;
    const videoRequired = videoData?.is_required || false;
    const canProceed = !videoRequired || videoWatchedPercentage >= 80;
    
    return (
      <div className="min-h-screen bg-gradient-calm p-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
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
                  <AlertDialogAction onClick={() => handleResetRoute(selectedRoute.route_key)}>
                    Reiniciar ruta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </header>

          <Card className="mb-6 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getRouteIcon(selectedRoute.icon)}
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
              {videoData && playableVideoUrl && (
                <VideoPlayer
                  videoUrl={playableVideoUrl}
                  videoName={videoData.video_name || undefined}
                  videoId={videoData.id}
                  routeId={selectedRoute.route_key}
                  moduleId={module.module_key}
                  required={videoData.is_required}
                  onVideoWatched={setVideoWatchedPercentage}
                  onVideoCompleted={handleVideoCompleted}
                />
              )}

              {videoData && !playableVideoUrl && (
                <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
                  No se pudo generar un enlace seguro para este video. Reintenta en unos segundos.
                </div>
              )}
              
              {selectedRoute.route_key === 'aromaterapia' && module.module_key === 'library' ? (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🪻</span>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Lavanda</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">Relajante, reduce el estrés y promueve el sueño.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🌿</span>
                        <h4 className="font-semibold text-green-700 dark:text-green-300">Eucalipto</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">Revitalizante, energético, control mental.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🍋</span>
                        <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">Limón</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">Purificador refrescante y eleva el estado de ánimo.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🌸</span>
                        <h4 className="font-semibold text-pink-700 dark:text-pink-300">Melissa</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">Calmante, antidepresivo y para el insomnio.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                    <p className="text-sm italic text-foreground/80">
                      ✨ Elige el aceite que resuene contigo y acompáñalo de respiración con cada módulo.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm">
                  <p className="text-base leading-relaxed">{module.content}</p>
                </div>
              )}
              
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
                  onClick={() => handleCompleteModule(module.module_key)}
                  className="px-8"
                  disabled={!canProceed}
                >
                  {currentModule === selectedRoute.modules.length - 1
                    ? completedModules.includes(module.module_key) ? 'Finalizar de nuevo' : 'Finalizar ruta'
                    : completedModules.includes(module.module_key) ? 'Siguiente ✓' : 'Siguiente'
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

          <Card className="mb-6 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Todos los módulos de esta ruta</CardTitle>
              <CardDescription>Puedes saltar a cualquier módulo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedRoute.modules.map((mod, index) => {
                const isCurrentModule = index === currentModule;
                const isCompleted = completedModules.includes(mod.module_key);
                
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
                      <Button variant="ghost" size="sm" onClick={() => handleRepeatModule(index)}>
                        Ir a módulo
                      </Button>
                    )}
                    {isCurrentModule && (
                      <Badge variant="default" className="text-xs">Actual</Badge>
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

  // Routes list view
  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
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
            const routeProgress = getRouteProgress(route);
            const isStarted = routeProgress > 0;
            
            return (
              <Card 
                key={route.id} 
                className={`cursor-pointer transition-all hover:shadow-soft ${getColorClasses(route.color)}`}
                onClick={() => handleRouteSelect(route)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-sm ${getIconBgClass(route.color)}`}>
                        <div className="text-white">{getRouteIcon(route.icon)}</div>
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
                        <span>{Math.round(routeProgress)}%</span>
                      </div>
                      <Progress value={routeProgress} className="w-full" />
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
