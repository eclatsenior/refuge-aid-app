import { useState } from "react";
import { Shield, Clock, FileText, CheckCircle, XCircle, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export interface VaultResetRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  requested_at: string;
  id_document_url?: string;
  notes?: string;
  employee_name: string;
  employee_email: string;
  employee_avatar?: string;
}

interface VaultResetApprovalCardProps {
  request: VaultResetRequest;
  onApprove: (requestId: string, notes?: string) => Promise<void>;
  onReject: (requestId: string, notes?: string) => Promise<void>;
}

export function VaultResetApprovalCard({ request, onApprove, onReject }: VaultResetApprovalCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [leadNotes, setLeadNotes] = useState("");
  const [showIdDialog, setShowIdDialog] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(request.id, leadNotes);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(request.id, leadNotes);
    } finally {
      setIsRejecting(false);
    }
  };

  const getRequestTypeBadge = (type: string) => {
    if (type === 'lead_approved') {
      return <Badge variant="default">Aprobación directa</Badge>;
    }
    return <Badge variant="secondary">Verificación de identidad</Badge>;
  };

  const timeAgo = formatDistanceToNow(new Date(request.requested_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {request.employee_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                {request.employee_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{request.employee_email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getRequestTypeBadge(request.request_type)}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Request Info */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Solicitud de reset de Caja Fuerte</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Solicitado: {new Date(request.requested_at).toLocaleString('es-ES')}</span>
          </div>
          {request.notes && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground italic">"{request.notes}"</p>
            </div>
          )}
        </div>

        {/* ID Document if exists */}
        {request.request_type === 'id_verification' && request.id_document_url && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIdDialog(true)}
              className="gap-2"
            >
              Ver documento de identidad
            </Button>
          </div>
        )}

        {/* Lead Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notas internas (opcional)</label>
          <Textarea
            placeholder="Agrega cualquier comentario sobre esta aprobación..."
            value={leadNotes}
            onChange={(e) => setLeadNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            ⚠️ <strong>Importante:</strong> Al aprobar, la empleada tendrá 30 minutos para establecer una nueva contraseña.
            Las notas antiguas cifradas NO podrán recuperarse.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* Reject Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                disabled={isApproving || isRejecting}
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Rechazar solicitud?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se notificará a {request.employee_name} que su solicitud de reset de Caja Fuerte ha sido rechazada.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReject} disabled={isRejecting}>
                  {isRejecting ? "Rechazando..." : "Rechazar solicitud"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Approve Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="flex-1 gap-2"
                disabled={isApproving || isRejecting}
              >
                <CheckCircle className="h-4 w-4" />
                Aprobar reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Aprobar reset de Caja Fuerte?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>Al aprobar esta solicitud:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{request.employee_name} recibirá una notificación inmediata</li>
                    <li>Tendrá 30 minutos para establecer una nueva contraseña</li>
                    <li>Las notas antiguas cifradas NO se podrán recuperar</li>
                    <li>Esta acción quedará registrada en el sistema</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
                  {isApproving ? "Aprobando..." : "Aprobar reset"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>

      {/* ID Document Preview Dialog */}
      {request.id_document_url && (
        <AlertDialog open={showIdDialog} onOpenChange={setShowIdDialog}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Documento de identidad</AlertDialogTitle>
              <AlertDialogDescription>
                Verifica el documento antes de aprobar la solicitud
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <img
                src={request.id_document_url}
                alt="Documento de identidad"
                className="w-full h-auto rounded-lg border"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowIdDialog(false)}>
                Cerrar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
