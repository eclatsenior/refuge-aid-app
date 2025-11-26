import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Upload, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VaultResetRequestProps {
  open: boolean;
  onClose: () => void;
  isManagedByLead: boolean;
}

export function VaultResetRequest({ open, onClose, isManagedByLead }: VaultResetRequestProps) {
  const { t } = useTranslation('notes');
  const [isLoading, setIsLoading] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('vault.reset.errorFileSize'),
          description: t('vault.reset.errorFileSizeDescription'),
          variant: 'destructive',
        });
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('vault.reset.errorFileType'),
          description: t('vault.reset.errorFileTypeDescription'),
          variant: 'destructive',
        });
        return;
      }
      
      setIdFile(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleRequestReset = async () => {
    if (!isManagedByLead && !idFile) {
      toast({
        title: t('vault.reset.errorTitle'),
        description: t('vault.reset.errorIncompleteDescription'),
        variant: 'destructive',
      });
      return;
    }
    
    if (!isManagedByLead && !confirmed) {
      toast({
        title: t('vault.reset.errorTitle'),
        description: t('vault.reset.errorIncompleteDescription'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error(t('vault.reset.errorNoSession'));
      }
      
      // Convertir archivo a base64 si existe
      let idDocumentBase64 = null;
      if (!isManagedByLead && idFile) {
        idDocumentBase64 = await fileToBase64(idFile);
      }
      
      // Crear solicitud
      const { data, error } = await supabase.functions.invoke('request-vault-reset', {
        body: {
          requestType: isManagedByLead ? 'lead_approved' : 'id_verification',
          idDocumentFile: idDocumentBase64,
          fileName: idFile?.name,
          fileType: idFile?.type,
        }
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: t('vault.reset.successTitle'),
        description: data.message || (isManagedByLead 
          ? t('vault.reset.successDescriptionManaged')
          : t('vault.reset.successDescriptionSelfService')),
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error al solicitar reset:', error);
      toast({
        title: t('vault.reset.errorTitle'),
        description: error.message || t('vault.reset.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('vault.reset.title')}</DialogTitle>
          <DialogDescription>
            {isManagedByLead 
              ? t('vault.reset.descriptionManaged')
              : t('vault.reset.descriptionSelfService')
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-warning">
              <strong>{t('vault.reset.warning')}</strong> {t('vault.reset.warningDescription')}
            </div>
          </div>
          
          {isManagedByLead ? (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <UserCheck className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{t('vault.reset.businessPlan')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('vault.reset.businessPlanDescription')}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="id-upload">
                  {t('vault.reset.idUploadLabel')}
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('id-upload')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {idFile ? idFile.name : t('vault.reset.idUploadButton')}
                  </Button>
                  <input
                    id="id-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('vault.reset.idUploadHelp')}
                </p>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked === true)}
                />
                <label
                  htmlFor="confirm"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('vault.reset.confirmCheckbox')}
                </label>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {t('vault.reset.reviewTime')}
              </p>
            </>
          )}
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
          <Button onClick={handleRequestReset} disabled={isLoading}>
            {isLoading ? t('vault.reset.submittingButton') : t('vault.reset.submitButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
