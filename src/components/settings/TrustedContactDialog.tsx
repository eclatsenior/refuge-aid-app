import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { TrustedContact } from "@/store/useAppStore";

const phoneRegex = /^(\+34|0034)?[6-9]\d{8}$/;

const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  phone: z.string().regex(phoneRegex, "Formato de teléfono inválido. Ejemplo: +34612345678 o 612345678"),
  relationship: z.string().min(1, "Selecciona una relación"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface TrustedContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: TrustedContact;
}

const relationships = [
  { value: "pareja", label: "Pareja" },
  { value: "familiar", label: "Familiar" },
  { value: "amiga", label: "Amiga" },
  { value: "terapeuta", label: "Terapeuta" },
  { value: "otro", label: "Otro" },
];

export function TrustedContactDialog({
  open,
  onOpenChange,
  contact,
}: TrustedContactDialogProps) {
  const { addTrustedContact, updateTrustedContact, trustedContacts } = useAppStore();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact?.name || "",
      phone: contact?.phone || "",
      relationship: contact?.relationship || "",
    },
  });

  const onSubmit = (values: ContactFormValues) => {
    // Check for max contacts (5)
    if (!contact && trustedContacts.length >= 5) {
      toast.error("Máximo de 5 contactos de emergencia alcanzado");
      return;
    }

    // Normalize phone number
    let normalizedPhone = values.phone.trim();
    if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = normalizedPhone.startsWith("0034")
        ? `+${normalizedPhone.slice(2)}`
        : `+34${normalizedPhone}`;
    }

    // Check for duplicate phone (only if not editing the same contact)
    const isDuplicate = trustedContacts.some(
      (c) => c.phone === normalizedPhone && c.id !== contact?.id
    );

    if (isDuplicate) {
      toast.error("Este número de teléfono ya está registrado");
      return;
    }

    const contactData = {
      name: values.name.trim(),
      phone: normalizedPhone,
      relationship: values.relationship,
    };

    if (contact) {
      updateTrustedContact(contact.id, contactData);
      toast.success("✅ Contacto actualizado correctamente");
    } else {
      addTrustedContact(contactData);
      toast.success("✅ Contacto añadido correctamente");
    }

    form.reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Editar Contacto" : "Añadir Contacto de Emergencia"}
          </DialogTitle>
          <DialogDescription>
            Este contacto recibirá SMS y WhatsApp en caso de emergencia
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="María García" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+34 612 345 678"
                      type="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relación *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relationships.map((rel) => (
                        <SelectItem key={rel.value} value={rel.value}>
                          {rel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
