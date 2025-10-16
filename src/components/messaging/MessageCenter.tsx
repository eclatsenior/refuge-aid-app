import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/useAppStore';
import { MessageDialog } from './MessageDialog';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es, ca, enUS, ar } from 'date-fns/locale';

interface MessageCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessageCenter({ open, onOpenChange }: MessageCenterProps) {
  const { t, i18n } = useTranslation('messages');
  const messages = useAppStore((state) => state.messages);
  const user = useAppStore((state) => state.user);
  const [refugiLead, setRefugiLead] = useState<any>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const locales = { es, ca, en: enUS, ar };
  const currentLocale = locales[i18n.language as keyof typeof locales] || es;

  useEffect(() => {
    const loadRefugiLead = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .rpc('get_assigned_refugi_lead', { emp_id: user.id })
        .single();

      if (data) {
        setRefugiLead(data);
      }
    };

    if (open) {
      loadRefugiLead();
    }
  }, [open, user?.id]);

  if (!refugiLead) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('messagesCenter')}</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t('noMessages')}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Filtrar mensajes de la conversación con el lead
  const conversationMessages = messages
    .filter(
      (msg) =>
        (msg.sender_id === user?.id && msg.recipient_id === refugiLead.user_id) ||
        (msg.sender_id === refugiLead.user_id && msg.recipient_id === user?.id)
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const lastMessage = conversationMessages[0];
  const unreadCount = conversationMessages.filter(
    (msg) => msg.recipient_id === user?.id && !msg.is_read
  ).length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return t('now');
    if (diffInMinutes < 60) return t('minutesAgo', { count: diffInMinutes });
    if (diffInMinutes < 1440) return t('hoursAgo', { count: Math.floor(diffInMinutes / 60) });
    return t('daysAgo', { count: Math.floor(diffInMinutes / 1440) });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('messagesCenter')}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-6">
            <div
              className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              onClick={() => {
                setShowMessageDialog(true);
                onOpenChange(false);
              }}
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={refugiLead.avatar_url} alt={refugiLead.full_name} />
                <AvatarFallback className="font-bold">
                  {getInitials(refugiLead.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{refugiLead.full_name}</h3>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                {lastMessage && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage.message}
                    </p>
                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {formatTimestamp(lastMessage.created_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {showMessageDialog && (
        <MessageDialog
          isOpen={showMessageDialog}
          onClose={() => setShowMessageDialog(false)}
          recipientId={refugiLead.user_id}
          recipientName={refugiLead.full_name}
        />
      )}
    </>
  );
}
