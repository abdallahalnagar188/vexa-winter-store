import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ProductWithDetails } from '@/shared/types/domain';

export interface ProductFilters {
  categorySlug?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  limit?: number;
  ids?: string[];
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    enabled: isSupabaseConfigured,
    staleTime: 60_000,
    queryFn: async (): Promise<ProductWithDetails[]> => {
      let query = supabase
        .from('products')
        .select(
          `
          *,
          category:categories(*),
          product_images(*),
          product_variants(*)
        `,
        )
        .eq('is_active', true)
        .eq('is_archived', false);

      if (filters.ids && filters.ids.length > 0) {
        query = query.in('id', filters.ids);
      }

      if (filters.sort === 'price_asc') {
        query = query.order('base_price', { ascending: true });
      } else if (filters.sort === 'price_desc') {
        query = query.order('base_price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      let rows = (data ?? []) as unknown as ProductWithDetails[];
      if (filters.categorySlug && filters.categorySlug !== 'all') {
        rows = rows.filter((p) => p.category?.slug === filters.categorySlug);
      }

      return rows.map((p) => ({
        ...p,
        product_images: [...(p.product_images ?? [])].sort((a, b) =>
          a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1,
        ),
        product_variants: (p.product_variants ?? []).filter((v) => v.is_active),
      }));
    },
  });
}
