import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/shared/types/domain';

export interface CategoryWithCount extends Category {
  product_count: number;
}

export function useAdminCategoriesWithCounts() {
  return useQuery({
    queryKey: ['admin', 'categories', 'with-counts'],
    staleTime: 10_000,
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('products').select('id, category_id'),
      ]);
      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;

      const countByCat = new Map<string, number>();
      for (const p of prodRes.data ?? []) {
        if (p.category_id) {
          countByCat.set(p.category_id, (countByCat.get(p.category_id) ?? 0) + 1);
        }
      }

      return (catRes.data ?? []).map((cat) => ({
        ...cat,
        product_count: countByCat.get(cat.id) ?? 0,
      }));
    },
  });
}

function useInvalidateCategories() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['categories'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    void qc.invalidateQueries({ queryKey: ['products'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    void qc.invalidateQueries({ queryKey: ['homepage'] });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async (input: {
      name_ar: string;
      name_en: string;
      slug: string;
      sort_order: number;
      is_active: boolean;
      show_in_header: boolean;
    }) => {
      const { error } = await supabase.from('categories').insert(input);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      name_ar?: string;
      name_en?: string;
      slug?: string;
      sort_order?: number;
      is_active?: boolean;
      show_in_header?: boolean;
    }) => {
      const { error } = await supabase.from('categories').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useReorderCategories() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async (pairs: { id: string; sort_order: number }[]) => {
      await Promise.all(
        pairs.map(async ({ id, sort_order }) => {
          const { error } = await supabase.from('categories').update({ sort_order }).eq('id', id);
          if (error) throw error;
        }),
      );
    },
    onSuccess: invalidate,
  });
}

export function useSafeDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async ({
      categoryId,
      reassignCategoryId,
    }: {
      categoryId: string;
      reassignCategoryId?: string | null;
    }) => {
      if (reassignCategoryId !== undefined) {
        const { error: prodErr } = await supabase
          .from('products')
          .update({ category_id: reassignCategoryId })
          .eq('category_id', categoryId);
        if (prodErr) throw prodErr;
      }

      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
