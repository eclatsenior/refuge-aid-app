import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { useReportGeneration } from "@/hooks/useReportGeneration";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useTranslation } from "react-i18next";

export function ReportGenerationDialog() {
  const { t } = useTranslation('dashboard');
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("last_week");
  const { generatePDF, isGenerating } = useReportGeneration();

  const handleGenerate = async () => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'last_week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    await generatePDF({ start: startDate, end: now });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <FileText className="h-5 w-5" />
          {t('reporting.generatePDF')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('reporting.generatePDF')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('reporting.period')}</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder={t('reporting.selectPeriod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_week">{t('reporting.lastWeek')}</SelectItem>
                <SelectItem value="last_month">{t('reporting.lastMonth')}</SelectItem>
                <SelectItem value="last_quarter">{t('reporting.lastQuarter')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner />
                {t('reporting.generatingPDF')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t('reporting.downloadPDF')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
