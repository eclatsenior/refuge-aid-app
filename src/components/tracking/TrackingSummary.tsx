import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { StatusHeart } from "./StatusHeart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CheckIn } from "@/store/useAppStore";
import { useTranslation } from "react-i18next";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths, addYears, subWeeks, subMonths, subYears, format, eachDayOfInterval, isSameDay } from "date-fns";
import { getDateFnsLocale } from "@/lib/dateUtils";

type PeriodType = "week" | "month" | "year";

interface TrackingSummaryProps {
  checkIns: CheckIn[];
}

// SVG pie-circle for multi-status days
function StatusPieCircle({ statuses, isToday }: { statuses: string[]; isToday: boolean }) {
  const size = 32;
  const r = 12;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const colorMap: Record<string, string> = {
    ok: "hsl(var(--mint))",
    anxious: "hsl(var(--coral))",
    alert: "hsl(var(--emergency))",
  };

  // Count each status
  const counts: Record<string, number> = {};
  statuses.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const total = statuses.length;
  const segments = Object.entries(counts);

  let offset = 0;

  return (
    <svg width={size} height={size} className={isToday ? "ring-2 ring-primary/20 rounded-full" : ""}>
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={isToday ? "hsl(var(--primary))" : "hsl(var(--border))"} strokeWidth="2" />
      {segments.map(([status, count], i) => {
        const segLength = (count / total) * circumference;
        const seg = (
          <circle
            key={status}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={colorMap[status] || "hsl(var(--muted))"}
            strokeWidth="6"
            strokeDasharray={`${segLength} ${circumference - segLength}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += segLength;
        return seg;
      })}
    </svg>
  );
}

export function TrackingSummary({ checkIns }: TrackingSummaryProps) {
  const { t, i18n } = useTranslation("tracking");
  const locale = getDateFnsLocale(i18n.language);
  const [periodType, setPeriodType] = useState<PeriodType>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const { start, end } = useMemo(() => {
    switch (periodType) {
      case "week":
        return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
      case "month":
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      case "year":
        return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
    }
  }, [periodType, currentDate]);

  const days = useMemo(() => eachDayOfInterval({ start, end }), [start, end]);

  const periodLabel = useMemo(() => {
    switch (periodType) {
      case "week":
        return `${format(start, "d MMM", { locale })} - ${format(end, "d MMM yyyy", { locale })}`;
      case "month":
        return format(start, "MMMM yyyy", { locale });
      case "year":
        return format(start, "yyyy", { locale });
    }
  }, [start, end, periodType, locale]);

  const navigate = (dir: -1 | 1) => {
    const fn = dir === -1
      ? periodType === "week" ? subWeeks : periodType === "month" ? subMonths : subYears
      : periodType === "week" ? addWeeks : periodType === "month" ? addMonths : addYears;
    setCurrentDate(fn(currentDate, 1));
  };

  // Get ALL check-ins for a date (multiple per day)
  const getCheckInsForDate = (date: Date) =>
    checkIns.filter(c => isSameDay(new Date(c.timestamp), date));

  // Count all check-ins in the period (not unique per day)
  const periodAllCheckIns = useMemo(() =>
    checkIns.filter(c => {
      const d = new Date(c.timestamp);
      return d >= start && d <= end;
    }),
    [checkIns, start, end]
  );

  const stats = useMemo(() => ({
    ok: periodAllCheckIns.filter(c => c.status === "ok").length,
    anxious: periodAllCheckIns.filter(c => c.status === "anxious").length,
    alert: periodAllCheckIns.filter(c => c.status === "alert").length,
    total: periodAllCheckIns.length,
  }), [periodAllCheckIns]);

  const showDayDots = periodType === "week";

  const renderDayDot = (date: Date) => {
    const isToday = isSameDay(date, new Date());
    const dayCheckIns = getCheckInsForDate(date);

    if (dayCheckIns.length === 0) {
      return (
        <div className={`w-8 h-8 rounded-full bg-muted/50 border-2 ${isToday ? "border-primary ring-2 ring-primary/20" : "border-border"} flex items-center justify-center`}>
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
        </div>
      );
    }

    const uniqueStatuses = new Set(dayCheckIns.map(c => c.status));

    // Single status: solid color circle with icon
    if (uniqueStatuses.size === 1) {
      const status = dayCheckIns[0].status;
      const colors = status === "ok"
        ? "bg-gradient-to-br from-mint to-mint/80"
        : status === "anxious"
          ? "bg-gradient-to-br from-coral to-coral/80"
          : "bg-gradient-to-br from-emergency to-emergency/80";
      const Icon = status === "ok" ? CheckCircle : status === "anxious" ? Clock : AlertCircle;
      return (
        <div className={`w-8 h-8 rounded-full ${colors} ${isToday ? "ring-2 ring-primary/20" : ""} flex items-center justify-center shadow-sm`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      );
    }

    // Multiple statuses: pie circle
    return <StatusPieCircle statuses={dayCheckIns.map(c => c.status)} isToday={isToday} />;
  };

  return (
    <Card className="bg-gradient-card backdrop-blur-sm border-white/20 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-cyan" />
            </div>
            {t("summary.title")}
          </CardTitle>
          <Select value={periodType} onValueChange={(v) => { setPeriodType(v as PeriodType); setCurrentDate(new Date()); }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t("summary.week")}</SelectItem>
              <SelectItem value="month">{t("summary.month")}</SelectItem>
              <SelectItem value="year">{t("summary.year")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Period navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-foreground capitalize">{periodLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Day dots (only for week view) */}
        {showDayDots && (
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">
                  {format(date, "EEE", { locale }).slice(0, 3)}
                </span>
                <span className="text-sm font-semibold">{date.getDate()}</span>
                {renderDayDot(date)}
              </div>
            ))}
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-mint/10 border border-mint/20 p-4 flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-mint/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-mint" />
            </div>
            <span className="text-2xl font-bold text-mint">{stats.ok}</span>
            <span className="text-xs text-muted-foreground font-medium">{t("status.stable.label")}</span>
          </div>
          <div className="rounded-xl bg-coral/10 border border-coral/20 p-4 flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-coral/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-coral" />
            </div>
            <span className="text-2xl font-bold text-coral">{stats.anxious}</span>
            <span className="text-xs text-muted-foreground font-medium">{t("status.anxious.label")}</span>
          </div>
          <div className="rounded-xl bg-emergency/10 border border-emergency/20 p-4 flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-emergency/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-emergency" />
            </div>
            <span className="text-2xl font-bold text-emergency">{stats.alert}</span>
            <span className="text-xs text-muted-foreground font-medium">{t("status.alert.label")}</span>
          </div>
        </div>

        {/* Heart visualization with 3 rings */}
        {stats.total > 0 && (
          <div className="flex justify-center py-2">
            <StatusHeart
              stable={stats.total > 0 ? stats.ok / stats.total : 0}
              anxious={stats.total > 0 ? stats.anxious / stats.total : 0}
              alert={stats.total > 0 ? stats.alert / stats.total : 0}
              size={140}
            />
          </div>
        )}

        {/* Total */}
        <p className="text-center text-sm text-muted-foreground">
          {t("summary.totalRecords", { count: stats.total })}
        </p>
      </CardContent>
    </Card>
  );
}
