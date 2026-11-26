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

      {globalTiers.length > 0 && (
        <section className="border-y border-[#124E3B]/15 bg-[#E8E3D5] text-[#124E3B]">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#124E3B] text-[#FFD60A]">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold sm:text-lg">{t('offers.bannerTitle')}</h2>
                <p className="text-xs text-[#124E3B]/75 sm:text-sm">{t('offers.bannerSub')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {globalTiers.map((tier) => (
                <span
                  key={tier.minQty}
                  className="rounded-full bg-[#FFD60A] px-3.5 py-1.5 text-xs font-extrabold text-[#124E3B] shadow-xs"
                >
                  {describeTier(tier, lang)}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {(categoriesQuery.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#E8E3D5] sm:text-2xl">
              {t('home.shopByCategory')}
            </h2>
            <Link to="/shop" className="text-sm font-bold text-[#FFD60A] hover:underline">
              {t('home.viewAll')}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categoriesQuery.data?.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="rounded-xl border border-[#E8E3D5]/20 bg-[#0C382A] px-5 py-3 text-sm font-bold text-[#E8E3D5] transition-colors hover:border-[#FFD60A] hover:text-[#FFD60A]"
              >
                {lang === 'ar' ? cat.name_ar : cat.name_en}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-[#E8E3D5] sm:text-3xl">
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
          <div className="rounded-2xl bg-[#E8E3D5] p-6 text-center text-[#124E3B]">
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

      <section className="border-t border-[#E8E3D5]/15 bg-[#E8E3D5] text-[#124E3B]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#124E3B] text-[#FFD60A]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.cod')}</h3>
              <p className="mt-0.5 text-xs text-[#124E3B]/75">{t('trust.codSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#124E3B] text-[#FFD60A]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.shipping')}</h3>
              <p className="mt-0.5 text-xs text-[#124E3B]/75">{t('trust.shippingSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#124E3B] text-[#FFD60A]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.returns')}</h3>
              <p className="mt-0.5 text-xs text-[#124E3B]/75">{t('trust.returnsSub')}</p>
            </div>
          </div>
        </div>
        <div className="hidden items-center justify-center gap-2 pb-4 text-xs text-[#124E3B]/60 sm:flex">
          <ShieldCheck className="h-4 w-4" />
          <span>{t('footer.policies')}</span>
        </div>
      </section>
    </PageTransition>
  );
}
