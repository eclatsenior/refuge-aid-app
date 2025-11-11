import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const COURSES = [
  { code: 'VG_101', name: 'training.courses.VG_101' },
  { code: 'ACOSO_PREV', name: 'training.courses.ACOSO_PREV' }
];

export function TrainingTab({ employees }: { employees: any[] }) {
  const { t } = useTranslation('dashboard');
  const [completions, setCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletions();
  }, []);

  const fetchCompletions = async () => {
    try {
      const { data } = await supabase
        .from('training_completions')
        .select('employee_id, course_code, completed_at');

      setCompletions(data || []);
    } finally {
      setLoading(false);
    }
  };

  const getCourseStats = (courseCode: string) => {
    const completed = completions.filter(c => c.course_code === courseCode).length;
    const total = employees.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, percentage };
  };

  const getEmployeeCompletions = (empId: string) => {
    return completions.filter(c => c.employee_id === empId).map(c => c.course_code);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Course Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {COURSES.map(course => {
          const stats = getCourseStats(course.code);
          return (
            <Card key={course.code}>
              <CardHeader>
                <CardTitle>{t(course.name)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('training.progress')}</span>
                  <span className="text-2xl font-bold">{stats.percentage.toFixed(0)}%</span>
                </div>
                <Progress value={stats.percentage} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {stats.completed} {t('training.completed').split(' ')[0]} {stats.total} {t('training.completed')}
                  </span>
                  <Badge variant={stats.percentage === 100 ? "secondary" : "outline"}>
                    {stats.total - stats.completed} {t('training.pending')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('training.generalStats')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">{t('training.totalEmployees')}</div>
              <div className="text-2xl font-bold">{employees.length}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">{t('training.allTrainings')}</div>
              <div className="text-2xl font-bold text-green-600">
                {employees.filter(emp => {
                  const empCompletions = getEmployeeCompletions(emp.employee_id);
                  return COURSES.every(c => empCompletions.includes(c.code));
                }).length}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">{t('training.noTraining')}</div>
              <div className="text-2xl font-bold text-destructive">
                {employees.filter(emp => {
                  const empCompletions = getEmployeeCompletions(emp.employee_id);
                  return empCompletions.length === 0;
                }).length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('training.detailPerEmployee')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employees.map((emp) => {
              const empCompletions = getEmployeeCompletions(emp.employee_id);
              const allComplete = COURSES.every(c => empCompletions.includes(c.code));
              return (
                <div key={emp.employee_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="font-medium">{emp.full_name}</div>
                    <div className="text-sm text-muted-foreground">{emp.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {COURSES.map(course => (
                      <div key={course.code} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{course.code}</span>
                        {empCompletions.includes(course.code) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                    <Badge variant={allComplete ? "secondary" : "destructive"} className="ml-2">
                      {empCompletions.length}/{COURSES.length}
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
