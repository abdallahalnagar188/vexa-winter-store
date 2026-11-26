import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  HomepageCategoryCard,
  HomepageContentBundle,
  HomepageHero,
  HomepageMarqueeItem,
  HomepagePromoBanner,
} from '@/shared/types/domain';

async function convertToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1800;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('WebP conversion failed'));
      },
      'image/webp',
      0.86,
    );
  });
}

export async function uploadHomepageAsset(file: File, folder: string): Promise<string> {
  const blob = await convertToWebp(file);
  const path = `homepage/${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from('products')
    .upload(path, blob, { contentType: 'image/webp', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('products').getPublicUrl(path);
  return data.publicUrl;
}

export function useAdminHomepage() {
  return useQuery({
    queryKey: ['admin', 'homepage'],
    queryFn: async (): Promise<HomepageContentBundle> => {
      const [heroRes, marqueeRes, bannerRes, catRes] = await Promise.all([
        supabase.from('homepage_hero').select('*').order('display_order', { ascending: true }),
        supabase.from('homepage_marquee_items').select('*').order('display_order', { ascending: true }),
        supabase.from('homepage_promo_banner').select('*').limit(1).maybeSingle(),
        supabase.from('homepage_category_cards').select('*').order('display_order', { ascending: true }),
      ]);

      if (heroRes.error) throw heroRes.error;
      if (marqueeRes.error) throw marqueeRes.error;
      if (bannerRes.error) throw bannerRes.error;
      if (catRes.error) throw catRes.error;

      return {
        heroes: (heroRes.data ?? []) as HomepageHero[],
        marqueeItems: (marqueeRes.data ?? []) as HomepageMarqueeItem[],
        promoBanner: (bannerRes.data as HomepagePromoBanner | null) ?? null,
        categoryCards: (catRes.data ?? []) as HomepageCategoryCard[],
      };
    },
  });
}

export function useHomepageMutations() {
  const qc = useQueryClient();

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ['homepage'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'homepage'] });
  };

  const upsertHero = useMutation({
    mutationFn: async (hero: Partial<HomepageHero> & { badge_ar: string; title_ar: string }) => {
      if (hero.id) {
        const { error } = await supabase.from('homepage_hero').update(hero).eq('id', hero.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_hero')
          .insert(hero as HomepageHero);
        if (error) throw error;
      }
    },
    onSuccess: invalidateAll,
  });

  const deleteHero = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('homepage_hero').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const upsertMarquee = useMutation({
    mutationFn: async (item: Partial<HomepageMarqueeItem> & { text_ar: string; text_en: string }) => {
      if (item.id) {
        const { error } = await supabase
          .from('homepage_marquee_items')
          .update(item)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_marquee_items')
          .insert(item as HomepageMarqueeItem);
        if (error) throw error;
      }
    },
    onSuccess: invalidateAll,
  });

  const deleteMarquee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('homepage_marquee_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const upsertBanner = useMutation({
    mutationFn: async (banner: Partial<HomepagePromoBanner> & { title_ar: string }) => {
      if (banner.id) {
        const { error } = await supabase
          .from('homepage_promo_banner')
          .update(banner)
          .eq('id', banner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_promo_banner')
          .insert(banner as HomepagePromoBanner);
        if (error) throw error;
      }
    },
    onSuccess: invalidateAll,
  });

  const upsertCategoryCard = useMutation({
    mutationFn: async (
      card: Partial<HomepageCategoryCard> & { category_slug: string; title_ar: string; cover_image_url: string },
    ) => {
      if (card.id) {
        const { error } = await supabase
          .from('homepage_category_cards')
          .update(card)
          .eq('id', card.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_category_cards')
          .insert(card as HomepageCategoryCard);
        if (error) throw error;
      }
    },
    onSuccess: invalidateAll,
  });

  const deleteCategoryCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('homepage_category_cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  return {
    upsertHero,
    deleteHero,
    upsertMarquee,
    deleteMarquee,
    upsertBanner,
    upsertCategoryCard,
    deleteCategoryCard,
  };
}
