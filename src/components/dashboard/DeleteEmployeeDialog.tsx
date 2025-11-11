import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppStore, type EmployeeStatus } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface DeleteEmployeeDialogProps {
  employee: EmployeeStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onEmployeeDeleted?: () => void;
}

export function DeleteEmployeeDialog({ 
  employee, 
  isOpen, 
  onClose, 
  onEmployeeDeleted 
}: DeleteEmployeeDialogProps) {
  const { t } = useTranslation('employees');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const { deleteEmployee } = useAppStore();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!employee) return;

    if (confirmName !== employee.employee_name) {
      toast({
        title: t('delete.confirmError'),
        description: t('delete.confirmError'),
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEmployee(employee.employee_id);

      toast({
        title: t('notifications.deleted'),
        description: t('notifications.deletedDesc', { name: employee.employee_name }),
      });

      setConfirmName("");
      onClose();
      
      if (onEmployeeDeleted) {
        onEmployeeDeleted();
      }
    } catch (error: any) {
      toast({
        title: t('notifications.errorDeleting'),
        description: error.message || t('notifications.errorDeletingDesc'),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmName("");
    onClose();
  };

  const isConfirmValid = employee && confirmName === employee.employee_name;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('delete.title')}
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p className="font-medium">{t('delete.description')}</p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Box */}
          <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-destructive">{t('delete.warning')}</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>{t('delete.warningMessages')}</li>
                  <li>{t('delete.warningStatus')}</li>
                  <li>{t('delete.warningAccess')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          {employee && (
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground mb-1">{t('delete.employeeToDelete')}</p>
              <p className="font-medium">{employee.employee_name}</p>
              <p className="text-sm text-muted-foreground">{employee.employee_email}</p>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmName" className="text-sm font-medium">
              {t('delete.confirmLabel')}
            </Label>
            <Input
              id="confirmName"
              type="text"
              placeholder={t('delete.confirmPlaceholder')}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              disabled={isDeleting}
              className="font-medium"
            />
            <p className="text-xs text-muted-foreground">
              {t('delete.confirmHint', { name: employee?.employee_name })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              {t('delete.cancel')}
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmValid || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('delete.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('delete.delete')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
