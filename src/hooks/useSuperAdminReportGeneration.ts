import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SuperAdminReportPDFDocument } from '@/components/super-admin/SuperAdminReportPDFDocument';
import type { ReactElement } from 'react';

export function useSuperAdminReportGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch all report data from edge function
      const { data, error } = await supabase.functions.invoke('super-admin-data', {
        body: { action: 'get_full_report_data' }
      });

      if (error) throw error;

      // Generate PDF
      const pdfDocument = SuperAdminReportPDFDocument({ data }) as ReactElement;
      const blob = await pdf(pdfDocument).toBlob();
      
      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `control-maestro-reporte-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Reporte generado",
        description: "El PDF se ha descargado correctamente",
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
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
