import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Heart, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConsecutiveAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoTherapy: () => void;
  onGoNotes: () => void;
}

export function ConsecutiveAlertDialog({
  open,
  onOpenChange,
  onGoTherapy,
  onGoNotes,
}: ConsecutiveAlertDialogProps) {
  const { t } = useTranslation("tracking");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-coral/20 flex items-center justify-center">
              <Heart className="h-8 w-8 text-coral" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            {t("consecutiveAlert.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base leading-relaxed">
            {t("consecutiveAlert.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-3 sm:flex-col">
          <AlertDialogAction
            onClick={onGoTherapy}
            className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12"
          >
            <Heart className="h-4 w-4 mr-2" />
            {t("consecutiveAlert.goTherapy")}
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onGoNotes}
            className="w-full bg-coral hover:bg-coral/90 rounded-xl h-12"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t("consecutiveAlert.goNotes")}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full rounded-xl h-12 mt-0">
            {t("consecutiveAlert.dismiss")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
