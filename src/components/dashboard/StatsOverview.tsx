import { 
  Users, 
  AlertTriangle, 
  Activity, 
  Heart,
  TrendingUp,
  Wifi,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { EmployeeStatus, EmergencyAlert } from "@/store/useAppStore";

interface StatsOverviewProps {
  employees: EmployeeStatus[];
  alerts: EmergencyAlert[];
}

export function StatsOverview({ employees, alerts }: StatsOverviewProps) {
  const totalEmployees = employees.length;
  const onlineEmployees = employees.filter(e => e.is_online).length;
  const activeAlerts = alerts.filter(a => !a.is_resolved).length;
  const employeesWithAlerts = employees.filter(e => e.emergency_alert).length;
  
  const averageMood = employees.length > 0 
    ? employees.reduce((sum, e) => sum + e.mood_level, 0) / employees.length
    : 0;
  
  const averageProgress = employees.length > 0 
    ? employees.reduce((sum, e) => sum + e.therapy_progress, 0) / employees.length
    : 0;

  const getMoodColor = (mood: number) => {
    if (mood <= 4) return "warning";
    if (mood <= 6) return "coral";
    return "safe";
  };

  const stats = [
    {
      title: "Total Empleadas",
      value: totalEmployees,
      icon: Users,
      description: `${onlineEmployees} conectadas`,
      color: "primary",
      progress: totalEmployees > 0 ? (onlineEmployees / totalEmployees) * 100 : 0
    },
    {
      title: "Alertas Activas", 
      value: activeAlerts,
      icon: AlertTriangle,
      description: `${employeesWithAlerts} empleadas afectadas`,
      color: activeAlerts > 0 ? "destructive" : "safe",
      urgent: activeAlerts > 0
    },
    {
      title: "Estado de Ánimo Promedio",
      value: `${averageMood.toFixed(1)}/10`,
      icon: Heart,
      description: "Últimas 24 horas",
      color: getMoodColor(averageMood),
      progress: averageMood * 10
    },
    {
      title: "Progreso Terapéutico",
      value: `${averageProgress.toFixed(0)}%`,
      icon: TrendingUp,
      description: "Progreso general",
      color: "cyan",
      progress: averageProgress
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card 
            key={index}
            className={`relative overflow-hidden ${
              stat.urgent ? 'border-destructive/40 shadow-emergency' : ''
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
                  <Icon 
                    className={`h-4 w-4 text-${stat.color} ${
                      stat.urgent ? 'animate-pulse' : ''
                    }`} 
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  {stat.urgent && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      Urgente
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                
                {stat.progress !== undefined && (
                  <div className="pt-2">
                    <Progress 
                      value={stat.progress} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>

            {/* Decorative gradient background */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-${stat.color}/10 to-transparent rounded-full -translate-y-8 translate-x-8`} />
          </Card>
        );
      })}
    </div>
  );
}