import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function RiskAnalysisTab({ employees }: { employees: any[] }) {
  const [riskEvolution, setRiskEvolution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskEvolution();
  }, []);

  const fetchRiskEvolution = async () => {
    try {
      const { data } = await supabase
        .from('risk_scores')
        .select('score_int, calculated_at')
        .gte('calculated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('calculated_at', { ascending: true });

      if (data) {
        const grouped: { [key: string]: number[] } = {};
        data.forEach(item => {
          const date = new Date(item.calculated_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(item.score_int);
        });
        const evolution = Object.entries(grouped).map(([date, scores]) => ({
          date,
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        }));
        setRiskEvolution(evolution);
      }
    } finally {
      setLoading(false);
    }
  };

  // Distribution of risk levels
  const riskDistribution = [
    { name: 'Bajo (0-30)', value: employees.filter(e => (e.risk_score || 0) <= 30).length, color: '#22c55e' },
    { name: 'Medio (31-60)', value: employees.filter(e => (e.risk_score || 0) > 30 && (e.risk_score || 0) <= 60).length, color: '#f59e0b' },
    { name: 'Alto (61-100)', value: employees.filter(e => (e.risk_score || 0) > 60).length, color: '#ef4444' }
  ];

  // Risk factors analysis
  const riskFactors: { [key: string]: number } = {};
  employees.forEach(emp => {
    emp.risk_chips?.forEach((chip: string) => {
      riskFactors[chip] = (riskFactors[chip] || 0) + 1;
    });
  });
  const topFactors = Object.entries(riskFactors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Risk Factors */}
        <Card>
          <CardHeader>
            <CardTitle>Principales Factores de Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topFactors.map(([factor, count], idx) => (
                <div key={factor} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center font-bold text-destructive">
                      {idx + 1}
                    </div>
                    <span className="font-medium">{factor}</span>
                  </div>
                  <Badge variant="destructive">{count} empleadas</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Evolution */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Riesgo Promedio - 30 días</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={riskEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" name="Score Promedio" stroke="hsl(var(--destructive))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Employee Risk List */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Empleada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employees
              .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
              .map((emp) => (
                <div key={emp.employee_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{emp.full_name}</div>
                    <div className="text-sm text-muted-foreground">{emp.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {emp.risk_chips?.map((chip: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{chip}</Badge>
                    ))}
                    <Badge 
                      variant={(emp.risk_score || 0) > 60 ? "destructive" : (emp.risk_score || 0) > 30 ? "outline" : "secondary"}
                      className="ml-2 min-w-[60px] justify-center"
                    >
                      {emp.risk_score || 0}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
