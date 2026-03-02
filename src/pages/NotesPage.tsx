import { useState, useEffect } from "react";
import { Plus, Search, Star, StarOff, Edit, Trash2, Save, X, Lock, Vault, Heart, ArrowLeft, Download, Shield, AlertTriangle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { UserMenu } from "@/components/layout/UserMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { VaultPasswordSetup } from "@/components/vault/VaultPasswordSetup";
import { VaultUnlock } from "@/components/vault/VaultUnlock";
import { VaultResetRequest } from "@/components/vault/VaultResetRequest";
import { VaultResetComplete } from "@/components/vault/VaultResetComplete";
import { supabase } from "@/integrations/supabase/client";
import { encryptText, decryptText } from "@/lib/security";

interface NotesPageProps {
  onNavigate: (path: string) => void;
}

export function NotesPage({ onNavigate }: NotesPageProps) {
  const { t } = useTranslation('notes');
  const { 
    notes, addNote, updateNote, deleteNote, toggleVaultStatus, 
    toggleTherapyFlag, quickDeleteNote, settings, showDecoyScreen, 
    activateDecoyScreen, deactivateDecoyScreen, isVaultLocked, unlockVault,
    profile
  } = useAppStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isVaultMode, setIsVaultMode] = useState(false);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState("");
  const [showQuickDelete, setShowQuickDelete] = useState<string | null>(null);
  
  // Vault system states
  const [hasVaultPassword, setHasVaultPassword] = useState<boolean | null>(null);
  const [showVaultSetup, setShowVaultSetup] = useState(false);
  const [showVaultUnlock, setShowVaultUnlock] = useState(false);
  const [showVaultReset, setShowVaultReset] = useState(false);
  const [showVaultResetComplete, setShowVaultResetComplete] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [vaultToken, setVaultToken] = useState<string | null>(null);

  // Check if user has vault password configured and check for approved reset requests
  useEffect(() => {
    checkVaultPassword();
    checkPendingApprovedReset();
  }, []);

  // Suscripción realtime a cambios en solicitudes de reset
  useEffect(() => {
    let subscription: any;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      subscription = supabase
        .channel('vault-reset-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'vault_reset_requests',
          filter: `user_id=eq.${user.id}`
        }, (payload: any) => {
          if (payload.new.status === 'approved' && payload.new.reset_token) {
            // Solicitud aprobada, mostrar diálogo de reset
            setResetToken(payload.new.reset_token);
            setShowVaultResetComplete(true);
            setShowVaultReset(false);
            
            toast({
              title: t('toast.requestApproved'),
              description: t('toast.requestApprovedDescription'),
            });
          }
        })
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const checkVaultPassword = async () => {
    try {
      const { data, error } = await supabase
        .from('vault_passwords')
        .select('id')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking vault password:', error);
      }
      
      setHasVaultPassword(!!data);
      
      // Check for stored token
      const storedToken = sessionStorage.getItem('vault_token');
      if (storedToken) {
        setVaultToken(storedToken);
        unlockVault(); // Unlock with token
      }
    } catch (error) {
      console.error('Error checking vault password:', error);
      setHasVaultPassword(false);
    }
  };

  // Check if there's an approved vault reset request with a valid token
  const checkPendingApprovedReset = async () => {
    try {
      const { data: approvedRequest, error } = await supabase
        .from('vault_reset_requests')
        .select('id, reset_token, created_at')
        .eq('status', 'approved')
        .not('reset_token', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[VaultReset] Error checking approved requests:', error);
        return;
      }

      if (approvedRequest?.reset_token) {
        console.log('[VaultReset] Found approved reset request, showing password change dialog');
        setResetToken(approvedRequest.reset_token);
        setShowVaultResetComplete(true);
      }
    } catch (error) {
      console.error('[VaultReset] Error checking pending resets:', error);
    }
  };

  const filteredNotes = notes
    .filter(note => {
      // Show decoy screen if activated
      if (showDecoyScreen) return false;
      
      // Filter by search term
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // Starred notes first, then by updated date
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  
  const vaultNotes = filteredNotes.filter(note => note.isSafeVault);
  const regularNotes = filteredNotes.filter(note => !note.isSafeVault);

  const handleVaultAccess = () => {
    if (hasVaultPassword === null) {
      // Still checking
      return;
    }
    
    if (!hasVaultPassword) {
      // No password set, show setup
      setShowVaultSetup(true);
    } else if (isVaultLocked) {
      // Password set but locked, show unlock
      setShowVaultUnlock(true);
    }
  };

  const handleVaultSetupSuccess = () => {
    setShowVaultSetup(false);
    setHasVaultPassword(true);
    toast({
      title: t('vault.setup.successTitle'),
      description: t('vault.setup.successDescription'),
    });
  };

  const handleVaultSetupClose = () => {
    setShowVaultSetup(false);
  };

  const handleVaultUnlockSuccess = (token: string) => {
    setShowVaultUnlock(false);
    setVaultToken(token);
    sessionStorage.setItem('vault_token', token);
    unlockVault(); // Unlock in store
  };

  const handleForgotPassword = async () => {
    setShowVaultUnlock(false);
    
    // Check if there's already an approved reset request
    const { data: approvedRequest } = await supabase
      .from('vault_reset_requests')
      .select('id, reset_token')
      .eq('status', 'approved')
      .not('reset_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (approvedRequest?.reset_token) {
      // There's already an approved request, go directly to password change
      setResetToken(approvedRequest.reset_token);
      setShowVaultResetComplete(true);
    } else {
      // No approved request, show the reset request form
      setShowVaultReset(true);
    }
  };

  const handleVaultResetSuccess = () => {
    setShowVaultResetComplete(false);
    setResetToken(null);
    setHasVaultPassword(true);
    checkVaultPassword();
  };

  const handleCreateNote = (isVault = false) => {
    if (isVault && (hasVaultPassword === false || isVaultLocked)) {
      handleVaultAccess();
      return;
    }
    
    setIsEditing(true);
    setEditingId(null);
    setTitle("");
    setContent("");
    setIsVaultMode(isVault);
  };

  const handleEditNote = (note: any) => {
    setIsEditing(true);
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setIsVaultMode(note.isSafeVault);
  };

  const handleSaveNote = async () => {
    if (!title.trim()) {
      toast({
        title: t('toast.errorTitle', { defaultValue: 'Error' }),
        description: t('errors.titleRequired'),
        variant: "destructive"
      });
      return;
    }

    let finalContent = content.trim();

    // Encrypt content if it's a vault note and user has vault password
    if (isVaultMode && vaultToken) {
      try {
        // Get vault password from session (in real app, derive from token)
        // For now, we'll use a simplified approach
        const password = vaultToken.substring(0, 32); // Simplified - in production use proper key derivation
        finalContent = await encryptText(content.trim(), password);
      } catch (error) {
        console.error('Error encrypting note:', error);
        toast({
          title: t('toast.errorTitle', { defaultValue: 'Error' }),
          description: t('errors.encryptionFailed'),
          variant: 'destructive',
        });
        return;
      }
    }

    if (editingId) {
      updateNote(editingId, { 
        title: title.trim(), 
        content: finalContent
      });
      toast({
        title: t('toast.noteUpdated'),
        description: t('toast.noteUpdatedDescription')
      });
    } else {
      addNote({
        title: title.trim(),
        content: finalContent,
        timestamp: new Date()
      });
      toast({
        title: isVaultMode ? t('toast.noteSavedVault') : t('toast.noteCreated'),
        description: isVaultMode 
          ? t('toast.noteSavedVaultDescription')
          : t('toast.noteCreatedDescription')
      });
    }

    setIsEditing(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setIsVaultMode(false);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm(t('confirmDelete.title') + ' ' + t('confirmDelete.description'))) {
      deleteNote(id);
      toast({
        title: t('toast.noteDeleted'),
        description: t('toast.noteDeletedDescription')
      });
    }
  };

  const handleQuickDelete = (id: string) => {
    if (quickDeleteNote(id, deleteConfirmWord)) {
      toast({
        title: t('toast.noteDeleted'),
        description: t('toast.noteDeletedDescription')
      });
      setShowQuickDelete(null);
      setDeleteConfirmWord("");
    } else {
      toast({
        title: t('toast.errorTitle', { defaultValue: 'Error' }),
        description: t('errors.confirmDeleteError'),
        variant: "destructive"
      });
    }
  };

  const handleExportForTherapy = (note: any) => {
    // In a real app, this would generate a protected PDF
    const content = `NOTA PARA TERAPIA\n\nTítulo: ${note.title}\nFecha: ${new Date(note.updatedAt).toLocaleDateString()}\n\nContenido:\n${note.content}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terapia-${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    
    toast({
      title: t('toast.exportedTherapy'),
      description: t('toast.exportedTherapyDescription')
    });
  };

  const toggleStar = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { isStarred: !note.isStarred });
    }
  };

  const formatDate = (date: Date | string | number): string => {
    try {
      const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha no válida';
    }
  };

  const handleEmergencyHide = () => {
    activateDecoyScreen();
    toast({
      title: t('toast.emergencyHideActivated'),
      description: t('toast.emergencyHideDescription')
    });
  };

  // Show decoy screen
  if (showDecoyScreen) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('decoy.title')}</h1>
          <p className="text-muted-foreground">
            {t('decoy.description')}
          </p>
        </header>
        
        <div className="text-center py-16">
          <Heart 
            className="mx-auto h-16 w-16 text-muted-foreground mb-4 cursor-pointer" 
            onClick={deactivateDecoyScreen}
          />
          <h3 className="text-xl font-semibold mb-2">{t('decoy.empty')}</h3>
          <p className="text-muted-foreground mb-8">
            {t('decoy.emptyDescription')}
          </p>
          <Button onClick={deactivateDecoyScreen}>
            {t('decoy.createButton')}
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {isVaultMode && <Vault className="h-6 w-6 text-primary" />}
            {editingId 
              ? t('editing.title')
              : isVaultMode 
                ? t('editing.newVaultNote')
                : t('editing.newNote')
            }
          </h1>
          <Button
            variant="ghost"
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setTitle("");
              setContent("");
              setIsVaultMode(false);
            }}
          >
            <X size={20} />
          </Button>
        </header>

        <div className="space-y-4">
          {isVaultMode && (
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Vault className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">{t('editing.vaultBadge')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('editing.vaultDescription')}
              </p>
            </div>
          )}
          
          <div>
            <Input
              placeholder={isVaultMode ? t('editing.titlePlaceholderVault') : t('editing.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium"
            />
          </div>
          
          <div>
            <Textarea
              placeholder={isVaultMode 
                ? t('editing.contentPlaceholderVault')
                : t('editing.contentPlaceholder')
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] resize-none"
            />
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              {t('editing.encryptionNote')}
            </div>
            <Button onClick={handleSaveNote} className="gap-2">
              <Save size={16} />
              {isVaultMode ? t('buttons.saveVault') : t('buttons.saveNote')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Vault className="h-7 w-7 text-primary" />
              Diario Caja Fuerte
            </h1>
            <p className="text-muted-foreground">
              Un espacio protegido para lo que pesa y para lo que salva
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEmergencyHide}
              className="gap-2 text-muted-foreground"
            >
              <Shield size={16} />
              Ocultar
            </Button>
            <UserMenu onNavigate={onNavigate} />
          </div>
        </div>
      </header>

      <div className="mb-6">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={() => handleCreateNote(false)} variant="outline" className="gap-2">
              <Plus size={16} />
              {t('buttons.createNote')}
            </Button>
            <Button onClick={() => handleCreateNote(true)} className="gap-2">
              <Vault size={16} />
              {t('buttons.createVaultNote')}
            </Button>
          </div>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-16">
          {searchTerm ? (
            <>
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('emptySearch.title')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('emptySearch.description')}
              </p>
              <Button onClick={() => setSearchTerm("")} variant="outline">
                {t('buttons.cancel')}
              </Button>
            </>
          ) : (
            <>
              <Vault className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('title')}</h3>
              <p className="text-muted-foreground mb-2">
                {t('subtitle')}
              </p>
              <p className="text-sm text-muted-foreground/80 mb-6 italic">
                "No eres débil por estar herida, sino poderosa por estar de pie."
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => handleCreateNote(false)} variant="outline" className="gap-2">
                  <Plus size={16} />
                  {t('empty.button')}
                </Button>
                <Button onClick={() => handleCreateNote(true)} className="gap-2">
                  <Vault size={16} />
                  {t('buttons.createVaultNote')}
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Caja Fuerte Section */}
          {vaultNotes.length > 0 || (vaultNotes.length === 0 && isVaultLocked) ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Vault className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-primary">{t('sections.vault')}</h2>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {vaultNotes.length}
                </Badge>
              </div>
              
              {isVaultLocked ? (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-elegant animate-pulse">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{t('vault.unlock.title')}</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {t('vault.unlock.description')}
                      </p>
                    </div>
                    <Button 
                      onClick={handleVaultAccess}
                      size="sm"
                      className="gap-2"
                    >
                      <Vault size={14} />
                      {t('vault.unlock.submitButton')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {vaultNotes.map((note) => (
                    <Card key={note.id} className="border-primary/20 bg-primary/5 hover:shadow-soft transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-2 flex-1">
                            {note.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="gap-1 bg-primary/20 text-primary">
                              <Vault size={12} />
                              {t('sections.vault')}
                            </Badge>
                            {note.forTherapy && (
                              <Badge variant="secondary" className="gap-1 bg-mint/20 text-mint">
                                <Heart size={12} />
                                Terapia
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStar(note.id)}
                              className={note.isStarred ? 'text-warning' : 'text-muted-foreground'}
                            >
                              {note.isStarred ? <Star size={16} className="fill-current" /> : <StarOff size={16} />}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {note.content || "Sin contenido"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.updatedAt)}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTherapyFlag(note.id)}
                              className="gap-2"
                            >
                              <Heart size={14} />
                              {note.forTherapy ? 'Quitar de' : 'Para'} terapia
                            </Button>
                            {note.forTherapy && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportForTherapy(note)}
                                className="gap-2"
                              >
                                <Download size={14} />
                                Exportar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditNote(note)}
                              className="gap-2"
                            >
                              <Edit size={14} />
                              Editar
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2 text-destructive hover:text-destructive"
                                >
                                  <AlertTriangle size={14} />
                                  Borrar rápido
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Borrado rápido de memoria</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Escribe <strong>BORRAR</strong> para confirmar.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <Input
                                  placeholder="Escribe BORRAR para confirmar"
                                  value={deleteConfirmWord}
                                  onChange={(e) => setDeleteConfirmWord(e.target.value)}
                                />
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteConfirmWord("")}>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleQuickDelete(note.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Eliminar permanentemente
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Regular Notes Section */}
          {regularNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Edit className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t('sections.regular')}</h2>
                <Badge variant="secondary" className="bg-muted/20">
                  {regularNotes.length}
                </Badge>
              </div>
              <div className="grid gap-4">
                {regularNotes.map((note) => (
                  <Card key={note.id} className="hover:shadow-soft transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2 flex-1">
                          {note.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="gap-1">
                            <Lock size={12} />
                            Privada
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStar(note.id)}
                            className={note.isStarred ? 'text-warning' : 'text-muted-foreground'}
                          >
                            {note.isStarred ? <Star size={16} className="fill-current" /> : <StarOff size={16} />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {note.content || "Sin contenido"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(note.updatedAt)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleVaultStatus(note.id)}
                            className="gap-2"
                          >
                            <Vault size={14} />
                            Mover a Caja Fuerte
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note)}
                            className="gap-2"
                          >
                            <Edit size={14} />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vault Dialogs */}
      {showVaultSetup && (
        <VaultPasswordSetup
          open={showVaultSetup}
          onSuccess={handleVaultSetupSuccess}
          onClose={handleVaultSetupClose}
          isManagedByLead={profile?.managed_by_lead || false}
        />
      )}

      {showVaultUnlock && (
        <VaultUnlock
          open={showVaultUnlock}
          onSuccess={handleVaultUnlockSuccess}
          onForgotPassword={handleForgotPassword}
          onClose={() => setShowVaultUnlock(false)}
        />
      )}

      {showVaultReset && (
        <VaultResetRequest
          open={showVaultReset}
          onClose={() => setShowVaultReset(false)}
          isManagedByLead={profile?.managed_by_lead || false}
        />
      )}

      {showVaultResetComplete && resetToken && (
        <VaultResetComplete
          open={showVaultResetComplete}
          onClose={() => setShowVaultResetComplete(false)}
          resetToken={resetToken}
          onSuccess={handleVaultResetSuccess}
        />
      )}
    </div>
  );
}