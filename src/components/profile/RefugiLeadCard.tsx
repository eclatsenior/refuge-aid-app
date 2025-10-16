import { useTranslation } from 'react-i18next';
import { MessageCircle, User, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RefugiLeadCardProps {
  lead: {
    user_id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
  };
  onSendMessage: () => void;
}

export function RefugiLeadCard({ lead, onSendMessage }: RefugiLeadCardProps) {
  const { t } = useTranslation('profile');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('refugiLead')}
          </span>
          <Badge variant="secondary">Refugi Lead</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={lead.avatar_url} alt={lead.full_name} />
            <AvatarFallback className="text-lg font-bold">
              {getInitials(lead.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{lead.full_name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail className="w-3 h-3" />
              <span>{lead.email}</span>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Phone className="w-3 h-3" />
                <span>{lead.phone}</span>
              </div>
            )}
          </div>
        </div>
        <Button onClick={onSendMessage} className="w-full" variant="default">
          <MessageCircle className="w-4 h-4 mr-2" />
          {t('sendMessage')}
        </Button>
      </CardContent>
    </Card>
  );
}
