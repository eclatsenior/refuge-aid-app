import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, CreditCard, RefreshCw, TrendingUp, DollarSign, Users, Wallet, UserCog } from 'lucide-react';
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

interface StripeSubscription {
  id: string;
  status: string;
  customerEmail: string;
  customerName: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  productName: string;
  amount: number;
  currency: string;
  interval: string;
}

interface StripeData {
  mrr: number;
  totalRevenue30d: number;
  activeSubscriptions: number;
  subscriptionsList: StripeSubscription[];
  availableBalance: number;
  pendingBalance: number;
}

export function SuperAdminSubscriptionsTab() {
  const { t } = useTranslation('superAdmin');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stripeData, setStripeData] = useState<StripeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStripe, setLoadingStripe] = useState(true);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState({ employee_limit: 0, status: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSubscriptions();
    loadStripeData();
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

  const loadStripeData = async () => {
    setLoadingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_stripe_data' }
      });

      if (error) throw error;
      setStripeData(data);
    } catch (err: any) {
      console.error('Error loading Stripe data:', err);
      toast.error(t('subscriptions.errorLoadingStripeData'));
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleRefresh = () => {
    loadSubscriptions();
    loadStripeData();
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

  const formatCurrency = (amount: number, currency: string = 'eur') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (loading && loadingStripe) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('subscriptions.title')}</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Stripe Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('subscriptions.mrr')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStripe ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stripeData?.mrr || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{t('subscriptions.mrrDescription')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t('subscriptions.revenue30d')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStripe ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stripeData?.totalRevenue30d || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{t('subscriptions.revenue30dDescription')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('subscriptions.stripeSubscriptions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStripe ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <p className="text-2xl font-bold text-purple-600">
                  {stripeData?.activeSubscriptions || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('subscriptions.activeInStripe')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {t('subscriptions.availableBalance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStripe ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stripeData?.availableBalance || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('subscriptions.pendingBalance')}: {formatCurrency(stripeData?.pendingBalance || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stripe Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('subscriptions.stripeSubscriptionsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStripe ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : stripeData?.subscriptionsList && stripeData.subscriptionsList.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('subscriptions.customer')}</TableHead>
                    <TableHead>{t('subscriptions.plan')}</TableHead>
                    <TableHead>{t('subscriptions.amount')}</TableHead>
                    <TableHead>{t('subscriptions.status')}</TableHead>
                    <TableHead>{t('subscriptions.nextPayment')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stripeData.subscriptionsList.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.customerName}</p>
                          <p className="text-sm text-muted-foreground">{sub.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{sub.productName}</TableCell>
                      <TableCell>
                        {formatCurrency(sub.amount, sub.currency)}/{sub.interval === 'month' ? 'mes' : 'año'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                          {sub.status}
                          {sub.cancelAtPeriodEnd && ' (cancela)'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.currentPeriodEnd 
                          ? format(new Date(sub.currentPeriodEnd * 1000), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t('subscriptions.noStripeSubscriptions')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Local Database Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.localSubscriptions')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('subscriptions.user')}</TableHead>
                    <TableHead>{t('subscriptions.origin')}</TableHead>
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
                        {sub.stripe_subscription_id ? (
                          <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
                            <CreditCard className="w-3 h-3 mr-1" />
                            {t('subscriptions.paidStripe')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                            <UserCog className="w-3 h-3 mr-1" />
                            {t('subscriptions.manualAssignment')}
                          </Badge>
                        )}
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
          )}
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
    </div>
  );
}
