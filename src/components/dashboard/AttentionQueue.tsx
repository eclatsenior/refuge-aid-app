import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Phone, UserPlus, Send } from 'lucide-react';

interface QueueItem {
  employee_id: string;
  employee_name: string;
  reason: string;
  risk_score: number;
  time_since_alert: string;
  status: string;
}

export function AttentionQueue({ items }: { items: QueueItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Necesita Atención Ahora ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div 
              key={item.employee_id} 
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.employee_name}</span>
                  <Badge variant={item.risk_score > 70 ? 'destructive' : 'outline'}>
                    Riesgo: {item.risk_score}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.reason}</p>
                <span className="text-xs text-muted-foreground">{item.time_since_alert}</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" title="Abrir caso">
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" title="Contactar">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" title="Derivar a psicología">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              ✅ No hay empleadas que requieran atención inmediata
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
