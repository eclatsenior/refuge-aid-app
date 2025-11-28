import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FeatureFlag {
  id: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  updated_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: any;
  created_at: string;
}

export function SuperAdminSettingsTab() {
  const { t } = useTranslation('superAdmin');
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadFeatureFlags();
    loadAuditLogs();
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [page]);

  const loadFeatureFlags = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_feature_flags' }
      });

      if (error) throw error;
      setFlags(data.flags || []);
    } catch (err: any) {
      console.error('Error loading feature flags:', err);
    } finally {
      setLoadingFlags(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_audit_logs', page, limit }
      });

      if (error) throw error;
      setLogs(data.logs || []);
      setTotalLogs(data.total || 0);
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleToggleFlag = async (flagId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('super-admin-data', {
        body: { 
          action: 'update_feature_flag',
          flagId,
          isEnabled: !currentValue
        }
      });

      if (error) throw error;
      
      setFlags(flags.map(f => 
        f.id === flagId ? { ...f, is_enabled: !currentValue } : f
      ));
      toast.success(t('settings.flagUpdated'));
    } catch (err: any) {
      console.error('Error updating flag:', err);
      toast.error(t('settings.errorUpdatingFlag'));
    }
  };

  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <div className="space-y-6">
      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.featureFlags')}</CardTitle>
          <CardDescription>{t('settings.featureFlagsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingFlags ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : flags.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('settings.noFeatureFlags')}
            </p>
          ) : (
            <div className="space-y-4">
              {flags.map((flag) => (
                <div 
                  key={flag.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{flag.flag_name}</p>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={flag.is_enabled}
                    onCheckedChange={() => handleToggleFlag(flag.id, flag.is_enabled)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.auditLogs')}</CardTitle>
          <CardDescription>{t('settings.auditLogsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('settings.noAuditLogs')}
            </p>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('settings.action')}</TableHead>
                      <TableHead>{t('settings.resource')}</TableHead>
                      <TableHead>{t('settings.timestamp')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>
                          {log.resource_type && (
                            <span className="text-muted-foreground">
                              {log.resource_type}
                              {log.resource_id && `: ${log.resource_id.slice(0, 8)}...`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('users.showing', { from: (page - 1) * limit + 1, to: Math.min(page * limit, totalLogs), total: totalLogs })}
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
    </div>
  );
}
