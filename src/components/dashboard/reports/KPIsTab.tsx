import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KPIData {
  active_risk: { score: number; trend_7d: number; trend_30d: number };
  incidents_today: number;
  incidents_week: number;
  incidents_open: number;
  incidents_in_progress: number;
  incidents_closed: number;
  avg_mood: number;
  checkins_count: number;
  training_completion: number;
}

export function KPIsTab({ employees }: { employees: any[] }) {
  const { t, i18n } = useTranslation('dashboard');
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [riskTrend, setRiskTrend] = useState<any[]>([]);
  const [incidentsTrend, setIncidentsTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch KPIs
      const { data: kpiData } = await supabase.functions.invoke('dashboard-kpis');
      if (kpiData) setKpis(kpiData);

      // Fetch risk trend (last 30 days)
      const { data: riskData } = await supabase
        .from('risk_scores')
        .select('score_int, calculated_at')
        .gte('calculated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('calculated_at', { ascending: true });

      if (riskData) {
        const aggregated = aggregateByDay(riskData, 'calculated_at', 'score_int');
        setRiskTrend(aggregated);
      }

      // Fetch incidents trend (last 4 weeks)
      const { data: incidentData } = await supabase
        .from('incidents')
        .select('opened_at')
        .gte('opened_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString());

      if (incidentData) {
        const byWeek = aggregateByWeek(incidentData, 'opened_at');
        setIncidentsTrend(byWeek);
      }
    } finally {
      setLoading(false);
    }
  };

  const aggregateByDay = (data: any[], dateField: string, valueField: string) => {
    const grouped: { [key: string]: number[] } = {};
    data.forEach(item => {
      const day = new Date(item[dateField]).toLocaleDateString(i18n.language, { 
        month: 'short', 
        day: 'numeric' 
      });
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(item[valueField]);
    });
    return Object.entries(grouped).map(([day, values]) => ({
      day,
      value: Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    }));
  };

  const aggregateByWeek = (data: any[], dateField: string) => {
    const weeks = [
      t('kpisTabs.weeks.week1'),
      t('kpisTabs.weeks.week2'),
      t('kpisTabs.weeks.week3'),
      t('kpisTabs.weeks.week4')
    ];
    const counts = [0, 0, 0, 0];
    data.forEach(item => {
      const daysAgo = Math.floor((Date.now() - new Date(item[dateField]).getTime()) / (24 * 60 * 60 * 1000));
      const weekIndex = Math.min(Math.floor(daysAgo / 7), 3);
      counts[3 - weekIndex]++;
    });
    return weeks.map((week, i) => ({ week, count: counts[i] }));
  };

  const topRiskEmployees = employees
    .filter(e => e.risk_score)
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('kpisTabs.riskActive')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.active_risk.score.toFixed(0) || 0}</div>
            <div className="flex items-center mt-2 text-sm">
              {(kpis?.active_risk.trend_7d || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-destructive mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span className={`${(kpis?.active_risk.trend_7d || 0) >= 0 ? 'text-destructive' : 'text-green-500'}`}>
                {Math.abs(kpis?.active_risk.trend_7d || 0).toFixed(1)}% {t('kpisTabs.vsPreviousWeek')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('kpisTabs.incidentsWeek')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.incidents_week || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="destructive">{kpis?.incidents_open || 0} {t('kpisTabs.open')}</Badge>
              <Badge variant="outline">{kpis?.incidents_in_progress || 0} {t('kpisTabs.inProgress')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('kpisTabs.averageMood')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.avg_mood.toFixed(1) || 0}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {kpis?.checkins_count || 0} {t('kpisTabs.checkInsThisWeek')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('kpisTabs.training')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.training_completion.toFixed(0) || 0}%</div>
            <div className="flex items-center mt-2 text-sm text-green-500">
              <CheckCircle className="h-4 w-4 mr-1" />
              {t('kpisTabs.completed')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('kpisTabs.riskTrendTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={riskTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name={t('kpisTabs.scoreAverage')} stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('kpisTabs.incidentsPerWeek')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incidentsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name={t('kpisTabs.incidents')} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Risk Employees */}
      <Card>
        <CardHeader>
          <CardTitle>{t('kpisTabs.topRiskEmployees')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRiskEmployees.map((emp, idx) => (
              <div key={emp.employee_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium">{emp.full_name}</div>
                    <div className="text-sm text-muted-foreground">{emp.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {emp.risk_chips?.map((chip: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{chip}</Badge>
                  ))}
                  <Badge variant="destructive" className="ml-2">{emp.risk_score}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
