import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlags = async () => {
      const { data } = await supabase
        .from('feature_flags')
        .select('flag_name, is_enabled');

      if (data) {
        const flagsMap = data.reduce((acc, flag) => {
          acc[flag.flag_name] = flag.is_enabled;
          return acc;
        }, {} as Record<string, boolean>);
        setFlags(flagsMap);
      }
      setLoading(false);
    };

    loadFlags();
  }, []);

  return { flags, loading, isEnabled: (flag: string) => flags[flag] || false };
}
