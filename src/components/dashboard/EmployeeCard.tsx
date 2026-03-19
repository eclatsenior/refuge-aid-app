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
  MessageCircle,
  Edit,
  Trash2
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
import { getDateFnsLocale } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { MessageDialog } from "@/components/messaging/MessageDialog";
import { EditEmployeeDialog } from "@/components/dashboard/EditEmployeeDialog";
import { DeleteEmployeeDialog } from "@/components/dashboard/DeleteEmployeeDialog";
import { useTranslation } from "react-i18next";

interface EmployeeCardProps {
  employee: EmployeeStatus;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const { t, i18n } = useTranslation(['dashboard', 'employees']);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    if (employee.emergency_alert) return t('employeeCard.emergency');
    if (!employee.is_online) return t('employeeCard.disconnected');
    if (employee.mood_level !== null && employee.mood_level <= 4) return t('employeeCard.needsAttention');
    if (employee.mood_level !== null) return t('employeeCard.well');
    return t('employeeCard.noData');
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
        title: t('employeeCard.contactingEmployee'),
        description: t('emergencyAlerts.phoneUnavailableDesc', { name: employee.employee_name }),
        variant: "destructive"
      });
      return;
    }

    if (method === 'phone') {
      window.open(`tel:${employee.employee_phone}`, '_system');
    } else {
      const message = encodeURIComponent(t('emergencyAlerts.emergencyMessage', { name: employee.employee_name.split(' ')[0] }));
      window.open(`sms:${employee.employee_phone}?body=${message}`, '_system');
    }
    
    toast({
      title: t('employeeCard.contactingEmployee'),
      description: t('employeeCard.initiatingWith', { method: method === 'phone' ? t('employeeCard.call') : t('employeeCard.message'), name: employee.employee_name })
    });
  };

  const handleMarkFollowUp = () => {
    toast({
      title: t('employeeCard.followUpMarked'),
      description: t('employeeCard.followUpMarkedDesc', { name: employee.employee_name })
    });
  };

  const lastCheckInDate = employee.last_check_in ? new Date(employee.last_check_in) : null;
  const timeSinceLastCheckIn = lastCheckInDate 
    ? formatDistanceToNow(lastCheckInDate, { addSuffix: true, locale: getDateFnsLocale(i18n.language) })
    : t('employeeCard.noRecord');
  
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
                  onClick={() => handleContact('message')}
                  disabled={!employee.employee_phone}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('employeeCard.message')}
                  {!employee.employee_phone && <span className="ml-auto text-xs text-muted-foreground">{t('emergencyAlerts.notAvailable')}</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowMessageDialog(true);
                }}>
                  <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                  {t('emergencyAlerts.internalMessage')}
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">{unreadCount}</Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleMarkFollowUp}>
                  <Clock className="mr-2 h-4 w-4" />
                  {t('employeeCard.markFollowUp')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowEditDialog(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('employees:card.actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('employees:card.actions.delete')}
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
                {t('employeeCard.activeEmergencyAlert')}
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
                  <span className="text-muted-foreground">{t('employeeCard.online')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('employeeCard.disconnected')}</span>
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
                <span className="text-sm text-muted-foreground">{t('employeeCard.moodState')}</span>
              </div>
              {employee.mood_level !== null ? (
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{getMoodEmoji(employee.mood_level)}</span>
                  <span className="text-sm font-medium">{employee.mood_level}/10</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">{t('employeeCard.noData')}</span>
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
                <span className="text-sm text-muted-foreground">{t('employeeCard.therapeuticProgress')}</span>
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
                  <span>{t('employeeCard.lastCheckIn')}</span>
                  <span>{lastCheckInDate ? lastCheckInDate.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : i18n.language === 'ca' ? 'ca-ES' : i18n.language === 'ar' ? 'ar-SA' : 'en-US') : t('employeeCard.noRecord')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{t('employeeCard.timeOnlineToday')}</span>
                  <span>{employee.is_online ? '2h 15m' : '0m'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{t('employeeCard.alertsThisWeek')}</span>
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
      
      <EditEmployeeDialog
        employee={employee}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onEmployeeUpdated={() => {
          toast({
            title: t('employees:notifications.updated'),
            description: t('employees:notifications.updatedDesc', { name: employee.employee_name })
          });
        }}
      />

      <DeleteEmployeeDialog
        employee={employee}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onEmployeeDeleted={() => {
          toast({
            title: t('employees:notifications.deleted'),
            description: t('employees:notifications.deletedDesc', { name: employee.employee_name })
          });
        }}
      />
    </Card>
  );
}