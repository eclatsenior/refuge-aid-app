import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  chips?: string[];
  icon: LucideIcon;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function KPICard({ title, value, trend, chips, icon: Icon, onClick, variant = 'default' }: KPICardProps) {
  const variantStyles = {
    default: 'border-border hover:border-primary/50',
    success: 'border-mint/30 bg-mint/5 hover:border-mint/50',
    warning: 'border-coral/30 bg-coral/5 hover:border-coral/50',
    danger: 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all ${variantStyles[variant]}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm mt-1 ${trend >= 0 ? 'text-mint' : 'text-coral'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}

        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {chips.map((chip, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {chip}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
