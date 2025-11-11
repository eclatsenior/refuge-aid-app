import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function TrainingTab({ employees }: { employees: any[] }) {
  const { t } = useTranslation('dashboard');
  const [routes, setRoutes] = useState<any[]>([]);
  const [videoProgress, setVideoProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      // Fetch all therapy routes
      const { data: videosData } = await supabase
        .from('therapy_videos')
        .select('*')
        .order('route_id', { ascending: true });

      // Fetch all video progress
      const { data: progressData } = await supabase
        .from('video_progress')
        .select('*');

      if (videosData) {
        // Group videos by route
        const routesMap: { [key: string]: any[] } = {};
        videosData.forEach(video => {
          if (!routesMap[video.route_id]) {
            routesMap[video.route_id] = [];
          }
          routesMap[video.route_id].push(video);
        });

        const routesArray = Object.entries(routesMap).map(([route_id, videos]) => ({
          route_id,
          videos,
          total_videos: videos.length
        }));

        setRoutes(routesArray);
      }

      if (progressData) {
        setVideoProgress(progressData);
      }
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRouteProgress = (routeId: string) => {
    const route = routes.find(r => r.route_id === routeId);
    if (!route) return { completed: 0, total: 0, percentage: 0 };

    const routeVideos = route.videos;
    const completedVideos = videoProgress.filter(p => p.route_id === routeId);
    const uniqueCompletions = new Set(completedVideos.map(p => p.video_id)).size;

    return {
      completed: uniqueCompletions,
      total: routeVideos.length,
      percentage: routeVideos.length > 0 ? (uniqueCompletions / routeVideos.length) * 100 : 0
    };
  };

  const getEmployeeProgress = (employeeId: string) => {
    const employeeCompletions = videoProgress.filter(p => p.employee_id === employeeId);
    const totalVideos = routes.reduce((sum, r) => sum + r.total_videos, 0);
    const uniqueCompletions = new Set(employeeCompletions.map(p => p.video_id)).size;

    return {
      completed: uniqueCompletions,
      total: totalVideos,
      percentage: totalVideos > 0 ? (uniqueCompletions / totalVideos) * 100 : 0
    };
  };

  if (loading) return <LoadingSpinner />;

  const totalVideos = routes.reduce((sum, r) => sum + r.total_videos, 0);
  const employeesWithProgress = employees.filter(e => 
    videoProgress.some(p => p.employee_id === e.employee_id)
  ).length;
  const employeesCompleted = employees.filter(e => {
    const progress = getEmployeeProgress(e.employee_id);
    return progress.percentage === 100;
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('training.totalModules')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{routes.length}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {totalVideos} {t('training.totalVideos')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('training.employeesWithProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employeesWithProgress}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t('training.ofTotal', { total: employees.length })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('training.employeesCompleted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employeesCompleted}</div>
            <div className="text-sm text-green-500 mt-1 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              {((employeesCompleted / Math.max(employees.length, 1)) * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{t('training.moduleProgress')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routes.map(route => {
              const progress = getRouteProgress(route.route_id);
              return (
                <div key={route.route_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{route.route_id.replace(/_/g, ' ')}</div>
                      <Badge variant="outline">
                        {progress.completed}/{progress.total} {t('training.videos')}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium">
                      {progress.percentage.toFixed(0)}%
                    </div>
                  </div>
                  <Progress value={progress.percentage} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Employee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('training.employeeProgress')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employees.map(emp => {
              const progress = getEmployeeProgress(emp.employee_id);
              return (
                <div key={emp.employee_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="font-medium">{emp.full_name}</div>
                    <div className="text-sm text-muted-foreground">{emp.email}</div>
                    <div className="mt-2">
                      <Progress value={progress.percentage} className="h-2" />
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <div className="text-sm">
                      {progress.completed}/{progress.total}
                    </div>
                    <Badge 
                      variant={progress.percentage === 100 ? "default" : progress.percentage > 0 ? "outline" : "secondary"}
                    >
                      {progress.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
