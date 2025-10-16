import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Calendar, MapPin, Edit, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { LanguageSelector } from '@/components/profile/LanguageSelector';
import { RefugiLeadCard } from '@/components/profile/RefugiLeadCard';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { MessageDialog } from '@/components/messaging/MessageDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const user = useAppStore((state) => state.user);
  const [profile, setProfile] = useState<any>(null);
  const [refugiLead, setRefugiLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const loadProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Cargar perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Cargar Refugi Lead asignado
      const { data: leadData } = await supabase
        .rpc('get_assigned_refugi_lead', { emp_id: user.id })
        .single();

      if (leadData) {
        setRefugiLead(leadData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button onClick={() => setEditDialogOpen(true)} variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          {t('editProfile')}
        </Button>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('personalInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="text-2xl font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{profile.full_name}</h2>
              {profile.bio && (
                <p className="text-muted-foreground mt-1">{profile.bio}</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{t('email')}</span>
              </div>
              <p className="font-medium">{profile.email}</p>
            </div>

            {profile.phone && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{t('phone')}</span>
                </div>
                <p className="font-medium">{profile.phone}</p>
              </div>
            )}

            {profile.date_of_birth && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{t('dateOfBirth')}</span>
                </div>
                <p className="font-medium">{formatDate(profile.date_of_birth)}</p>
              </div>
            )}

            {profile.address && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{t('address')}</span>
                </div>
                <p className="font-medium">{profile.address}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selector de Idioma */}
      <Card>
        <CardContent className="pt-6">
          <LanguageSelector />
        </CardContent>
      </Card>

      {/* Refugi Lead */}
      {refugiLead && (
        <RefugiLeadCard
          lead={refugiLead}
          onSendMessage={() => setMessageDialogOpen(true)}
        />
      )}

      {/* Contactos de Emergencia */}
      {(profile.emergency_contact_1_name || profile.emergency_contact_2_name) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('emergencyContacts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.emergency_contact_1_name && (
              <div className="space-y-2">
                <h4 className="font-semibold">{t('contact1')}</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contactName')}</p>
                    <p className="font-medium">{profile.emergency_contact_1_name}</p>
                  </div>
                  {profile.emergency_contact_1_phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t('contactPhone')}</p>
                      <p className="font-medium">{profile.emergency_contact_1_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {profile.emergency_contact_2_name && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold">{t('contact2')}</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('contactName')}</p>
                      <p className="font-medium">{profile.emergency_contact_2_name}</p>
                    </div>
                    {profile.emergency_contact_2_phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t('contactPhone')}</p>
                        <p className="font-medium">{profile.emergency_contact_2_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialData={{
          full_name: profile.full_name,
          phone: profile.phone || '',
          date_of_birth: profile.date_of_birth || '',
          address: profile.address || '',
          bio: profile.bio || '',
          emergency_contact_1_name: profile.emergency_contact_1_name || '',
          emergency_contact_1_phone: profile.emergency_contact_1_phone || '',
          emergency_contact_2_name: profile.emergency_contact_2_name || '',
          emergency_contact_2_phone: profile.emergency_contact_2_phone || '',
        }}
        onSuccess={loadProfile}
      />

      {refugiLead && (
        <MessageDialog
          isOpen={messageDialogOpen}
          onClose={() => setMessageDialogOpen(false)}
          recipientId={refugiLead.user_id}
          recipientName={refugiLead.full_name}
        />
      )}
    </div>
  );
}
