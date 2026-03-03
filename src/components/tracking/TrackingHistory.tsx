import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CheckIn } from "@/store/useAppStore";
import { safeGetTime, safeToLocaleDateString } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";
import { StatusHeartSmall } from "./StatusHeart";

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
          {sorted.map((checkIn, index) => (
            <div key={index} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-b-0">
              <StatusHeartSmall status={checkIn.status as "ok" | "anxious" | "alert"} size={40} />
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
