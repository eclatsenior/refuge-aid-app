import { TrustedContactCard } from "./TrustedContactCard";
import { useAppStore } from "@/store/useAppStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface TrustedContactsListProps {
  onAddContact: () => void;
}

export function TrustedContactsList({ onAddContact }: TrustedContactsListProps) {
  const { trustedContacts } = useAppStore();

  if (trustedContacts.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No tienes contactos de emergencia. Añade al menos uno para que pueda recibir tus alertas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {trustedContacts.map((contact) => (
        <TrustedContactCard key={contact.id} contact={contact} />
      ))}
      
      {trustedContacts.length >= 5 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Has alcanzado el máximo de 5 contactos de emergencia
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
