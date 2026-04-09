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
import { useTranslation } from "react-i18next";

const registerEmployeeSchema = z.object({
  fullName: z.string()
    .min(3)
    .max(100)
    .trim(),
  email: z.string()
    .email()
    .max(255)
    .trim(),
  phone: z.string().optional().default(''),
  password: z.string()
    .min(8)
    .max(100),
});

type RegisterEmployeeFormData = z.infer<typeof registerEmployeeSchema>;

interface RegisterEmployeeDialogProps {
  onEmployeeRegistered?: () => void;
}

export function RegisterEmployeeDialog({ onEmployeeRegistered }: RegisterEmployeeDialogProps) {
  const { t } = useTranslation('dashboard');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { registerEmployee, canAddEmployee, subscription } = useAppStore();
  const { toast } = useToast();

  const form = useForm<RegisterEmployeeFormData>({
    resolver: zodResolver(registerEmployeeSchema.superRefine((data, ctx) => {
      if (data.fullName.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('registerEmployee.validations.nameMin'),
          path: ['fullName']
        });
      }
      if (data.fullName.length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('registerEmployee.validations.nameMax'),
          path: ['fullName']
        });
      }
      if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('registerEmployee.validations.emailInvalid'),
          path: ['email']
        });
      }
      if (data.email.length > 255) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('registerEmployee.validations.emailMax'),
          path: ['email']
        });
      }
      if (data.phone && !/^(\+34|0034|34)?[6789]\d{8}$/.test(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('registerEmployee.validations.phoneInvalid'),
          path: ['phone']
        });
      }
      if (data.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('registerEmployee.validations.passwordMin'),
          path: ['password']
        });
      }
      if (data.password.length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('registerEmployee.validations.passwordMax'),
          path: ['password']
        });
      }
    })),
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
        title: t('registerEmployee.passwordCopied'),
        description: t('registerEmployee.passwordCopiedDesc')
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onSubmit = async (data: RegisterEmployeeFormData) => {
    if (!canAddEmployee()) {
      toast({
        title: t('registerEmployee.limitReached'),
        description: t('registerEmployee.limitReachedDesc', { limit: subscription?.employee_limit }),
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
        title: t('registerEmployee.employeeRegistered'),
        description: t('registerEmployee.employeeRegisteredDesc', { name: data.fullName }),
      });

      form.reset();
      setOpen(false);
      
      if (onEmployeeRegistered) {
        onEmployeeRegistered();
      }
    } catch (error: any) {
      const errorMsg = error.message || '';
      const isDuplicate = errorMsg.includes('ya está registrado') || errorMsg.includes('already registered');
      
      toast({
        title: isDuplicate 
          ? t('registerEmployee.duplicateEmail', 'Email ya registrado')
          : t('registerEmployee.errorRegistering'),
        description: isDuplicate
          ? t('registerEmployee.duplicateEmailDesc', 'Este email ya existe en el sistema. Usa otro email para registrar a la empleada.')
          : errorMsg || t('registerEmployee.errorRegisteringDesc'),
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
          title={isAtLimit ? t('registerEmployee.limitTooltip', { limit: subscription?.employee_limit }) : ''}
        >
          <UserPlus className="h-4 w-4" />
          {t('registerEmployee.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('registerEmployee.title')}
          </DialogTitle>
          <DialogDescription>
            {t('registerEmployee.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
              <FormItem>
                <FormLabel>{t('registerEmployee.fullName')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={t('registerEmployee.fullNamePlaceholder')}
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
                <FormLabel>{t('registerEmployee.email')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email"
                      placeholder={t('registerEmployee.emailPlaceholder')}
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
                <FormLabel>{t('registerEmployee.phone')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="tel"
                      placeholder={t('registerEmployee.phonePlaceholder')}
                      className="pl-10"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  {t('registerEmployee.phoneHelp')}
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
                  <FormLabel>{t('registerEmployee.temporaryPassword')}</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generatePassword}
                    className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  >
                    {t('registerEmployee.generateAuto')}
                  </Button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="text"
                      placeholder={t('registerEmployee.passwordPlaceholder')}
                      className="pl-10 pr-10 font-mono text-sm"
                      {...field} 
                    />
                    {field.value && (
                      <button
                        type="button"
                        onClick={copyPassword}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        title={t('registerEmployee.passwordCopied')}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {t('registerEmployee.passwordWarning')}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                    {t('registerEmployee.passwordImportant')}
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
                {t('registerEmployee.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('registerEmployee.registering')}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('registerEmployee.register')}
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
