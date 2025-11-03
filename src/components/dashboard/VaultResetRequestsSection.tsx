import { ShieldAlert, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VaultResetApprovalCard, VaultResetRequest } from "./VaultResetApprovalCard";
import { useToast } from "@/hooks/use-toast";

interface VaultResetRequestsSectionProps {
  requests: VaultResetRequest[];
  onApprove: (requestId: string, notes?: string) => Promise<void>;
  onReject: (requestId: string, notes?: string) => Promise<void>;
}

export function VaultResetRequestsSection({ 
  requests, 
  onApprove, 
  onReject 
}: VaultResetRequestsSectionProps) {
  const { toast } = useToast();

  if (requests.length === 0) {
    return null;
  }

  const handleApprove = async (requestId: string, notes?: string) => {
    try {
      await onApprove(requestId, notes);
      toast({
        title: "✅ Solicitud aprobada",
        description: "La empleada recibirá una notificación para establecer su nueva contraseña",
      });
    } catch (error: any) {
      toast({
        title: "❌ Error al aprobar",
        description: error.message || "No se pudo aprobar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string, notes?: string) => {
    try {
      await onReject(requestId, notes);
      toast({
        title: "Solicitud rechazada",
        description: "La empleada ha sido notificada",
      });
    } catch (error: any) {
      toast({
        title: "❌ Error al rechazar",
        description: error.message || "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Solicitudes de Reset de Caja Fuerte
              <Badge variant="destructive" className="ml-2">
                {requests.length}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Revisa y aprueba las solicitudes pendientes de tus empleadas
            </p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-1 text-sm text-blue-900 dark:text-blue-200">
          <p className="font-medium">Sobre las solicitudes de reset:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Aprobación directa:</strong> La empleada solicita que tú apruebes su reset directamente</li>
            <li><strong>Verificación de identidad:</strong> La empleada subió un documento de identidad para verificación</li>
            <li>Una vez aprobado, la empleada tendrá <strong>30 minutos</strong> para establecer su nueva contraseña</li>
            <li>Las notas antiguas cifradas <strong>NO se podrán recuperar</strong> después del reset</li>
          </ul>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <VaultResetApprovalCard
            key={request.id}
            request={request}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>
    </section>
  );
}
