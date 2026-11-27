import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/shared/types/database';

export interface CreateOrderPayload {
  customer_name: string;
  phone: string;
  phone_secondary?: string | null;
  governorate_id: number;
  city_area: string;
  address_details: string;
  notes?: string | null;
  coupon_code?: string | null;
  idempotency_key: string;
  items: { variant_id: string; quantity: number }[];
}

export interface CreateOrderResult {
  order_ref: string;
  total_cod: number;
  duplicate: boolean;
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload): Promise<CreateOrderResult> => {
      const { data, error } = await supabase.rpc('create_guest_order', {
        p: payload as unknown as Json,
      });
      if (error) {
        throw error;
      }
      return data as CreateOrderResult;
    },
  });
}
