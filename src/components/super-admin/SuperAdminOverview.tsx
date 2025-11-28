import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, CreditCard, AlertTriangle, Activity, TrendingUp, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface OverviewData {
  totalUsers: number;
  totalEmployees: number;
  totalLeads: number;
  activeSubscriptions: number;
  totalAlerts: number;
  unresolvedAlerts: number;
  activeSessionsToday: number;
  recentSignups: number;
  avgMood: number | null;
}

export function SuperAdminOverview() {
  const { t } = useTranslation('superAdmin');
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_overview' }
      });

      if (error) throw error;
      setData(result);
    } catch (err: any) {
      console.error('Error loading overview:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>{t('errorLoading')}: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      title: t('stats.totalUsers'),
      value: data.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: t('stats.employees'),
      value: data.totalEmployees,
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('stats.refugiLeads'),
      value: data.totalLeads,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: t('stats.activeSubscriptions'),
      value: data.activeSubscriptions,
      icon: CreditCard,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: t('stats.totalAlerts'),
      value: data.totalAlerts,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: t('stats.unresolvedAlerts'),
      value: data.unresolvedAlerts,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: t('stats.sessionsToday'),
      value: data.activeSessionsToday,
      icon: Activity,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      subtitle: t('stats.last24h'),
    },
    {
      title: t('stats.recentSignups'),
      value: data.recentSignups,
      icon: TrendingUp,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      subtitle: t('stats.last30days'),
    },
    {
      title: t('stats.avgMood'),
      value: data.avgMood !== null ? data.avgMood.toFixed(1) : '-',
      icon: Smile,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      subtitle: t('stats.last24h'),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
