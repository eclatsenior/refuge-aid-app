import { useEffect, useState } from 'react';
import { KPICard } from './KPICard';
import { Activity, AlertTriangle, BookOpen, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface KPIData {
  active_risk: { score: number; trend_7d: number; trend_30d: number };
  incidents_today: number;
  incidents_week: number;
  incidents_open: number;
  avg_mood: number;
  checkins_count: number;
  training_completion: number;
}

export function KPIsSection() {
  const { t } = useTranslation('dashboard');
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadKPIs = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('dashboard-kpis', {
          body: { scope: {} }
        });

        if (error) throw error;
        setKpis(data);
      } catch (error: any) {
        console.error('Error loading KPIs:', error);
        toast({
          title: 'Error al cargar KPIs',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadKPIs();
    
    const interval = setInterval(loadKPIs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('kpisSection.sectionTitle')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('kpisSection.activeRisk')}
          value={typeof kpis.active_risk.score === 'number' ? kpis.active_risk.score.toFixed(0) : '0'}
          trend={kpis.active_risk.trend_7d}
          chips={[t('kpisSection.weightedAverage')]}
          icon={AlertTriangle}
          variant={typeof kpis.active_risk.score === 'number' && kpis.active_risk.score > 70 ? 'danger' : typeof kpis.active_risk.score === 'number' && kpis.active_risk.score > 40 ? 'warning' : 'success'}
          onClick={() => console.log('Drill-down: Riesgo')}
        />

        <KPICard
          title={t('kpisSection.incidentsThisWeek')}
          value={kpis.incidents_week}
          chips={[`${kpis.incidents_open} ${t('kpisSection.open')}`]}
          icon={Activity}
          variant={kpis.incidents_open > 5 ? 'warning' : 'default'}
          onClick={() => console.log('Drill-down: Incidentes')}
        />

        <KPICard
          title={t('kpisSection.averageMood24h')}
          value={typeof kpis.avg_mood === 'number' && kpis.avg_mood > 0 ? kpis.avg_mood.toFixed(1) : t('stats.noData')}
          icon={Heart}
          variant={typeof kpis.avg_mood === 'number' && kpis.avg_mood > 0 && kpis.avg_mood < 5 ? 'warning' : 'success'}
          onClick={() => console.log('Drill-down: Ánimo')}
        />

        <KPICard
          title={t('kpisSection.trainingCompleted')}
          value={`${typeof kpis.training_completion === 'number' ? kpis.training_completion.toFixed(0) : '0'}%`}
          chips={[`${kpis.checkins_count || 0} ${t('kpisSection.checkinsPerWeek')}`]}
          icon={BookOpen}
          variant={typeof kpis.training_completion === 'number' && kpis.training_completion < 70 ? 'warning' : 'success'}
          onClick={() => console.log('Drill-down: Formación')}
        />
      </div>
    </div>
  );
}
