import { useState } from "react";
import { Pencil, Trash2, Phone, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { TrustedContact } from "@/store/useAppStore";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { TrustedContactDialog } from "./TrustedContactDialog";

interface TrustedContactCardProps {
  contact: TrustedContact;
}

export function TrustedContactCard({ contact }: TrustedContactCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { deleteTrustedContact } = useAppStore();

  const handleDelete = () => {
    deleteTrustedContact(contact.id);
    toast.success("Contacto eliminado");
    setShowDeleteDialog(false);
  };

  const relationshipEmoji: Record<string, string> = {
    pareja: "💑",
    familiar: "👨‍👩‍👧‍👦",
    amiga: "👥",
    terapeuta: "🩺",
    otro: "👤",
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{contact.name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{contact.phone}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span>{relationshipEmoji[contact.relationship] || "👤"}</span>
                <span className="capitalize text-muted-foreground">
                  {contact.relationship}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditDialog(true)}
                aria-label="Editar contacto"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                aria-label="Eliminar contacto"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás segura de que quieres eliminar a <strong>{contact.name}</strong>? 
              Esta persona dejará de recibir tus alertas de emergencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <TrustedContactDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        contact={contact}
      />
    </>
  );
}
