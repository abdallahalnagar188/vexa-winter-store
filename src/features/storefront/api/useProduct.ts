import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ProductWithDetails } from '@/shared/types/domain';

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: isSupabaseConfigured && Boolean(slug),
    staleTime: 60_000,
    queryFn: async (): Promise<ProductWithDetails | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          category:categories(*),
          product_images(*),
          product_variants(*)
        `,
        )
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('is_archived', false)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const product = data as unknown as ProductWithDetails;
      return {
        ...product,
        product_images: [...(product.product_images ?? [])].sort((a, b) =>
          a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1,
        ),
        product_variants: (product.product_variants ?? []).filter((v) => v.is_active),
      };
    },
  });
}
