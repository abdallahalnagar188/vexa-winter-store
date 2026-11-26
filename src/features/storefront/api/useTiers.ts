import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { PricingTier } from '@/shared/pricing/tiers';

export function useTiers() {
  return useQuery({
    queryKey: ['tiers'],
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PricingTier[]> => {
      const { data, error } = await supabase
        .from('discount_tiers')
        .select('product_id, min_qty, discount_type, value, is_active')
        .eq('is_active', true)
        .order('min_qty', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((t) => ({
        productId: t.product_id,
        minQty: t.min_qty,
        type: t.discount_type,
        value: t.value,
        isActive: t.is_active,
      }));
    },
  });
}
