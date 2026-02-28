import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Trash2, Eye, ChevronLeft, ChevronRight, Key, Mail, Pencil, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'employee' | 'refugi_lead';
  created_at: string;
  phone?: string;
}

export function SuperAdminUsersTab() {
  const { t } = useTranslation('superAdmin');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [passwordDialogUser, setPasswordDialogUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<string>('');
  const [editPhone, setEditPhone] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { 
          action: 'get_users',
          page,
          limit,
          search: search || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined
        }
      });

      if (error) throw error;
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Error loading users:', err);
      toast.error(t('errorLoadingUsers'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'delete_user', userId }
      });

      if (error) throw error;
      toast.success(t('userDeleted'));
      loadUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(t('errorDeletingUser'));
    }
  };

  const handleViewUser = async (userId: string) => {
    setLoadingDetails(true);
    setUserDetailsOpen(true);
    setIsEditing(false);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_user_details', userId }
      });

      if (error) throw error;
      setSelectedUser(data);
    } catch (err: any) {
      console.error('Error loading user details:', err);
      toast.error(t('errorLoadingUserDetails'));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStartEdit = () => {
    if (!selectedUser?.profile) return;
    setEditName(selectedUser.profile.full_name || '');
    setEditRole(selectedUser.profile.role || 'employee');
    setEditPhone(selectedUser.profile.phone || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser?.profile) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase.functions.invoke('super-admin-data', {
        body: {
          action: 'update_user_profile',
          userId: selectedUser.profile.user_id,
          full_name: editName,
          role: editRole,
          phone: editPhone,
        }
      });

      if (error) throw error;
      toast.success(t('users.profileUpdated'));
      
      // Update local state
      setSelectedUser((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          full_name: editName,
          role: editRole,
          phone: editPhone || null,
        }
      }));
      setIsEditing(false);
      loadUsers();
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error(t('users.errorUpdatingProfile'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'send_password_reset', email }
      });

      if (error) throw error;
      toast.success(t('users.passwordResetSent'));
    } catch (err: any) {
      console.error('Error sending password reset:', err);
      toast.error(t('users.errorSendingReset'));
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('users.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('users.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('users.filterRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.allRoles')}</SelectItem>
              <SelectItem value="employee">{t('users.employees')}</SelectItem>
              <SelectItem value="refugi_lead">{t('users.refugiLeads')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
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
                    <TableHead>{t('users.name')}</TableHead>
                    <TableHead>{t('users.email')}</TableHead>
                    <TableHead>{t('users.role')}</TableHead>
                    <TableHead>{t('users.createdAt')}</TableHead>
                    <TableHead className="text-right">{t('users.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'refugi_lead' ? 'default' : 'secondary'}>
                          {user.role === 'refugi_lead' ? 'Refugi Lead' : 'Employee'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(user.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewUser(user.user_id)}
                            title={t('users.viewDetails')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setPasswordDialogUser(user)}
                            title={t('users.changePassword')}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleSendPasswordReset(user.email)}
                            title={t('users.sendPasswordReset')}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('users.confirmDelete')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('users.deleteWarning', { name: user.full_name })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(user.user_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t('common.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
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

        {/* User Details Dialog */}
        <Dialog open={userDetailsOpen} onOpenChange={(open) => { setUserDetailsOpen(open); if (!open) setIsEditing(false); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{t('users.userDetails')}</DialogTitle>
                {selectedUser && !loadingDetails && !isEditing && (
                  <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-1.5">
                    <Pencil className="w-3.5 h-3.5" />
                    {t('users.editProfile')}
                  </Button>
                )}
              </div>
            </DialogHeader>
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : selectedUser ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">{t('users.profile')}</h4>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground">{t('users.name')}</label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">{t('users.email')}</label>
                          <Input value={selectedUser.profile?.email || ''} disabled className="opacity-60" />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">{t('users.role')}</label>
                          <Select value={editRole} onValueChange={setEditRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="refugi_lead">Refugi Lead</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">{t('users.phone')}</label>
                          <Input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="+34..."
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit} className="gap-1.5">
                            <Save className="w-3.5 h-3.5" />
                            {savingEdit ? t('users.saving') : t('common.save')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={savingEdit} className="gap-1.5">
                            <X className="w-3.5 h-3.5" />
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">{t('users.name')}:</span> {selectedUser.profile?.full_name}</p>
                        <p><span className="text-muted-foreground">{t('users.email')}:</span> {selectedUser.profile?.email}</p>
                        <p><span className="text-muted-foreground">{t('users.role')}:</span> 
                          <Badge variant={selectedUser.profile?.role === 'refugi_lead' ? 'default' : 'secondary'} className="ml-2">
                            {selectedUser.profile?.role === 'refugi_lead' ? 'Refugi Lead' : 'Employee'}
                          </Badge>
                        </p>
                        <p><span className="text-muted-foreground">{t('users.phone')}:</span> {selectedUser.profile?.phone || '-'}</p>
                      </div>
                    )}
                  </div>
                  {selectedUser.subscription && (
                    <div>
                      <h4 className="font-semibold mb-2">{t('users.subscription')}</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Status:</span> {selectedUser.subscription.status}</p>
                        <p><span className="text-muted-foreground">Employees:</span> {selectedUser.subscription.employee_limit}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedUser.moodCheckins?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('users.recentMoodCheckins')}</h4>
                    <div className="space-y-1 text-sm">
                      {selectedUser.moodCheckins.slice(0, 5).map((m: any, i: number) => (
                        <p key={i} className="flex justify-between">
                          <span>{format(new Date(m.created_at), 'dd/MM/yyyy HH:mm')}</span>
                          <span>Mood: {m.mood_level}/5</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser.alerts?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('users.recentAlerts')}</h4>
                    <div className="space-y-1 text-sm">
                      {selectedUser.alerts.slice(0, 5).map((a: any, i: number) => (
                        <p key={i} className="flex justify-between">
                          <span>{format(new Date(a.created_at), 'dd/MM/yyyy HH:mm')}</span>
                          <Badge variant={a.is_resolved ? 'secondary' : 'destructive'}>
                            {a.is_resolved ? 'Resolved' : 'Open'}
                          </Badge>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <ChangePasswordDialog
          open={!!passwordDialogUser}
          onClose={() => setPasswordDialogUser(null)}
          user={passwordDialogUser}
          onSuccess={() => setPasswordDialogUser(null)}
        />
      </CardContent>
    </Card>
  );
}
