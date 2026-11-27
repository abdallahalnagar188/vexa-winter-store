import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ProductWithDetails } from '@/shared/types/domain';

export interface ProductFilters {
  categorySlug?: string;
  search?: string;
  size?: string;
  color?: string;
  inStockOnly?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  limit?: number;
  ids?: string[];
  enabled?: boolean;
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL'];

function sanitizeSearchTerm(raw: string): string {
  return raw.trim().replace(/[,()\\]/g, ' ').replace(/\s+/g, ' ');
}

export function useCatalogFacets() {
  return useQuery({
    queryKey: ['products', 'facets'],
    enabled: isSupabaseConfigured,
    staleTime: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('size, color_name, color_hex, stock, products!inner(is_active, is_archived)')
        .eq('is_active', true)
        .eq('products.is_active', true)
        .eq('products.is_archived', false);

      if (error) throw error;

      const sizeSet = new Set<string>();
      const colorMap = new Map<string, string | null>();

      for (const row of data ?? []) {
        if (row.size) sizeSet.add(row.size);
        if (row.color_name && !colorMap.has(row.color_name)) {
          colorMap.set(row.color_name, row.color_hex ?? null);
        }
      }

      const sizes = Array.from(sizeSet).sort((a, b) => {
        const ia = SIZE_ORDER.indexOf(a.toUpperCase());
        const ib = SIZE_ORDER.indexOf(b.toUpperCase());
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      });

      const colors = Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));

      return { sizes, colors };
    },
  });
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    enabled: isSupabaseConfigured && (filters.enabled ?? true),
    staleTime: 60_000,
    queryFn: async (): Promise<ProductWithDetails[]> => {
      const hasVariantFilters = Boolean(filters.size || filters.color || filters.inStockOnly);
      let variantMatchedIds: string[] | null = null;

      if (hasVariantFilters) {
        let vq = supabase
          .from('product_variants')
          .select('product_id')
          .eq('is_active', true);

        if (filters.size) {
          vq = vq.eq('size', filters.size);
        }
        if (filters.color) {
          vq = vq.eq('color_name', filters.color);
        }
        if (filters.inStockOnly) {
          vq = vq.gt('stock', 0);
        }

        const { data: vData, error: vErr } = await vq;
        if (vErr) throw vErr;

        variantMatchedIds = Array.from(new Set((vData ?? []).map((v) => v.product_id)));
        if (variantMatchedIds.length === 0) {
          return [];
        }
      }

      const hasCategoryFilter = Boolean(filters.categorySlug && filters.categorySlug !== 'all');
      const selectClause = hasCategoryFilter
        ? `
          *,
          category:categories!inner(*),
          product_images(*),
          product_variants(*)
        `
        : `
          *,
          category:categories(*),
          product_images(*),
          product_variants(*)
        `;

      let query = supabase
        .from('products')
        .select(selectClause)
        .eq('is_active', true)
        .eq('is_archived', false);

      if (hasCategoryFilter) {
        query = query.eq('category.slug', filters.categorySlug!);
      }

      if (filters.ids && filters.ids.length > 0) {
        const effectiveIds = variantMatchedIds
          ? filters.ids.filter((id) => variantMatchedIds!.includes(id))
          : filters.ids;
        if (effectiveIds.length === 0) return [];
        query = query.in('id', effectiveIds);
      } else if (variantMatchedIds) {
        query = query.in('id', variantMatchedIds);
      }

      const cleanSearch = filters.search ? sanitizeSearchTerm(filters.search) : '';
      if (cleanSearch) {
        query = query.or(
          `title_ar.ilike.%${cleanSearch}%,title_en.ilike.%${cleanSearch}%,description_ar.ilike.%${cleanSearch}%,description_en.ilike.%${cleanSearch}%`,
        );
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

      const rows = (data ?? []) as unknown as ProductWithDetails[];

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
