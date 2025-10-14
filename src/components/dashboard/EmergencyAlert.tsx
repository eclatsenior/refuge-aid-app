import { useState } from "react";
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  CheckCircle,
  User,
  Calendar,
  MoreVertical,
  PhoneCall
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EmergencyAlert as EmergencyAlertType } from "@/store/useAppStore";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { useNativeFeatures } from "@/hooks/useNativeFeatures";

interface EmergencyAlertProps {
  alert: EmergencyAlertType;
}

export function EmergencyAlert({ alert }: EmergencyAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  
  const { resolveAlert, assignedEmployees } = useAppStore();
  const { toast } = useToast();
  const { openExternalApp } = useNativeFeatures();
  
  // Get employee phone from assigned employees
  const employee = assignedEmployees.find(emp => emp.employee_id === alert.employee_id);
  const employeePhone = employee?.employee_phone;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const alertDate = new Date(alert.created_at);
  const timeAgo = formatDistanceToNow(alertDate, {
    addSuffix: true,
    locale: es
  });

  const handleCall = () => {
    if (!employeePhone) {
      toast({
        title: "Teléfono no disponible",
        description: `${alert.employee_name} no tiene teléfono registrado`,
        variant: "destructive"
      });
      return;
    }
    
    const telUrl = `tel:${employeePhone}`;
    openExternalApp(telUrl);
    
    toast({
      title: "Llamando...",
      description: `Iniciando llamada a ${alert.employee_name}`
    });
  };

  const handleMessage = () => {
    if (!employeePhone) {
      toast({
        title: "Teléfono no disponible",
        description: `${alert.employee_name} no tiene teléfono registrado`,
        variant: "destructive"
      });
      return;
    }
    
    const message = encodeURIComponent(`Hola ${alert.employee_name.split(' ')[0]}, vi tu alerta de emergencia. ¿Estás bien? ¿Necesitas ayuda?`);
    const smsUrl = `sms:${employeePhone}?body=${message}`;
    openExternalApp(smsUrl);
    
    toast({
      title: "Abriendo mensajes...",
      description: `Enviando mensaje a ${alert.employee_name}`
    });
  };

  const handleWhatsApp = () => {
    if (!employeePhone) {
      toast({
        title: "Teléfono no disponible",
        description: `${alert.employee_name} no tiene teléfono registrado`,
        variant: "destructive"
      });
      return;
    }
    
    const cleanPhone = employeePhone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${alert.employee_name.split(' ')[0]}, vi tu alerta de emergencia. ¿Estás bien? ¿Necesitas ayuda?`);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    openExternalApp(whatsappUrl);
    
    toast({
      title: "Abriendo WhatsApp...",
      description: `Contactando a ${alert.employee_name}`
    });
  };

  const handleCall112 = () => {
    const telUrl = 'tel:112';
    openExternalApp(telUrl);
    
    toast({
      title: "Llamando a emergencias",
      description: "Iniciando llamada al 112"
    });
  };

  const handleViewLocation = () => {
    if (alert.location_data) {
      const { latitude, longitude } = alert.location_data;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      openExternalApp(mapsUrl);
      
      toast({
        title: "Abriendo ubicación",
        description: "Visualizando en Google Maps"
      });
    } else {
      toast({
        title: "Ubicación no disponible",
        description: "Esta alerta no tiene datos de ubicación",
        variant: "destructive"
      });
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast({
        title: "Notas requeridas",
        description: "Por favor añade notas sobre la resolución de la alerta",
        variant: "destructive"
      });
      return;
    }

    setIsResolving(true);
    try {
      await resolveAlert(alert.id);
      toast({
        title: "Alerta resuelta",
        description: `La alerta de ${alert.employee_name} ha sido marcada como resuelta`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo resolver la alerta",
        variant: "destructive"
      });
    } finally {
      setIsResolving(false);
      setIsExpanded(false);
    }
  };

  return (
    <Card className="border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
              </div>
              
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-destructive/20 text-destructive text-xs font-medium">
                    {getInitials(alert.employee_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {alert.employee_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {alert.alert_type}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Badge variant="destructive" className="text-xs">
                Activa
              </Badge>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {timeAgo}
              </div>
            </div>
          </div>

          {/* Alert Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {alertDate.toLocaleString('es-ES')}
                </span>
              </div>
              
              {alert.location_data && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ubicación disponible</span>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {alert.message && (
            <div className="p-3 rounded-md bg-background/50 border border-border/20">
              <p className="text-sm text-foreground">{alert.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-destructive/30 hover:bg-destructive/10"
                >
                  <MoreVertical className="h-4 w-4 mr-2" />
                  Acciones
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem 
                  onClick={handleCall}
                  disabled={!employeePhone}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar empleada
                  {!employeePhone && <span className="ml-auto text-xs text-muted-foreground">No disponible</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleMessage}
                  disabled={!employeePhone}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar SMS
                  {!employeePhone && <span className="ml-auto text-xs text-muted-foreground">No disponible</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleWhatsApp}
                  disabled={!employeePhone}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                  {!employeePhone && <span className="ml-auto text-xs text-muted-foreground">No disponible</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCall112}>
                  <PhoneCall className="h-4 w-4 mr-2 text-destructive" />
                  Llamar al 112
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleViewLocation}
                  disabled={!alert.location_data}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver ubicación
                  {!alert.location_data && <span className="ml-auto text-xs text-muted-foreground">No disponible</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              size="sm" 
              variant="default"
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isExpanded ? 'Cancelar' : 'Resolver'}
            </Button>
          </div>

          {/* Resolution Form */}
          {isExpanded && (
            <div className="pt-3 border-t border-border/20 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="resolution-notes">Notas de resolución</Label>
                <Textarea
                  id="resolution-notes"
                  placeholder="Describe las acciones tomadas para resolver esta alerta..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="bg-background"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleResolve}
                  disabled={isResolving}
                  className="bg-safe hover:bg-safe/90"
                >
                  {isResolving ? "Resolviendo..." : "Marcar como resuelta"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsExpanded(false);
                    setResolutionNotes("");
                  }}
                  disabled={isResolving}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}