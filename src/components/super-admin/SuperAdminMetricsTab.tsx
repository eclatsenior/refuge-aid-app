import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays, parseISO, startOfDay } from 'date-fns';

interface MetricsData {
  dailySessions: Array<{ started_at: string }>;
  dailyMoodCheckins: Array<{ created_at: string; mood_level: number }>;
  dailyAlerts: Array<{ created_at: string }>;
  videoProgress: Array<{ completed_at: string }>;
}

export function SuperAdminMetricsTab() {
  const { t } = useTranslation('superAdmin');
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_metrics' }
      });

      if (error) throw error;
      setData(result);
    } catch (err: any) {
      console.error('Error loading metrics:', err);
      toast.error(t('errorLoadingMetrics'));
    } finally {
      setLoading(false);
    }
  };

  const processDataByDay = (items: Array<{ [key: string]: any }>, dateField: string) => {
    const days: Record<string, number> = {};
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      days[date] = 0;
    }

    // Count items per day
    items?.forEach(item => {
      const date = format(parseISO(item[dateField]), 'yyyy-MM-dd');
      if (days[date] !== undefined) {
        days[date]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({
      date: format(parseISO(date), 'dd/MM'),
      count
    }));
  };

  const processMoodByDay = (items: Array<{ created_at: string; mood_level: number }>) => {
    const days: Record<string, { sum: number; count: number }> = {};
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      days[date] = { sum: 0, count: 0 };
    }

    // Sum moods per day
    items?.forEach(item => {
      const date = format(parseISO(item.created_at), 'yyyy-MM-dd');
      if (days[date]) {
        days[date].sum += item.mood_level;
        days[date].count++;
      }
    });

    return Object.entries(days).map(([date, { sum, count }]) => ({
      date: format(parseISO(date), 'dd/MM'),
      avgMood: count > 0 ? Number((sum / count).toFixed(1)) : null
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) return null;

  const sessionsData = processDataByDay(data.dailySessions, 'started_at');
  const alertsData = processDataByDay(data.dailyAlerts, 'created_at');
  const videoData = processDataByDay(data.videoProgress, 'completed_at');
  const moodData = processMoodByDay(data.dailyMoodCheckins);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Sessions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('metrics.sessionsPerDay')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Mood Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('metrics.avgMoodPerDay')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[1, 5]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgMood" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('metrics.alertsPerDay')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Video Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('metrics.videosCompletedPerDay')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={videoData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
