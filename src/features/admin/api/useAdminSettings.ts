import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/shared/types/database';
import { DEFAULT_COURIER_TEMPLATE } from '@/shared/constants/orderStatus';

export interface AdminSettingsMap {
  free_shipping_threshold: number;
  whatsapp_number: string;
  low_stock_threshold: number;
  courier_template: string;
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async (): Promise<AdminSettingsMap> => {
      const { data, error } = await supabase.from('store_settings').select('*');
      if (error) throw error;

      const map: AdminSettingsMap = {
        free_shipping_threshold: 0,
        whatsapp_number: '',
        low_stock_threshold: 3,
        courier_template: DEFAULT_COURIER_TEMPLATE,
      };

      for (const row of data ?? []) {
        if (row.key === 'free_shipping_threshold') {
          map.free_shipping_threshold = Number(row.value) || 0;
        } else if (row.key === 'whatsapp_number') {
          map.whatsapp_number = typeof row.value === 'string' ? row.value : '';
        } else if (row.key === 'low_stock_threshold') {
          map.low_stock_threshold = Number(row.value) || 3;
        } else if (row.key === 'courier_template' && typeof row.value === 'string') {
          map.courier_template = row.value;
        }
      }
      return map;
    },
  });
}

export function useSaveSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      value,
      isPublic,
    }: {
      key: string;
      value: Json;
      isPublic: boolean;
    }) => {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ key, value, is_public: isPublic });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      void qc.invalidateQueries({ queryKey: ['settings', 'public'] });
    },
  });
}
