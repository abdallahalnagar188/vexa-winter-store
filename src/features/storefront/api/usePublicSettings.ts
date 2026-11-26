import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface PublicSettings {
  freeShippingThreshold: number;
  whatsappNumber: string;
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PublicSettings> => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('key, value')
        .eq('is_public', true);
      if (error) throw error;

      let freeShippingThreshold = 0;
      let whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER as string) || '';

      for (const row of data ?? []) {
        if (row.key === 'free_shipping_threshold') {
          const parsed = Number(row.value);
          if (!Number.isNaN(parsed) && parsed >= 0) freeShippingThreshold = parsed;
        }
        if (row.key === 'whatsapp_number' && typeof row.value === 'string' && row.value.trim()) {
          whatsappNumber = row.value.trim();
        }
      }

      return { freeShippingThreshold, whatsappNumber };
    },
  });
}
