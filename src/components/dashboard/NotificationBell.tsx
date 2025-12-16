import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  pendingCount: number;
  onClick: () => void;
}

export function NotificationBell({ pendingCount, onClick }: NotificationBellProps) {
  if (pendingCount === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="relative"
      title={`${pendingCount} solicitud(es) pendiente(s)`}
    >
      <Bell className={cn(
        "h-4 w-4",
        pendingCount > 0 && "text-amber-500 animate-pulse"
      )} />
      {pendingCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {pendingCount > 9 ? '9+' : pendingCount}
        </Badge>
      )}
    </Button>
  );
}
