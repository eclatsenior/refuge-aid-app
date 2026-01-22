import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, CheckCircle, XCircle, Clock, Eye, RefreshCw, FileImage } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es, ca, ar } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface VaultResetRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  id_document_url: string | null;
  id_document_signed_url?: string;
  notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export function SuperAdminVaultResetTab() {
  const { t, i18n } = useTranslation('superAdmin');
  const [requests, setRequests] = useState<VaultResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VaultResetRequest | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<VaultResetRequest | null>(null);

  const getLocale = () => {
    switch (i18n.language) {
      case 'es': return es;
      case 'ca': return ca;
      case 'ar': return ar;
      default: return undefined;
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { 
          action: 'get_vault_reset_requests',
          status: filter === 'all' ? undefined : filter
        }
      });

      if (error) throw error;
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error('Error loading vault reset requests:', err);
      toast({
        title: t('vaultReset.errorLoading'),
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: VaultResetRequest) => {
    setProcessingId(request.id);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { 
          action: 'approve_vault_reset_admin',
          requestId: request.id
        }
      });

      if (error) throw error;
      
      toast({
        title: t('vaultReset.requestApproved'),
        description: t('vaultReset.approvedDescription')
      });
      
      loadRequests();
    } catch (err: any) {
      console.error('Error approving vault reset:', err);
      toast({
        title: t('vaultReset.errorApproving'),
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!requestToReject) return;
    
    setProcessingId(requestToReject.id);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { 
          action: 'reject_vault_reset_admin',
          requestId: requestToReject.id,
          notes: rejectNotes
        }
      });

      if (error) throw error;
      
      toast({
        title: t('vaultReset.requestRejected')
      });
      
      setRejectDialogOpen(false);
      setRequestToReject(null);
      setRejectNotes('');
      loadRequests();
    } catch (err: any) {
      console.error('Error rejecting vault reset:', err);
      toast({
        title: t('vaultReset.errorRejecting'),
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (request: VaultResetRequest) => {
    setRequestToReject(request);
    setRejectNotes('');
    setRejectDialogOpen(true);
  };

  const viewDocument = (request: VaultResetRequest) => {
    setSelectedRequest(request);
    setDocumentDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> {t('vaultReset.pending')}</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 gap-1"><CheckCircle className="w-3 h-3" /> {t('vaultReset.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> {t('vaultReset.rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {t('vaultReset.title')}
                  {pendingCount > 0 && filter === 'pending' && (
                    <Badge variant="destructive">{pendingCount}</Badge>
                  )}
                </CardTitle>
                <CardDescription>{t('vaultReset.description')}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('vaultReset.pending')}</SelectItem>
                  <SelectItem value="approved">{t('vaultReset.approved')}</SelectItem>
                  <SelectItem value="rejected">{t('vaultReset.rejected')}</SelectItem>
                  <SelectItem value="all">{t('vaultReset.all')}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadRequests} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('vaultReset.noRequests')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('vaultReset.user')}</TableHead>
                  <TableHead>{t('vaultReset.requestType')}</TableHead>
                  <TableHead>{t('vaultReset.status')}</TableHead>
                  <TableHead>{t('vaultReset.requestedAt')}</TableHead>
                  <TableHead>{t('vaultReset.document')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.profiles?.full_name || '-'}</div>
                        <div className="text-sm text-muted-foreground">{request.profiles?.email || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {request.request_type === 'id_verification' ? t('vaultReset.idVerification') : request.request_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.requested_at), 'PPp', { locale: getLocale() })}
                    </TableCell>
                    <TableCell>
                      {request.id_document_url ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => viewDocument(request)}
                          className="gap-1"
                        >
                          <FileImage className="w-4 h-4" />
                          {t('vaultReset.viewDocument')}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="default"
                                disabled={processingId === request.id}
                              >
                                {processingId === request.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {t('vaultReset.approve')}
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('vaultReset.confirmApprove')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('vaultReset.confirmApproveDescription', { name: request.profiles?.full_name })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleApprove(request)}>
                                  {t('vaultReset.approve')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => openRejectDialog(request)}
                            disabled={processingId === request.id}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            {t('vaultReset.reject')}
                          </Button>
                        </div>
                      )}
                      {request.status !== 'pending' && request.reviewed_at && (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(request.reviewed_at), 'PPp', { locale: getLocale() })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              {t('vaultReset.documentTitle')}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.profiles?.full_name} - {selectedRequest?.profiles?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg min-h-[400px]">
            {selectedRequest?.id_document_signed_url ? (
              <img 
                src={selectedRequest.id_document_signed_url} 
                alt="ID Document" 
                className="max-w-full max-h-[500px] object-contain rounded-lg"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <FileImage className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>{t('vaultReset.noDocument')}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
              {t('common.close')}
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setDocumentDialogOpen(false);
                    if (selectedRequest) openRejectDialog(selectedRequest);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {t('vaultReset.reject')}
                </Button>
                <Button onClick={() => {
                  setDocumentDialogOpen(false);
                  if (selectedRequest) handleApprove(selectedRequest);
                }}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t('vaultReset.approve')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog with Notes */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('vaultReset.rejectTitle')}</DialogTitle>
            <DialogDescription>
              {t('vaultReset.rejectDescription', { name: requestToReject?.profiles?.full_name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder={t('vaultReset.rejectNotesPlaceholder')}
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processingId === requestToReject?.id}
            >
              {processingId === requestToReject?.id ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-1" />
                  {t('vaultReset.confirmReject')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
