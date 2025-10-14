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
  MoreVertical,
  MessageCircle
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EmployeeStatus } from "@/store/useAppStore";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { MessageDialog } from "@/components/messaging/MessageDialog";

interface EmployeeCardProps {
  employee: EmployeeStatus;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const { toast } = useToast();
  const { messages } = useAppStore();

  const getStatusColor = () => {
    if (employee.emergency_alert) return "destructive";
    if (!employee.is_online) return "secondary";
    if (employee.mood_level !== null && employee.mood_level <= 4) return "warning";
    if (employee.mood_level !== null) return "safe";
    return "secondary";
  };

  const getStatusText = () => {
    if (employee.emergency_alert) return "Emergencia";
    if (!employee.is_online) return "Desconectada";
    if (employee.mood_level !== null && employee.mood_level <= 4) return "Necesita atención";
    if (employee.mood_level !== null) return "Bien";
    return "Sin datos";
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
    if (!employee.employee_phone) {
      toast({
        title: "Teléfono no disponible",
        description: `${employee.employee_name} no tiene teléfono registrado`,
        variant: "destructive"
      });
      return;
    }

    if (method === 'phone') {
      window.open(`tel:${employee.employee_phone}`, '_system');
    } else {
      const message = encodeURIComponent(`Hola ${employee.employee_name.split(' ')[0]}, ¿cómo estás?`);
      window.open(`sms:${employee.employee_phone}?body=${message}`, '_system');
    }
    
    toast({
      title: "Contactando empleada",
      description: `Iniciando ${method === 'phone' ? 'llamada' : 'mensaje'} con ${employee.employee_name}...`
    });
  };

  const handleMarkFollowUp = () => {
    toast({
      title: "Seguimiento marcado",
      description: `Se ha marcado seguimiento para ${employee.employee_name}`
    });
  };

  const lastCheckInDate = employee.last_check_in ? new Date(employee.last_check_in) : null;
  const timeSinceLastCheckIn = lastCheckInDate 
    ? formatDistanceToNow(lastCheckInDate, { addSuffix: true, locale: es })
    : 'Sin registro';
  
  // Count unread messages from this employee
  const { user } = useAppStore();
  const unreadCount = messages.filter(
    msg => msg.sender_id === employee.employee_id && 
           msg.recipient_id === user?.id && 
           !msg.is_read
  ).length;

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
              {employee.employee_phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {employee.employee_phone}
                </p>
              )}
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
                <DropdownMenuItem 
                  onClick={() => handleContact('phone')}
                  disabled={!employee.employee_phone}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Llamar
                  {!employee.employee_phone && <span className="ml-auto text-xs text-muted-foreground">No disponible</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleContact('message')}
                  disabled={!employee.employee_phone}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Mensaje
                  {!employee.employee_phone && <span className="ml-auto text-xs text-muted-foreground">No disponible</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowMessageDialog(true);
                }}>
                  <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                  Mensaje interno
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">{unreadCount}</Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
              {employee.mood_level !== null ? (
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{getMoodEmoji(employee.mood_level)}</span>
                  <span className="text-sm font-medium">{employee.mood_level}/10</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin datos</span>
              )}
            </div>
            <Progress 
              value={employee.mood_level !== null ? employee.mood_level * 10 : 0} 
              className="h-2"
            />
          </div>

          {/* Therapy Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-cyan" />
                <span className="text-sm text-muted-foreground">Progreso terapéutico</span>
              </div>
              <span className="text-sm font-medium">{employee.therapy_progress ?? 0}%</span>
            </div>
            <Progress 
              value={employee.therapy_progress ?? 0} 
              className="h-2"
            />
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="pt-3 border-t border-border/20 space-y-2">
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between py-1">
                  <span>Último check-in:</span>
                  <span>{lastCheckInDate ? lastCheckInDate.toLocaleDateString('es-ES') : 'Sin registro'}</span>
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
      
      <MessageDialog
        isOpen={showMessageDialog}
        onClose={() => setShowMessageDialog(false)}
        recipientId={employee.employee_id}
        recipientName={employee.employee_name}
      />
    </Card>
  );
}