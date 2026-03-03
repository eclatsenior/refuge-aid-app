import { useMemo } from "react";
import { StatusHeart } from "./StatusHeart";
import { Card, CardContent } from "@/components/ui/card";
import type { CheckIn } from "@/store/useAppStore";
import { useTranslation } from "react-i18next";
import { format, isSameDay } from "date-fns";
import { getDateFnsLocale } from "@/lib/dateUtils";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface DayHeartDetailProps {
  date: Date;
  checkIns: CheckIn[];
}

export function DayHeartDetail({ date, checkIns }: DayHeartDetailProps) {
  const { t, i18n } = useTranslation("tracking");
  const locale = getDateFnsLocale(i18n.language);

  const dayCheckIns = useMemo(
    () => checkIns.filter((c) => isSameDay(new Date(c.timestamp), date)),
    [checkIns, date]
  );

  const stats = useMemo(() => {
    const ok = dayCheckIns.filter((c) => c.status === "ok").length;
    const anxious = dayCheckIns.filter((c) => c.status === "anxious").length;
    const alert = dayCheckIns.filter((c) => c.status === "alert").length;
    const total = ok + anxious + alert;
    return { ok, anxious, alert, total };
  }, [dayCheckIns]);

  const dateLabel = format(date, "EEEE, d MMMM", { locale });

  return (
    <Card className="bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <CardContent className="pt-6 space-y-4">
        <p className="text-center font-semibold text-lg capitalize text-foreground">
          {dateLabel}
        </p>

        {stats.total === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            {t("summary.noRecords")}
          </p>
        ) : (
          <>
            <div className="flex justify-center py-2">
              <StatusHeart
                stable={stats.total > 0 ? stats.ok / stats.total : 0}
                anxious={stats.total > 0 ? stats.anxious / stats.total : 0}
                alert={stats.total > 0 ? stats.alert / stats.total : 0}
                size={200}
                strokeWidth={14}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-mint/10 border border-mint/20 p-3 flex flex-col items-center gap-1">
                <CheckCircle className="h-5 w-5 text-mint" />
                <span className="text-xl font-bold text-mint">{stats.ok}</span>
                <span className="text-xs text-muted-foreground">{t("status.stable.label")}</span>
              </div>
              <div className="rounded-xl bg-coral/10 border border-coral/20 p-3 flex flex-col items-center gap-1">
                <Clock className="h-5 w-5 text-coral" />
                <span className="text-xl font-bold text-coral">{stats.anxious}</span>
                <span className="text-xs text-muted-foreground">{t("status.anxious.label")}</span>
              </div>
              <div className="rounded-xl bg-emergency/10 border border-emergency/20 p-3 flex flex-col items-center gap-1">
                <AlertCircle className="h-5 w-5 text-emergency" />
                <span className="text-xl font-bold text-emergency">{stats.alert}</span>
                <span className="text-xs text-muted-foreground">{t("status.alert.label")}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
