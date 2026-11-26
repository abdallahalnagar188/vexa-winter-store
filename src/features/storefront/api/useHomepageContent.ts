import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  HomepageCategoryCard,
  HomepageContentBundle,
  HomepageHero,
  HomepageMarqueeItem,
  HomepagePromoBanner,
} from '@/shared/types/domain';

export function useHomepageContent() {
  return useQuery({
    queryKey: ['homepage'],
    staleTime: 60_000,
    queryFn: async (): Promise<HomepageContentBundle> => {
      const [heroRes, marqueeRes, bannerRes, catRes] = await Promise.all([
        supabase
          .from('homepage_hero')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('homepage_marquee_items')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('homepage_promo_banner')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('homepage_category_cards')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
      ]);

      return {
        heroes: ((heroRes.data ?? []) as HomepageHero[]),
        marqueeItems: ((marqueeRes.data ?? []) as HomepageMarqueeItem[]),
        promoBanner: (bannerRes.data as HomepagePromoBanner | null) ?? null,
        categoryCards: ((catRes.data ?? []) as HomepageCategoryCard[]),
      };
    },
  });
}
