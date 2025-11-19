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
      console.log('[PDF-GENERATION] Fetching report data...', {
        period_start: period.start.toISOString(),
        period_end: period.end.toISOString()
      });

      // Fetch report data
      const { data, error } = await supabase.functions.invoke('get-report-data', {
        body: { 
          period_start: period.start.toISOString(), 
          period_end: period.end.toISOString() 
        }
      });

      if (error) {
        console.error('[PDF-GENERATION] Edge function error:', error);
        throw error;
      }

      if (!data) {
        console.error('[PDF-GENERATION] No data returned from edge function');
        throw new Error('No se recibieron datos del servidor');
      }

      console.log('[PDF-GENERATION] Data received:', {
        incidents: data.incidents?.length || 0,
        alerts: data.emergencyAlerts?.length || 0,
        employees: data.employeeProfiles?.length || 0,
        moodCheckins: data.moodCheckins?.length || 0,
        riskScores: data.riskScores?.length || 0,
        trainingCompletions: data.trainingCompletions?.length || 0,
        cases: data.cases?.length || 0,
        psychReferrals: data.psychReferrals?.length || 0,
        timeline: data.timeline?.length || 0
      });

      // Validate essential data structure
      if (!data.metadata || !data.statistics) {
        console.error('[PDF-GENERATION] Invalid data structure:', data);
        throw new Error('Estructura de datos inválida');
      }

      console.log('[PDF-GENERATION] Generating PDF document...');

      // Generate PDF blob
      const pdfDocument = ReportPDFDocument({ data });
      const blob = await pdf(pdfDocument).toBlob();

      console.log('[PDF-GENERATION] PDF generated, size:', blob.size, 'bytes');

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `refugi-report-${format(period.start, 'yyyy-MM-dd')}-${format(period.end, 'yyyy-MM-dd')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      console.log('[PDF-GENERATION] PDF downloaded successfully');

      toast({
        title: "Reporte generado",
        description: `PDF descargado con ${data.employeeProfiles?.length || 0} empleadas`,
      });
    } catch (error: any) {
      console.error('[PDF-GENERATION] Error:', error);
      toast({
        title: "Error al generar reporte",
        description: error.message || "No se pudo generar el reporte",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePDF, isGenerating };
}
