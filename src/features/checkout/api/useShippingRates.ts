import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { GovernorateShipping } from '@/shared/types/domain';

export function useShippingRates() {
  return useQuery({
    queryKey: ['shipping'],
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<GovernorateShipping[]> => {
      const { data, error } = await supabase
        .from('governorate_shipping')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
