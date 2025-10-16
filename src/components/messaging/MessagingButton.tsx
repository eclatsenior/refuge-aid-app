import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';

interface MessagingButtonProps {
  onClick: () => void;
}

export function MessagingButton({ onClick }: MessagingButtonProps) {
  const messages = useAppStore((state) => state.messages);
  const user = useAppStore((state) => state.user);

  // Contar mensajes no leídos
  const unreadCount = messages.filter(
    (msg) => msg.recipient_id === user?.id && !msg.is_read
  ).length;

  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg z-40"
    >
      <MessageCircle className="w-6 h-6" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-0 flex items-center justify-center"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
