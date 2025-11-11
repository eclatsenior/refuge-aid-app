import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function RiskAnalysisTab({ employees }: { employees: any[] }) {
  const { t, i18n } = useTranslation('dashboard');
  const [riskEvolution, setRiskEvolution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskEvolution();
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assignments } = await supabase
        .from('employee_assignments')
        .select('employee_id')
        .eq('refugi_lead_id', user.id);
      
      const assignedEmployeeIds = assignments?.map(a => a.employee_id) || [];

      const { data } = await supabase
        .from('app_sessions')
        .select('started_at, employee_id')
        .in('employee_id', assignedEmployeeIds)
        .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (data) {
        const grouped: { [key: string]: Set<string> } = {};
        data.forEach(item => {
          const date = new Date(item.started_at).toLocaleDateString(i18n.language, { 
            month: 'short', 
            day: 'numeric' 
          });
          if (!grouped[date]) grouped[date] = new Set();
          grouped[date].add(item.employee_id);
        });
        
        const activityData = Object.entries(grouped).map(([date, employeeSet]) => ({
          date,
          activity: employeeSet.size
        }));
        
        setRiskEvolution(prev => {
          const merged = [...prev];
          activityData.forEach(act => {
            const existing = merged.find(r => r.date === act.date);
            if (existing) {
              existing.activity = act.activity;
            }
          });
          return merged;
        });
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
    }
  };

  const fetchRiskEvolution = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assignments } = await supabase
        .from('employee_assignments')
        .select('employee_id')
        .eq('refugi_lead_id', user.id);
      
      const assignedEmployeeIds = assignments?.map(a => a.employee_id) || [];

      const { data } = await supabase
        .from('risk_scores')
        .select('score_int, calculated_at, employee_id')
        .in('employee_id', assignedEmployeeIds)
        .gte('calculated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('calculated_at', { ascending: true });

      if (data) {
        const grouped: { [key: string]: number[] } = {};
        data.forEach(item => {
          const date = new Date(item.calculated_at).toLocaleDateString(i18n.language, { 
            month: 'short', 
            day: 'numeric' 
          });
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(item.score_int);
        });
        const evolution = Object.entries(grouped).map(([date, scores]) => ({
          date,
          avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        }));
        setRiskEvolution(evolution);
      }
    } finally {
      setLoading(false);
    }
  };

  // Solo contar empleados con risk_score definido
  const employeesWithRisk = employees.filter(e => typeof e.risk_score === 'number');
  
  const riskDistribution = [
    { name: t('risk.levels.low'), value: employeesWithRisk.filter(e => e.risk_score < 31).length, fill: 'hsl(var(--chart-2))' },
    { name: t('risk.levels.medium'), value: employeesWithRisk.filter(e => e.risk_score >= 31 && e.risk_score <= 60).length, fill: 'hsl(var(--chart-3))' },
    { name: t('risk.levels.high'), value: employeesWithRisk.filter(e => e.risk_score > 60).length, fill: 'hsl(var(--chart-1))' },
  ];

  // Risk factors analysis
  const riskFactors: { [key: string]: number } = {};
  employeesWithRisk.forEach(emp => {
    emp.risk_chips?.forEach((chip: string) => {
      riskFactors[chip] = (riskFactors[chip] || 0) + 1;
    });
  });
  const topFactors = Object.entries(riskFactors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([chip, count]) => ({ chip, count }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  // Si no hay datos de riesgo, mostrar estado vacío
  const hasRiskData = employeesWithRisk.length > 0 || riskEvolution.length > 0;
  if (!hasRiskData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-muted-foreground space-y-2">
            <p className="text-lg font-medium">{t('reporting.noData')}</p>
            <p className="text-sm">{t('reporting.noActivity')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        {employeesWithRisk.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('risk.distributionTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Risk Factors */}
        {topFactors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('risk.topFactorsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <Badge variant="outline">{factor.chip}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {factor.count} {t('risk.employees')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Risk Evolution */}
      {riskEvolution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('risk.evolutionTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="hsl(var(--chart-1))" 
                  name={t('risk.scoreAverage')}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="activity" 
                  stroke="hsl(var(--chart-2))" 
                  name={t('risk.activityLevel')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Employee Risk List */}
      {employeesWithRisk.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('risk.employeeDetailTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeesWithRisk
                .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
                .map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex-1">
                      <p className="font-medium">{emp.full_name}</p>
                      <p className="text-sm text-muted-foreground">{emp.email}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {emp.risk_chips?.map((chip: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {chip}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        emp.risk_score > 60 ? 'destructive' : 
                        emp.risk_score > 30 ? 'default' : 
                        'secondary'
                      }
                      className="ml-4"
                    >
                      {emp.risk_score}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}