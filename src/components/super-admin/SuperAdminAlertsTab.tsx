import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Alert {
  id: string;
  employee_id: string;
  alert_type: string;
  message: string | null;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  profiles: {
    full_name: string;
    email: string;
  };
}

export function SuperAdminAlertsTab() {
  const { t } = useTranslation('superAdmin');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedFilter, setResolvedFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadAlerts();
  }, [page, resolvedFilter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { 
          action: 'get_alerts',
          page,
          limit,
          resolved: resolvedFilter === 'all' ? undefined : resolvedFilter === 'resolved'
        }
      });

      if (error) throw error;
      setAlerts(data.alerts || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Error loading alerts:', err);
      toast.error(t('errorLoadingAlerts'));
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('alerts.title')}</CardTitle>
        <Select value={resolvedFilter} onValueChange={(v) => { setResolvedFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('alerts.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('alerts.all')}</SelectItem>
            <SelectItem value="unresolved">{t('alerts.unresolved')}</SelectItem>
            <SelectItem value="resolved">{t('alerts.resolved')}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('alerts.employee')}</TableHead>
                    <TableHead>{t('alerts.type')}</TableHead>
                    <TableHead>{t('alerts.status')}</TableHead>
                    <TableHead>{t('alerts.createdAt')}</TableHead>
                    <TableHead>{t('alerts.resolvedAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{alert.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{alert.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{alert.alert_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.is_resolved ? 'secondary' : 'destructive'}>
                          {alert.is_resolved ? t('alerts.resolved') : t('alerts.unresolved')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {alert.resolved_at 
                          ? format(new Date(alert.resolved_at), 'dd/MM/yyyy HH:mm')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {t('users.showing', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
