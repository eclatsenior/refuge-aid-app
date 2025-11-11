import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Edit, Mail, User, Loader2, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore, type EmployeeStatus } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const editEmployeeSchema = z.object({
  fullName: z.string()
    .min(3)
    .max(100)
    .trim(),
  email: z.string()
    .email()
    .max(255)
    .trim(),
  phone: z.string()
    .regex(/^(\+34|0034|34)?[6789]\d{8}$/)
    .optional()
    .or(z.literal('')),
});

type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

interface EditEmployeeDialogProps {
  employee: EmployeeStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onEmployeeUpdated?: () => void;
}

export function EditEmployeeDialog({ 
  employee, 
  isOpen, 
  onClose, 
  onEmployeeUpdated 
}: EditEmployeeDialogProps) {
  const { t } = useTranslation('employees');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateEmployee } = useAppStore();
  const { toast } = useToast();

  const form = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema.superRefine((data, ctx) => {
      if (data.fullName.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('edit.validations.nameMin'),
          path: ['fullName']
        });
      }
      if (data.fullName.length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('edit.validations.nameMax'),
          path: ['fullName']
        });
      }
      if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('edit.validations.emailInvalid'),
          path: ['email']
        });
      }
      if (data.email.length > 255) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('edit.validations.emailMax'),
          path: ['email']
        });
      }
      if (data.phone && !/^(\+34|0034|34)?[6789]\d{8}$/.test(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('edit.validations.phoneInvalid'),
          path: ['phone']
        });
      }
    })),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
    },
  });

  // Rellenar formulario cuando cambia el empleado
  useEffect(() => {
    if (employee) {
      form.reset({
        fullName: employee.employee_name || "",
        email: employee.employee_email || "",
        phone: employee.employee_phone || "",
      });
    }
  }, [employee, form]);

  const onSubmit = async (data: EditEmployeeFormData) => {
    if (!employee) return;

    setIsSubmitting(true);
    try {
      await updateEmployee(employee.employee_id, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      });

      toast({
        title: t('notifications.updated'),
        description: t('notifications.updatedDesc', { name: data.fullName }),
      });

      onClose();
      
      if (onEmployeeUpdated) {
        onEmployeeUpdated();
      }
    } catch (error: any) {
      toast({
        title: t('notifications.errorUpdating'),
        description: error.message || t('notifications.errorUpdatingDesc'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {t('edit.title')}
          </DialogTitle>
          <DialogDescription>
            {t('edit.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
              <FormItem>
                <FormLabel>{t('edit.fullName')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={t('register.fullNamePlaceholder')}
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
                <FormLabel>{t('edit.email')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email"
                      placeholder={t('register.emailPlaceholder')}
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
                <FormLabel>{t('edit.phone')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="tel"
                      placeholder={t('register.phonePlaceholder')}
                      className="pl-10"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t('edit.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('edit.saving')}
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('edit.save')}
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
