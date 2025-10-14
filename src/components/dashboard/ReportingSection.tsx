import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { KPIsTab } from "./reports/KPIsTab";
import { IncidentsTab } from "./reports/IncidentsTab";
import { RiskAnalysisTab } from "./reports/RiskAnalysisTab";
import { MoodTab } from "./reports/MoodTab";
import { TrainingTab } from "./reports/TrainingTab";
import { ReportGenerationDialog } from "./reports/ReportGenerationDialog";

interface ReportingSectionProps {
  employees: any[];
  alerts: any[];
}

export function ReportingSection({ employees, alerts }: ReportingSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Reporting Detallado</h2>
          <p className="text-muted-foreground">Análisis completo y generación de reportes</p>
        </div>
        <ReportGenerationDialog />
      </div>

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
          <TabsTrigger value="riesgo">Riesgo</TabsTrigger>
          <TabsTrigger value="animo">Ánimo</TabsTrigger>
          <TabsTrigger value="formacion">Formación</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <KPIsTab employees={employees} />
        </TabsContent>

        <TabsContent value="incidentes">
          <IncidentsTab />
        </TabsContent>

        <TabsContent value="riesgo">
          <RiskAnalysisTab employees={employees} />
        </TabsContent>

        <TabsContent value="animo">
          <MoodTab employees={employees} />
        </TabsContent>

        <TabsContent value="formacion">
          <TrainingTab employees={employees} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
