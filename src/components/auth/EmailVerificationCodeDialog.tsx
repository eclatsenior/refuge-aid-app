import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';

interface EmailVerificationCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  userName: string;
  onSuccess: () => void;
}

export function EmailVerificationCodeDialog({ 
  open, 
  onOpenChange, 
  email,
  userName,
  onSuccess 
}: EmailVerificationCodeDialogProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation('common');

  const handleVerifyCode = async () => {
    if (code.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-email-code', {
        body: { email, code }
      });

      if (verifyError || !data?.success) {
        setError(t('auth.emailVerification.invalidCode'));
        toast({
          title: "Error",
          description: t('auth.emailVerification.invalidCode'),
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ " + t('auth.emailVerification.verificationSuccess'),
          description: t('auth.emailVerification.verificationSuccess')
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      setError(t('auth.emailVerification.invalidCode'));
      toast({
        title: "Error",
        description: t('auth.emailVerification.invalidCode'),
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    
    try {
      const { error: resendError } = await supabase.functions.invoke('send-verification-email', {
        body: { 
          email,
          userName
        }
      });

      if (resendError) {
        throw resendError;
      }

      toast({
        title: "✅ " + t('auth.emailVerification.resendSuccess'),
        description: t('auth.emailVerification.checkSpam'),
        duration: 8000
      });
      setCode("");
      setError(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Error al reenviar el código",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl bg-gradient-to-r from-primary to-coral bg-clip-text text-transparent">
            {t('auth.emailVerification.codeTitle')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('auth.emailVerification.codeMessage')}<br />
            <strong className="text-foreground">{email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                setError(null);
              }}
              disabled={isLoading}
            >
              <InputOTPGroup className="w-full justify-center gap-2">
                <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-center text-muted-foreground">
              ⏱️ {t('auth.emailVerification.codeExpires')}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleVerifyCode} 
              disabled={isLoading || code.length !== 6}
              className="w-full bg-gradient-to-r from-primary to-coral hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                t('auth.emailVerification.verifyButton')
              )}
            </Button>
            
            <Button
              type="button"
              variant="link"
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-xs"
            >
              {t('auth.emailVerification.resendCode')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
