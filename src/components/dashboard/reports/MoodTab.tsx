import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { TrendingDown, TrendingUp } from "lucide-react";

export function MoodTab({ employees }: { employees: any[] }) {
  const [moodEvolution, setMoodEvolution] = useState<any[]>([]);
  const [moodDistribution, setMoodDistribution] = useState<any[]>([]);
  const [employeeMoods, setEmployeeMoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoodData();
  }, []);

  const fetchMoodData = async () => {
    try {
      // Fetch mood check-ins from last 30 days
      const { data: checkIns } = await supabase
        .from('mood_check_ins')
        .select('mood_level, created_at, employee_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (checkIns) {
        // Evolution by day
        const grouped: { [key: string]: number[] } = {};
        checkIns.forEach(ci => {
          const date = new Date(ci.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(ci.mood_level);
        });
        const evolution = Object.entries(grouped).map(([date, moods]) => ({
          date,
          mood: (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1)
        }));
        setMoodEvolution(evolution);

        // Distribution
        const dist = Array.from({ length: 10 }, (_, i) => ({
          level: i + 1,
          count: checkIns.filter(ci => ci.mood_level === i + 1).length
        }));
        setMoodDistribution(dist);

        // Per employee
        const empMoods: { [key: string]: number[] } = {};
        checkIns.forEach(ci => {
          if (!empMoods[ci.employee_id]) empMoods[ci.employee_id] = [];
          empMoods[ci.employee_id].push(ci.mood_level);
        });
        const empData = Object.entries(empMoods).map(([id, moods]) => {
          const emp = employees.find(e => e.employee_id === id);
          const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
          const recent = moods.slice(-3);
          const older = moods.slice(0, -3);
          const trend = recent.length && older.length 
            ? (recent.reduce((a, b) => a + b, 0) / recent.length) - (older.reduce((a, b) => a + b, 0) / older.length)
            : 0;
          return {
            employee_id: id,
            full_name: emp?.full_name || 'Desconocido',
            email: emp?.email || '',
            avg: avg.toFixed(1),
            count: moods.length,
            trend
          };
        }).sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg));
        setEmployeeMoods(empData);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Ánimo Promedio - 30 días</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={moodEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="mood" name="Ánimo Promedio" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Check-ins por Nivel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moodDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Check-ins" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Ánimo por Empleada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employeeMoods.map((emp) => (
              <div key={emp.employee_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="font-medium">{emp.full_name}</div>
                  <div className="text-sm text-muted-foreground">{emp.email}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Check-ins</div>
                    <div className="font-medium">{emp.count}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={parseFloat(emp.avg) < 5 ? "destructive" : parseFloat(emp.avg) < 7 ? "outline" : "secondary"}>
                      Promedio: {emp.avg}
                    </Badge>
                    {emp.trend !== 0 && (
                      <Badge variant={emp.trend < 0 ? "destructive" : "secondary"} className="gap-1">
                        {emp.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {Math.abs(emp.trend).toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
