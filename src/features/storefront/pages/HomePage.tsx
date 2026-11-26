import { Link } from 'react-router-dom';
import { Banknote, RefreshCw, ShieldCheck, Tag, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { StaggerGrid } from '@/shared/components/motion/StaggerGrid';
import { HeroSection } from '@/features/storefront/components/HeroSection';
import { ProductCard } from '@/features/storefront/components/ProductCard';
import { useProducts } from '@/features/storefront/api/useProducts';
import { useCategories } from '@/features/storefront/api/useCategories';
import { useTiers } from '@/features/storefront/api/useTiers';
import { useDir } from '@/shared/hooks/useDir';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Button } from '@/shared/components/ui/Button';
import { describeTier } from '@/shared/pricing/tiers';

export function HomePage() {
  const { t } = useTranslation();
  const { lang } = useDir();
  useDocumentTitle(t('nav.home'));

  const productsQuery = useProducts({ sort: 'newest', limit: 8 });
  const categoriesQuery = useCategories();
  const tiersQuery = useTiers();

  const globalTiers = (tiersQuery.data ?? []).filter((tier) => tier.productId === null);

  return (
    <PageTransition>
      <HeroSection />

      {/* Elevated Campaign Banner with Background Image, Scrim & Directional Navy-to-Orange Gradient */}
      <section id="winter-campaign" className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[#132238]/15 bg-[#132238] text-[#F4F2EC] shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1600&q=80"
            alt={t('offers.bannerTitle')}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-45"
          />
          {/* Controlled scrim + directional Deep Navy to subtle Orange warmth gradient */}
          <div className="absolute inset-0 bg-[#132238]/55" />
          <div className="absolute inset-0 bg-linear-to-l from-[#132238]/95 via-[#132238]/80 to-[#FF6B1A]/35" />

          <div className="relative z-10 flex flex-col justify-between gap-6 px-6 py-9 sm:px-10 sm:py-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FF6B1A] px-3.5 py-1 text-xs font-extrabold text-white shadow-xs">
                <Tag className="h-3.5 w-3.5" />
                {t('offers.bannerTitle')}
              </span>
              <h2 className="text-2xl font-black leading-snug text-white sm:text-3xl">
                {lang === 'ar'
                  ? 'خصومات تلقائية على الكميات + شحن لكل المحافظات'
                  : 'Automatic Multi-Piece Bundles + Nationwide COD'}
              </h2>
              <p className="text-sm leading-relaxed text-[#ECE9E0]/90 sm:text-base">
                {t('offers.bannerSub')}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {globalTiers.map((tier) => (
                  <span
                    key={tier.minQty}
                    className="rounded-full bg-[#FF6B1A] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs"
                  >
                    {describeTier(tier, lang)}
                  </span>
                ))}
                <span className="rounded-full border border-[#F4F2EC]/40 bg-[#132238]/60 px-3.5 py-1.5 text-xs font-bold text-[#F4F2EC] backdrop-blur-xs">
                  {t('trust.shipping')} • {t('trust.cod')}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <Link to="/shop">
                <Button variant="primary" size="lg">
                  {t('hero.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      {(categoriesQuery.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#132238] sm:text-2xl">
              {t('home.shopByCategory')}
            </h2>
            <Link to="/shop" className="text-sm font-extrabold text-[#FF6B1A] hover:underline">
              {t('home.viewAll')}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categoriesQuery.data?.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="rounded-xl border border-[#132238]/15 bg-[#FFFFFF] px-5 py-3 text-sm font-bold text-[#132238] shadow-2xs transition-all hover:border-[#132238] hover:bg-[#132238] hover:text-[#F4F2EC]"
              >
                {lang === 'ar' ? cat.name_ar : cat.name_en}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured / Trending Winter Collection Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-[#132238] sm:text-3xl">
            {t('home.newArrivals')}
          </h2>
          <Link to="/shop">
            <Button variant="primary" size="sm">
              {t('home.viewAll')}
            </Button>
          </Link>
        </div>

        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-3/4 w-full rounded-2xl" />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <div className="rounded-2xl bg-[#FFFFFF] p-6 text-center text-[#132238]">
            <p className="font-bold">{t('checkout.errors.generic')}</p>
            <Button variant="secondary" className="mt-3" onClick={() => productsQuery.refetch()}>
              {t('catalog.retry')}
            </Button>
          </div>
        ) : (
          <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(productsQuery.data ?? []).map((product) => (
              <ProductCard key={product.id} product={product} tiers={tiersQuery.data ?? []} />
            ))}
          </StaggerGrid>
        )}
      </section>

      {/* Brand Value & Trust Strip */}
      <section className="border-t border-[#132238]/12 bg-[#ECE9E0] text-[#132238]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div className="flex items-start gap-3 rounded-2xl border border-[#132238]/10 bg-[#FFFFFF] p-4 shadow-2xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#132238] text-[#FF6B1A]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.cod')}</h3>
              <p className="mt-0.5 text-xs text-[#132238]/75">{t('trust.codSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[#132238]/10 bg-[#FFFFFF] p-4 shadow-2xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#132238] text-[#FF6B1A]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.shipping')}</h3>
              <p className="mt-0.5 text-xs text-[#132238]/75">{t('trust.shippingSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[#132238]/10 bg-[#FFFFFF] p-4 shadow-2xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#132238] text-[#FF6B1A]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.returns')}</h3>
              <p className="mt-0.5 text-xs text-[#132238]/75">{t('trust.returnsSub')}</p>
            </div>
          </div>
        </div>
        <div className="hidden items-center justify-center gap-2 pb-5 text-xs font-semibold text-[#132238]/70 sm:flex">
          <ShieldCheck className="h-4 w-4 text-[#FF6B1A]" />
          <span>{t('footer.policies')}</span>
        </div>
      </section>
    </PageTransition>
  );
}
