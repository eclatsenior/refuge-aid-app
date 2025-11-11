import { ShieldAlert, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VaultResetApprovalCard, VaultResetRequest } from "./VaultResetApprovalCard";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface VaultResetRequestsSectionProps {
  requests: VaultResetRequest[];
  onApprove: (requestId: string, notes?: string) => Promise<void>;
  onReject: (requestId: string, notes?: string) => Promise<void>;
}

export function VaultResetRequestsSection({ 
  requests, 
  onApprove, 
  onReject 
}: VaultResetRequestsSectionProps) {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();

  if (requests.length === 0) {
    return null;
  }

  const handleApprove = async (requestId: string, notes?: string) => {
    try {
      await onApprove(requestId, notes);
      toast({
        title: t('vaultResetSection.requestApproved'),
        description: t('vaultResetSection.employeeNotified'),
      });
    } catch (error: any) {
      toast({
        title: t('vaultResetSection.errorApproving'),
        description: error.message || t('vaultResetSection.couldNotApprove'),
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string, notes?: string) => {
    try {
      await onReject(requestId, notes);
      toast({
        title: t('vaultResetSection.requestRejected'),
        description: t('vaultResetSection.employeeNotifiedReject'),
      });
    } catch (error: any) {
      toast({
        title: t('vaultResetSection.errorRejecting'),
        description: error.message || t('vaultResetSection.couldNotReject'),
        variant: "destructive",
      });
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {t('vaultResetSection.sectionTitle')}
              <Badge variant="destructive" className="ml-2">
                {requests.length}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('vaultResetSection.reviewRequests')}
            </p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-1 text-sm text-blue-900 dark:text-blue-200">
          <p className="font-medium">{t('vaultResetSection.aboutTitle')}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>{t('vaultResetSection.directApproval').split(':')[0]}:</strong> {t('vaultResetSection.directApproval').split(':')[1]}</li>
            <li><strong>{t('vaultResetSection.idVerification').split(':')[0]}:</strong> {t('vaultResetSection.idVerification').split(':')[1]}</li>
            <li>{t('vaultResetSection.timeLimit')}</li>
            <li>{t('vaultResetSection.noRecovery')}</li>
          </ul>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <VaultResetApprovalCard
            key={request.id}
            request={request}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>
    </section>
  );
}
