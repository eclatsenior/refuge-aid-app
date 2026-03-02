import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TherapyRoute {
  id: string;
  route_key: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  modules: TherapyModule[];
}

export interface TherapyModule {
  id: string;
  route_id: string;
  module_key: string;
  title: string;
  description: string;
  content: string;
  duration: number;
  type: string;
  sort_order: number;
  is_active: boolean;
}

export function useTherapyRoutes() {
  const [routes, setRoutes] = useState<TherapyRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [routesRes, modulesRes] = await Promise.all([
        supabase
          .from('therapy_routes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('therapy_modules')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      ]);

      if (routesRes.error) throw routesRes.error;
      if (modulesRes.error) throw modulesRes.error;

      const routesWithModules: TherapyRoute[] = (routesRes.data || []).map(route => ({
        ...route,
        modules: (modulesRes.data || []).filter(m => m.route_id === route.id)
      }));

      setRoutes(routesWithModules);
    } catch (err: any) {
      console.error('[useTherapyRoutes] Error:', err);
      setError(err.message || 'Error cargando rutas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return { routes, loading, error, refresh: fetchRoutes };
}
