import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, Mail, User, Key, Loader2, Copy, Check, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

const registerEmployeeSchema = z.object({
  fullName: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres")
    .trim(),
  email: z.string()
    .email("Email inválido")
    .max(255, "El email no puede superar los 255 caracteres")
    .trim(),
  phone: z.string()
    .regex(/^(\+34|0034|34)?[6789]\d{8}$/, "Número de teléfono español inválido (ej: +34612345678)")
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede superar los 100 caracteres"),
});

type RegisterEmployeeFormData = z.infer<typeof registerEmployeeSchema>;

interface RegisterEmployeeDialogProps {
  onEmployeeRegistered?: () => void;
}

export function RegisterEmployeeDialog({ onEmployeeRegistered }: RegisterEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { registerEmployee, canAddEmployee, subscription } = useAppStore();
  const { toast } = useToast();

  const form = useForm<RegisterEmployeeFormData>({
    resolver: zodResolver(registerEmployeeSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    form.setValue("password", password);
    setCopied(false);
  };

  const copyPassword = async () => {
    const password = form.getValues("password");
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast({
        title: "Contraseña copiada",
        description: "La contraseña ha sido copiada al portapapeles"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onSubmit = async (data: RegisterEmployeeFormData) => {
    if (!canAddEmployee()) {
      toast({
        title: "Límite alcanzado",
        description: `Has alcanzado el límite de ${subscription?.employee_limit} empleadas de tu plan.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await registerEmployee({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        password: data.password,
      });

      toast({
        title: "¡Empleada registrada!",
        description: `${data.fullName} ha sido registrada exitosamente.`,
      });

      form.reset();
      setOpen(false);
      
      if (onEmployeeRegistered) {
        onEmployeeRegistered();
      }
    } catch (error: any) {
      toast({
        title: "Error al registrar empleada",
        description: error.message || "Hubo un problema al registrar la empleada",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAtLimit = !canAddEmployee();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="gap-2"
          disabled={isAtLimit}
          title={isAtLimit ? `Límite de ${subscription?.employee_limit} empleadas alcanzado` : ''}
        >
          <UserPlus className="h-4 w-4" />
          Registrar Nueva Empleada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Registrar Nueva Empleada
          </DialogTitle>
          <DialogDescription>
            Completa los datos para crear una nueva empleada. Se asignará automáticamente a tu equipo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Ej: María García López" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email"
                        placeholder="maria.garcia@ejemplo.com" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
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
                  <FormLabel>Teléfono (Opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="tel"
                        placeholder="+34612345678 o 612345678" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Para llamadas y mensajes de emergencia
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Contraseña Temporal</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generatePassword}
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    >
                      Generar automática
                    </Button>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="text"
                        placeholder="Mínimo 8 caracteres" 
                        className="pl-10 pr-10 font-mono text-sm"
                        {...field} 
                      />
                      {field.value && (
                        <button
                          type="button"
                          onClick={copyPassword}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          title="Copiar contraseña"
                        >
                          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Esta contraseña será proporcionada a la empleada para su primer acceso.
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                      💡 Importante: Distingue mayúsculas/minúsculas y no tiene espacios.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrar Empleada
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
