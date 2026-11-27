import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DiscountType } from '@/shared/types/database';
import type { Coupon } from '@/shared/types/domain';

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin', 'coupons'],
    staleTime: 10_000,
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });
}

export interface UpsertCouponInput {
  id?: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  expires_at: string | null;
  is_active: boolean;
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<UpsertCouponInput, 'id'>) => {
      const { error } = await supabase.from('coupons').insert({
        ...input,
        code: input.code.trim().toUpperCase(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<Omit<UpsertCouponInput, 'id'>> & { id: string }) => {
      const cleanPatch = {
        ...patch,
        ...(patch.code !== undefined ? { code: patch.code.trim().toUpperCase() } : {}),
      };
      const { error } = await supabase.from('coupons').update(cleanPatch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
}
