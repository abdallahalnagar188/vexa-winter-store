import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DiscountTier } from '@/shared/types/domain';
import type { DiscountType } from '@/shared/types/database';

export function useAdminTiers() {
  return useQuery({
    queryKey: ['admin', 'tiers'],
    staleTime: 10_000,
    queryFn: async (): Promise<DiscountTier[]> => {
      const { data, error } = await supabase
        .from('discount_tiers')
        .select('*')
        .order('min_qty', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveTiersForScope() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      rows,
    }: {
      productId: string | null;
      rows: { min_qty: number; discount_type: DiscountType; value: number; is_active: boolean }[];
    }) => {
      if (productId === null) {
        const { error: delErr } = await supabase
          .from('discount_tiers')
          .delete()
          .is('product_id', null);
        if (delErr) throw delErr;
      } else {
        const { error: delErr } = await supabase
          .from('discount_tiers')
          .delete()
          .eq('product_id', productId);
        if (delErr) throw delErr;
      }

      if (rows.length > 0) {
        const { error: insErr } = await supabase.from('discount_tiers').insert(
          rows.map((r) => ({
            product_id: productId,
            min_qty: r.min_qty,
            discount_type: r.discount_type,
            value: r.value,
            is_active: r.is_active,
          })),
        );
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'tiers'] });
      void qc.invalidateQueries({ queryKey: ['tiers'] });
    },
  });
}
