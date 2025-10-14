import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ReportPDFDocument } from "@/components/dashboard/reports/ReportPDFDocument";
import { useToast } from "@/hooks/use-toast";

export function useReportGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async (period: { start: Date; end: Date }) => {
    setIsGenerating(true);
    try {
      // Fetch report data
      const { data, error } = await supabase.functions.invoke('get-report-data', {
        body: { 
          period_start: period.start.toISOString(), 
          period_end: period.end.toISOString() 
        }
      });

      if (error) throw error;

      // Generate PDF blob
      const pdfDocument = ReportPDFDocument({ data });
      const blob = await pdf(pdfDocument).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `refugi-report-${format(period.start, 'yyyy-MM-dd')}-${format(period.end, 'yyyy-MM-dd')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Reporte generado",
        description: "El PDF se ha descargado correctamente",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePDF, isGenerating };
}
