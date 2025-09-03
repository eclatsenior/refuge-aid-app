import { useState } from "react";
import { 
  User, 
  Clock, 
  Heart, 
  TrendingUp, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  Phone,
  MessageSquare,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EmployeeStatus } from "@/store/useAppStore";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface EmployeeCardProps {
  employee: EmployeeStatus;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const getStatusColor = () => {
    if (employee.emergency_alert) return "destructive";
    if (!employee.is_online) return "secondary";
    if (employee.mood_level <= 4) return "warning";
    return "safe";
  };

  const getStatusText = () => {
    if (employee.emergency_alert) return "Emergencia";
    if (!employee.is_online) return "Desconectada";
    if (employee.mood_level <= 4) return "Necesita atención";
    return "Bien";
  };

  const getMoodEmoji = (level: number) => {
    if (level <= 3) return "😢";
    if (level <= 5) return "😐";
    if (level <= 7) return "🙂";
    return "😊";
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleContact = (method: 'phone' | 'message') => {
    toast({
      title: "Contactar empleada",
      description: `Iniciando ${method === 'phone' ? 'llamada' : 'mensaje'} con ${employee.employee_name}...`
    });
  };

  const handleMarkFollowUp = () => {
    toast({
      title: "Seguimiento marcado",
      description: `Se ha marcado seguimiento para ${employee.employee_name}`
    });
  };

  const lastCheckInDate = new Date(employee.last_check_in);
  const timeSinceLastCheckIn = formatDistanceToNow(lastCheckInDate, {
    addSuffix: true,
    locale: es
  });

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        employee.emergency_alert ? 'border-destructive/40 shadow-emergency' : 
        employee.mood_level <= 4 ? 'border-warning/40 shadow-coral' : ''
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials(employee.employee_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {employee.employee_name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {employee.employee_email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant={
              getStatusColor() === "warning" ? "secondary" : 
              getStatusColor() === "safe" ? "secondary" :
              getStatusColor() as "default" | "destructive" | "outline" | "secondary"
            } className="text-xs">
              {getStatusText()}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => handleContact('phone')}>
                  <Phone className="mr-2 h-4 w-4" />
                  Llamar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleContact('message')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Mensaje
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMarkFollowUp}>
                  <Clock className="mr-2 h-4 w-4" />
                  Marcar seguimiento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Emergency Alert Banner */}
        {employee.emergency_alert && (
          <div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
              <span className="text-sm font-medium text-destructive">
                Alerta de emergencia activa
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {employee.is_online ? (
                <>
                  <Wifi className="h-4 w-4 text-safe" />
                  <span className="text-muted-foreground">En línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Desconectada</span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">{timeSinceLastCheckIn}</span>
            </div>
          </div>

          {/* Mood Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-coral" />
                <span className="text-sm text-muted-foreground">Estado de ánimo</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-lg">{getMoodEmoji(employee.mood_level)}</span>
                <span className="text-sm font-medium">{employee.mood_level}/10</span>
              </div>
            </div>
            <Progress 
              value={employee.mood_level * 10} 
              className="h-2"
              // @ts-ignore
              indicatorClassName={
                employee.mood_level <= 4 ? "bg-warning" :
                employee.mood_level <= 7 ? "bg-coral" : "bg-safe"
              }
            />
          </div>

          {/* Therapy Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-cyan" />
                <span className="text-sm text-muted-foreground">Progreso terapéutico</span>
              </div>
              <span className="text-sm font-medium">{employee.therapy_progress}%</span>
            </div>
            <Progress 
              value={employee.therapy_progress} 
              className="h-2"
            />
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="pt-3 border-t border-border/20 space-y-2">
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between py-1">
                  <span>Último check-in:</span>
                  <span>{lastCheckInDate.toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Tiempo en línea hoy:</span>
                  <span>{employee.is_online ? '2h 15m' : '0m'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Alertas esta semana:</span>
                  <span>{employee.emergency_alert ? '1' : '0'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}