import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Copy } from "lucide-react";

interface CreateUserResult {
  success: boolean;
  user_id: string;
  email: string;
  subscription_end: string;
  password: string;
}

export default function AdminCreateRefugiLeadTest() {
  const { t, i18n } = useTranslation('admin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreateUserResult | null>(null);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!email || !password || !fullName) {
      toast({
        title: t('createRefugiLead.errorTitle'),
        description: t('createRefugiLead.errorAllFields'),
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('createRefugiLead.errorTitle'),
        description: t('createRefugiLead.errorPasswordLength'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-refugi-lead-test', {
        body: {
          email,
          password,
          fullName
        }
      });

      if (error) throw error;

      // Store password for display (only in test environment)
      const resultWithPassword = {
        ...data,
        password
      };

      setResult(resultWithPassword);

      toast({
        title: t('createRefugiLead.successTitle'),
        description: t('createRefugiLead.successDescription', { email }),
      });

      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (error: any) {
      console.error('Error creating Refugi Lead test user:', error);
      toast({
        title: t('createRefugiLead.errorTitle'),
        description: error.message || t('createRefugiLead.errorCreating'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('createRefugiLead.copied'),
      description: t('createRefugiLead.copiedDescription', { label }),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('createRefugiLead.title')}</CardTitle>
          <CardDescription>
            {t('createRefugiLead.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t('createRefugiLead.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('createRefugiLead.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('createRefugiLead.password')}</Label>
            <Input
              id="password"
              type="text"
              placeholder={t('createRefugiLead.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              {t('createRefugiLead.passwordHelp')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">{t('createRefugiLead.fullName')}</Label>
            <Input
              id="fullName"
              type="text"
              placeholder={t('createRefugiLead.fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={isLoading || !email || !password || !fullName}
            className="w-full"
          >
            {isLoading ? t('createRefugiLead.creating') : t('createRefugiLead.createButton')}
          </Button>

          {result && (
            <Alert className="border-primary/20 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>
                <div className="space-y-3 mt-2">
                  <h3 className="font-semibold text-foreground">{t('createRefugiLead.result.title')}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-background/50">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('createRefugiLead.result.email')}</p>
                        <p className="font-mono text-sm">{result.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.email, t('createRefugiLead.result.email'))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-background/50">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('createRefugiLead.result.password')}</p>
                        <p className="font-mono text-sm">{result.password}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.password, t('createRefugiLead.result.password'))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="p-2 rounded bg-background/50">
                      <p className="text-xs text-muted-foreground">{t('createRefugiLead.result.plan')}</p>
                      <p className="text-sm font-medium">{t('createRefugiLead.result.planValue')}</p>
                    </div>

                    <div className="p-2 rounded bg-background/50">
                      <p className="text-xs text-muted-foreground">{t('createRefugiLead.result.subscription')}</p>
                      <p className="text-sm font-medium">{formatDate(result.subscription_end)}</p>
                    </div>

                    <div className="p-2 rounded bg-background/50">
                      <p className="text-xs text-muted-foreground">{t('createRefugiLead.result.userId')}</p>
                      <p className="font-mono text-xs break-all">{result.user_id}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('createRefugiLead.result.loginTitle')}
                    </p>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>{t('createRefugiLead.result.loginStep1')}</li>
                      <li>{t('createRefugiLead.result.loginStep2')}</li>
                      <li>{t('createRefugiLead.result.loginStep3')}</li>
                    </ol>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
