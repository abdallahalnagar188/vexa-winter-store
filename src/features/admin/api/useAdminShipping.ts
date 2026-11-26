import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GovernorateShipping } from '@/shared/types/domain';

export function useAdminShipping() {
  return useQuery({
    queryKey: ['admin', 'shipping'],
    staleTime: 15_000,
    queryFn: async (): Promise<GovernorateShipping[]> => {
      const { data, error } = await supabase
        .from('governorate_shipping')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveGovernorates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: GovernorateShipping[]) => {
      const { error } = await supabase.from('governorate_shipping').upsert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'shipping'] });
      void qc.invalidateQueries({ queryKey: ['shipping'] });
    },
  });
}
