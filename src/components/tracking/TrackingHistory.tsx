import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CheckIn } from "@/store/useAppStore";
import { safeGetTime, safeToLocaleDateString } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";

interface TrackingHistoryProps {
  checkIns: CheckIn[];
}

export function TrackingHistory({ checkIns }: TrackingHistoryProps) {
  const { t, i18n } = useTranslation("tracking");

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ok": return t("status.stable.label");
      case "anxious": return t("status.anxious.label");
      case "alert": return t("status.alert.label");
      default: return t("status.stable.label");
    }
  };

  const sorted = [...checkIns].sort((a, b) => safeGetTime(b.timestamp) - safeGetTime(a.timestamp));

  if (sorted.length === 0) return null;

  return (
    <Card className="bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl">{t("history.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((checkIn, index) => {
            const colors = checkIn.status === "ok"
              ? "bg-gradient-to-br from-mint to-mint/80"
              : checkIn.status === "anxious"
                ? "bg-gradient-to-br from-coral to-coral/80"
                : "bg-gradient-to-br from-emergency to-emergency/80";
            const Icon = checkIn.status === "ok" ? CheckCircle : checkIn.status === "anxious" ? Clock : AlertCircle;

            return (
              <div key={index} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-b-0">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${colors}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{getStatusLabel(checkIn.status)}</div>
                  <div className="text-sm text-muted-foreground">
                    {safeToLocaleDateString(checkIn.timestamp, i18n.language, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
