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

      {/* High-Contrast Deep Olive Winter Drop & Offers Banner */}
      <section className="border-y border-[#3E452B]/20 bg-[#3E452B] text-[#EAE6D7]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3.5 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F47B20] text-white shadow-sm">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#EAE6D7] sm:text-lg">
                {t('offers.bannerTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-[#C5BFA8] sm:text-sm">{t('offers.bannerSub')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {globalTiers.map((tier) => (
              <span
                key={tier.minQty}
                className="rounded-full bg-[#F47B20] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs"
              >
                {describeTier(tier, lang)}
              </span>
            ))}
            <span className="rounded-full border border-[#C5BFA8]/35 px-3.5 py-1.5 text-xs font-bold text-[#EAE6D7]">
              {t('trust.shipping')}
            </span>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      {(categoriesQuery.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#3E452B] sm:text-2xl">
              {t('home.shopByCategory')}
            </h2>
            <Link to="/shop" className="text-sm font-extrabold text-[#F47B20] hover:underline">
              {t('home.viewAll')}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categoriesQuery.data?.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="rounded-xl border border-[#3E452B]/20 bg-[#EAE6D7] px-5 py-3 text-sm font-bold text-[#3E452B] transition-all hover:border-[#F47B20] hover:bg-[#3E452B] hover:text-[#EAE6D7]"
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
          <h2 className="text-2xl font-black text-[#3E452B] sm:text-3xl">
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
          <div className="rounded-2xl bg-[#EAE6D7] p-6 text-center text-[#3E452B]">
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
      <section className="border-t border-[#3E452B]/15 bg-[#D2CCB8]/65 text-[#3E452B]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div className="flex items-start gap-3 rounded-2xl bg-[#EAE6D7] p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3E452B] text-[#F47B20]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.cod')}</h3>
              <p className="mt-0.5 text-xs text-[#3E452B]/75">{t('trust.codSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-[#EAE6D7] p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3E452B] text-[#F47B20]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.shipping')}</h3>
              <p className="mt-0.5 text-xs text-[#3E452B]/75">{t('trust.shippingSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-[#EAE6D7] p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3E452B] text-[#F47B20]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.returns')}</h3>
              <p className="mt-0.5 text-xs text-[#3E452B]/75">{t('trust.returnsSub')}</p>
            </div>
          </div>
        </div>
        <div className="hidden items-center justify-center gap-2 pb-5 text-xs font-semibold text-[#3E452B]/70 sm:flex">
          <ShieldCheck className="h-4 w-4 text-[#F47B20]" />
          <span>{t('footer.policies')}</span>
        </div>
      </section>
    </PageTransition>
  );
}
