import { useMemo } from "react";
import { StatusHeartSmall } from "./StatusHeart";
import { Card, CardContent } from "@/components/ui/card";
import type { CheckIn } from "@/store/useAppStore";
import { useTranslation } from "react-i18next";
import { format, isSameDay } from "date-fns";
import { getDateFnsLocale } from "@/lib/dateUtils";
interface DayHeartDetailProps {
  date: Date;
  checkIns: CheckIn[];
}

export function DayHeartDetail({ date, checkIns }: DayHeartDetailProps) {
  const { t, i18n } = useTranslation("tracking");
  const locale = getDateFnsLocale(i18n.language);

  const dayCheckIns = useMemo(
    () => checkIns
      .filter((c) => isSameDay(new Date(c.timestamp), date))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [checkIns, date]
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ok": return t("status.stable.label");
      case "anxious": return t("status.anxious.label");
      case "alert": return t("status.alert.label");
      default: return t("status.stable.label");
    }
  };

  const dateLabel = format(date, "EEEE, d MMMM", { locale });

  return (
    <Card className="bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <CardContent className="pt-6 space-y-3">
        <p className="text-center font-semibold text-lg capitalize text-foreground">
          {dateLabel}
        </p>

        {dayCheckIns.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            {t("summary.noRecords")}
          </p>
        ) : (
          <div className="space-y-2">
            {dayCheckIns.map((checkIn, index) => (
              <div key={index} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-b-0">
                <StatusHeartSmall status={checkIn.status as "ok" | "anxious" | "alert"} size={40} />
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{getStatusLabel(checkIn.status)}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(checkIn.timestamp), "HH:mm", { locale })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
