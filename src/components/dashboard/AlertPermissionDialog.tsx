import { useState } from "react";
import { Bell, Volume2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function AlertPermissionDialog({
  open,
  onOpenChange,
  onAccept,
  onDecline
}: AlertPermissionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Habilitar Alertas Sonoras
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Para garantizar que recibas alertas de emergencia de tus empleadas de manera inmediata,
              necesitamos tu permiso para:
            </p>
            <div className="space-y-3 pl-4">
              <div className="flex items-start gap-2">
                <Volume2 className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Reproducir alertas sonoras</p>
                  <p className="text-sm text-muted-foreground">
                    Escucharás un sonido cuando llegue una alerta de emergencia
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Enviar notificaciones</p>
                  <p className="text-sm text-muted-foreground">
                    Recibirás notificaciones incluso si no estás viendo el dashboard
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Puedes cambiar estos permisos en cualquier momento desde la configuración de tu navegador.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline}>
            Ahora no
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>
            Habilitar alertas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
