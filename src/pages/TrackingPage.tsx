import { useState } from "react";
import { Calendar, Clock, TrendingUp, AlertCircle, CheckCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore, type CheckIn } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

export function TrackingPage() {
  const { checkIns, addCheckIn, settings } = useAppStore();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<'ok' | 'anxious' | 'alert' | null>(null);
  
  const handleCheckIn = (status: 'ok' | 'anxious' | 'alert') => {
    const newCheckIn: Omit<CheckIn, 'id'> = {
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
      checkIn.timestamp.toDateString() === dateStr
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
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              ¿Cómo te sientes hoy?
            </CardTitle>
            <CardDescription>
              Registra tu estado actual para mantener un seguimiento de tu bienestar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button
                onClick={() => handleCheckIn('ok')}
                className="h-14 justify-start gap-3 bg-safe hover:bg-safe/90 text-safe-foreground"
              >
                <CheckCircle size={20} />
                <div className="text-left">
                  <div className="font-semibold">Me siento bien</div>
                  <div className="text-xs opacity-90">Estable, segura, tranquila</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCheckIn('anxious')}
                className="h-14 justify-start gap-3 border-warning/30 hover:bg-warning/10"
              >
                <Clock size={20} className="text-warning" />
                <div className="text-left">
                  <div className="font-semibold">Algo ansiosa</div>
                  <div className="text-xs text-muted-foreground">Intranquila, preocupada</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCheckIn('alert')}
                className="h-14 justify-start gap-3 border-emergency/30 hover:bg-emergency/10"
              >
                <AlertCircle size={20} className="text-emergency" />
                <div className="text-left">
                  <div className="font-semibold">No me siento segura</div>
                  <div className="text-xs text-muted-foreground">Alerta, en riesgo, necesito apoyo</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {todayCheckIn && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getStatusColor(todayCheckIn.status)}`}>
                  {getStatusIcon(todayCheckIn.status)}
                </div>
                <div>
                  <div className="font-semibold">Estado registrado hoy</div>
                  <div className="text-sm text-muted-foreground">
                    {todayCheckIn.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <Badge className={getStatusColor(todayCheckIn.status)}>
                {getStatusLabel(todayCheckIn.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumen Semanal
          </CardTitle>
          <CardDescription>
            Últimos 7 días - {stats.okCount + stats.anxiousCount + stats.alertCount} de {stats.totalDays} días registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-safe">{stats.okCount}</div>
              <div className="text-xs text-muted-foreground">Días estables</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{stats.anxiousCount}</div>
              <div className="text-xs text-muted-foreground">Días ansiosos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emergency">{stats.alertCount}</div>
              <div className="text-xs text-muted-foreground">Días de alerta</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Últimos 7 días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((date, index) => {
              const checkIn = getCheckInForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-2">
                    {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                  <div className="text-xs mb-2">
                    {date.getDate()}
                  </div>
                  <div className={`w-8 h-8 mx-auto rounded-full border-2 flex items-center justify-center ${
                    isToday ? 'border-primary' : 'border-border'
                  } ${
                    checkIn 
                      ? getStatusColor(checkIn.status)
                      : 'bg-muted'
                  }`}>
                    {checkIn ? (
                      getStatusIcon(checkIn.status)
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {checkIns.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Historial Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checkIns
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 5)
                .map((checkIn, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded ${getStatusColor(checkIn.status)}`}>
                        {getStatusIcon(checkIn.status)}
                      </div>
                      <div>
                        <div className="font-medium">{getStatusLabel(checkIn.status)}</div>
                        <div className="text-sm text-muted-foreground">
                          {checkIn.timestamp.toLocaleDateString('es-ES', {
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