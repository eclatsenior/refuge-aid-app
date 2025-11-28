import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  refugi_lead_id: string;
  status: string;
  employee_limit: number;
  product_id: string;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export function SuperAdminSubscriptionsTab() {
  const { t } = useTranslation('superAdmin');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState({ employee_limit: 0, status: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_subscriptions' }
      });

      if (error) throw error;
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      console.error('Error loading subscriptions:', err);
      toast.error(t('errorLoadingSubscriptions'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSubscription(sub);
    setEditForm({
      employee_limit: sub.employee_limit,
      status: sub.status
    });
  };

  const handleSave = async () => {
    if (!editingSubscription) return;

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('super-admin-data', {
        body: {
          action: 'update_subscription',
          subscriptionId: editingSubscription.id,
          updates: editForm
        }
      });

      if (error) throw error;
      toast.success(t('subscriptionUpdated'));
      setEditingSubscription(null);
      loadSubscriptions();
    } catch (err: any) {
      console.error('Error updating subscription:', err);
      toast.error(t('errorUpdatingSubscription'));
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'canceled': return 'destructive';
      case 'past_due': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('subscriptions.user')}</TableHead>
                  <TableHead>{t('subscriptions.status')}</TableHead>
                  <TableHead>{t('subscriptions.employeeLimit')}</TableHead>
                  <TableHead>{t('subscriptions.periodEnd')}</TableHead>
                  <TableHead>{t('subscriptions.createdAt')}</TableHead>
                  <TableHead className="text-right">{t('subscriptions.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(sub.status)}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.employee_limit}</TableCell>
                    <TableCell>
                      {sub.current_period_end 
                        ? format(new Date(sub.current_period_end), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>{format(new Date(sub.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('subscriptions.editSubscription')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('subscriptions.employeeLimit')}</Label>
              <Input
                type="number"
                value={editForm.employee_limit}
                onChange={(e) => setEditForm(f => ({ ...f, employee_limit: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('subscriptions.status')}</Label>
              <Input
                value={editForm.status}
                onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubscription(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <LoadingSpinner size="sm" /> : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
