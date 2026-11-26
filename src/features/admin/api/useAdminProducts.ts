import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Category, ProductWithDetails } from '@/shared/types/domain';

export function useAdminProducts(includeArchived = true) {
  return useQuery({
    queryKey: ['admin', 'products', includeArchived],
    staleTime: 10_000,
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
        .order('created_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as unknown as ProductWithDetails[]).map((p) => ({
        ...p,
        product_images: [...(p.product_images ?? [])].sort((a, b) =>
          a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1,
        ),
      }));
    },
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useToggleArchiveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_archived }: { id: string; is_archived: boolean }) => {
      const { error } = await supabase.from('products').update({ is_archived }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteUnusedProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.rpc('admin_delete_product', {
        p_product_id: productId,
      });
      if (error) throw error;
      const paths = (data as { storage_paths?: string[] } | null)?.storage_paths ?? [];
      if (paths.length > 0) {
        await supabase.storage.from('products').remove(paths);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
