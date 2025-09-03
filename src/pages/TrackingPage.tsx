import { useState, useEffect } from "react";
import { Calendar, Clock, TrendingUp, AlertCircle, CheckCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore, type CheckIn } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { ensureDate, safeToDateString, safeToLocaleTimeString, safeToLocaleDateString, safeGetTime } from "@/lib/dateUtils";

export function TrackingPage() {
  const [selectedStatus, setSelectedStatus] = useState<'ok' | 'anxious' | 'alert' | null>(null);
  const { checkIns, addCheckIn, settings, updateEmployeePresence } = useAppStore();
  const { toast } = useToast();

  // Heartbeat system - update presence every 2 minutes while on this page
  useEffect(() => {
    const updatePresence = () => {
      updateEmployeePresence(true);
    };

    // Initial update
    updatePresence();

    // Set up interval for heartbeat
    const heartbeatInterval = setInterval(updatePresence, 2 * 60 * 1000); // 2 minutes

    // Update presence when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Mark as offline when leaving the page
      updateEmployeePresence(false);
    };
  }, [updateEmployeePresence]);
  
  const handleCheckIn = (status: 'ok' | 'anxious' | 'alert') => {
    const newCheckIn: Omit<CheckIn, 'id'> = {
      mood: status === 'ok' ? 8 : status === 'anxious' ? 4 : 2,
      status,
      timestamp: new Date(),
      location: settings.locationConsent ? 'Ubicación aproximada' : undefined
    };
    
    addCheckIn(newCheckIn);
    
    const messages = {
      ok: 'Estado registrado como estable',
      anxious: 'Registrado nivel de ansiedad alto',
      alert: 'Alerta registrada - considera contactar con apoyo'
    };
    
    toast({
      title: messages[status],
      description: 'Tu registro ha sido guardado de forma segura',
      variant: status === 'alert' ? 'destructive' : 'default'
    });
    
    if (status === 'alert') {
      // In a real app, this could trigger additional actions
      setTimeout(() => {
        toast({
          title: "¿Necesitas ayuda inmediata?",
          description: "Considera usar el botón de emergencia en la pantalla de inicio",
          duration: 8000
        });
      }, 2000);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-safe text-safe-foreground';
      case 'anxious':
        return 'bg-warning text-warning-foreground';
      case 'alert':
        return 'bg-emergency text-emergency-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ok':
        return 'Estable';
      case 'anxious':
        return 'Ansiosa';
      case 'alert':
        return 'Alerta';
      default:
        return 'Desconocido';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4" />;
      case 'anxious':
        return <Clock className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };
  
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };
  
  const getCheckInForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return checkIns.find(checkIn => 
      safeToDateString(checkIn.timestamp) === dateStr
    );
  };
  
  const getWeeklyStats = () => {
    const last7Days = getLast7Days();
    const weekCheckIns = last7Days.map(date => getCheckInForDate(date)).filter(Boolean);
    
    const okCount = weekCheckIns.filter(c => c?.status === 'ok').length;
    const anxiousCount = weekCheckIns.filter(c => c?.status === 'anxious').length;
    const alertCount = weekCheckIns.filter(c => c?.status === 'alert').length;
    
    return { okCount, anxiousCount, alertCount, totalDays: last7Days.length };
  };
  
  const stats = getWeeklyStats();
  const last7Days = getLast7Days();
  const todayCheckIn = getCheckInForDate(new Date());
  
  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Seguimiento</h1>
        <p className="text-muted-foreground">
          Registra tu estado para llevar un seguimiento de tu bienestar
        </p>
      </header>
      
      {!todayCheckIn && (
        <Card className="mb-8 bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              ¿Cómo te sientes hoy?
            </CardTitle>
            <CardDescription className="text-base">
              Registra tu estado actual para mantener un seguimiento de tu bienestar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <Button
                onClick={() => handleCheckIn('ok')}
                className="h-20 justify-start gap-6 bg-mint/10 hover:bg-mint/20 text-mint border-mint/20 rounded-2xl shadow-soft relative overflow-hidden group"
                variant="outline"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-mint to-mint/80 flex items-center justify-center shadow-lg">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground">Me siento bien</div>
                  <div className="text-sm text-muted-foreground">Estable, segura, tranquila</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCheckIn('anxious')}
                className="h-20 justify-start gap-6 bg-coral/10 hover:bg-coral/20 text-coral border-coral/20 rounded-2xl shadow-soft relative overflow-hidden group"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-coral to-coral/80 flex items-center justify-center shadow-lg">
                  <Clock size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground">Algo ansiosa</div>
                  <div className="text-sm text-muted-foreground">Intranquila, preocupada</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCheckIn('alert')}
                className="h-20 justify-start gap-6 bg-emergency/10 hover:bg-emergency/20 text-emergency border-emergency/20 rounded-2xl shadow-soft relative overflow-hidden group"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emergency to-emergency/80 flex items-center justify-center shadow-lg">
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground">No me siento segura</div>
                  <div className="text-sm text-muted-foreground">Alerta, en riesgo, necesito apoyo</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {todayCheckIn && (
        <Card className="mb-8 bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg ${
                  todayCheckIn.status === 'ok' ? 'bg-gradient-to-br from-mint to-mint/80' :
                  todayCheckIn.status === 'anxious' ? 'bg-gradient-to-br from-coral to-coral/80' :
                  'bg-gradient-to-br from-emergency to-emergency/80'
                }`}>
                  <div className="text-white">
                    {todayCheckIn.status === 'ok' ? <CheckCircle size={24} /> :
                     todayCheckIn.status === 'anxious' ? <Clock size={24} /> :
                     <AlertCircle size={24} />}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-lg text-foreground">Estado registrado hoy</div>
                  <div className="text-sm text-muted-foreground">
                    {safeToLocaleTimeString(todayCheckIn.timestamp, 'es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <Badge className={`${
                todayCheckIn.status === 'ok' ? 'bg-mint/20 text-mint border-mint/30' :
                todayCheckIn.status === 'anxious' ? 'bg-coral/20 text-coral border-coral/30' :
                'bg-emergency/20 text-emergency border-emergency/30'
              }`}>
                {getStatusLabel(todayCheckIn.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="mb-8 bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-cyan" />
            </div>
            Resumen Semanal
          </CardTitle>
          <CardDescription className="text-base">
            Últimos 7 días - {stats.okCount + stats.anxiousCount + stats.alertCount} de {stats.totalDays} días registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-mint/20 flex items-center justify-center">
                <div className="text-2xl font-bold text-mint">{stats.okCount}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">Días estables</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-coral/20 flex items-center justify-center">
                <div className="text-2xl font-bold text-coral">{stats.anxiousCount}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">Días ansiosos</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-emergency/20 flex items-center justify-center">
                <div className="text-2xl font-bold text-emergency">{stats.alertCount}</div>
              </div>
              <div className="text-sm text-muted-foreground font-medium">Días de alerta</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            Últimos 7 días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {last7Days.map((date, index) => {
              const checkIn = getCheckInForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-2 font-medium">
                    {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                  <div className="text-sm mb-3 font-semibold">
                    {date.getDate()}
                  </div>
                  <div className={`w-10 h-10 mx-auto rounded-full border-2 flex items-center justify-center shadow-sm ${
                    isToday ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  } ${
                    checkIn 
                      ? checkIn.status === 'ok' ? 'bg-gradient-to-br from-mint to-mint/80' :
                        checkIn.status === 'anxious' ? 'bg-gradient-to-br from-coral to-coral/80' :
                        'bg-gradient-to-br from-emergency to-emergency/80'
                      : 'bg-muted/50'
                  }`}>
                    {checkIn ? (
                      <div className="text-white">
                        {checkIn.status === 'ok' ? <CheckCircle className="h-4 w-4" /> :
                         checkIn.status === 'anxious' ? <Clock className="h-4 w-4" /> :
                         <AlertCircle className="h-4 w-4" />}
                      </div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {checkIns.length > 0 && (
        <Card className="mt-8 bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">Historial Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkIns
                .sort((a, b) => safeGetTime(b.timestamp) - safeGetTime(a.timestamp))
                .slice(0, 5)
                .map((checkIn, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${
                        checkIn.status === 'ok' ? 'bg-gradient-to-br from-mint to-mint/80' :
                        checkIn.status === 'anxious' ? 'bg-gradient-to-br from-coral to-coral/80' :
                        'bg-gradient-to-br from-emergency to-emergency/80'
                      }`}>
                        <div className="text-white">
                          {checkIn.status === 'ok' ? <CheckCircle className="h-4 w-4" /> :
                           checkIn.status === 'anxious' ? <Clock className="h-4 w-4" /> :
                           <AlertCircle className="h-4 w-4" />}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{getStatusLabel(checkIn.status)}</div>
                        <div className="text-sm text-muted-foreground">
                          {safeToLocaleDateString(checkIn.timestamp, 'es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}