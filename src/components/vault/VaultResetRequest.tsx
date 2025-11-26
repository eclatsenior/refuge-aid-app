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
          title: 'Archivo muy grande',
          description: 'El archivo debe ser menor a 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Tipo de archivo inválido',
          description: 'Solo se permiten imágenes',
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
        title: 'Error',
        description: 'Debes adjuntar una foto de tu documento de identidad',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isManagedByLead && !confirmed) {
      toast({
        title: 'Error',
        description: 'Debes confirmar que es tu identificación oficial',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No hay sesión activa');
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
        title: '✅ Solicitud enviada',
        description: data.message,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error al solicitar reset:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la solicitud',
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
          <DialogTitle>Recuperar acceso a Caja Fuerte</DialogTitle>
          <DialogDescription>
            {isManagedByLead 
              ? 'Tu Refugi Lead recibirá una solicitud para resetear tu contraseña'
              : 'Necesitamos verificar tu identidad para resetear tu contraseña'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-warning">
              <strong>Advertencia:</strong> Al resetear tu contraseña, las notas antiguas 
              de tu Caja Fuerte no podrán descifrarse con la nueva contraseña.
            </div>
          </div>
          
          {isManagedByLead ? (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <UserCheck className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Plan Empresarial</p>
                <p className="text-sm text-muted-foreground">
                  Tu Refugi Lead aprobará tu solicitud
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="id-upload">
                  Foto de tu documento de identidad (DNI/NIE/Pasaporte)
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('id-upload')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {idFile ? idFile.name : 'Seleccionar archivo'}
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
                  Máximo 5MB. Formatos: JPG, PNG, WEBP
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
                  Confirmo que esta es mi identificación oficial y autorizo su revisión 
                  para verificar mi identidad
                </label>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Tu solicitud será revisada en 24-48 horas hábiles
              </p>
            </>
          )}
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleRequestReset} disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
