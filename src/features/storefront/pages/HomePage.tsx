import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, RefreshCw, ShieldCheck, Tag, Truck } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
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

function RevealSection({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [visible, setVisible] = useState(prefersReducedMotion);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion || visible) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, visible]);

  return (
    <section
      ref={ref}
      id={id}
      style={
        prefersReducedMotion
          ? undefined
          : {
              transitionProperty: 'opacity, transform',
              transitionDuration: '600ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }
      }
      className={`${
        visible || prefersReducedMotion ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
    >
      {children}
    </section>
  );
}

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

      {/* Elevated Campaign Banner — Smooth Surface Transition from Hero */}
      <div className="bg-linear-to-b from-[#ECE9E0]/35 via-[#F4F2EC] to-[#F4F2EC]">
        <RevealSection id="winter-campaign" className="mx-auto max-w-7xl px-4 pt-4 pb-10 sm:px-6 sm:pb-12">
          <div className="relative overflow-hidden rounded-3xl border border-[#132238]/15 bg-[#132238] text-[#F4F2EC] shadow-md">
            <img
              src="https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1600&q=80"
              alt={t('offers.bannerTitle')}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-45"
            />
            <div className="absolute inset-0 bg-[#132238]/55" />
            <div className="absolute inset-0 bg-linear-to-l from-[#132238]/95 via-[#132238]/80 to-[#FF6B1A]/35" />

            <div className="relative z-10 flex flex-col justify-between gap-6 px-6 py-8 sm:px-10 sm:py-12 lg:flex-row lg:items-center">
              <div className="max-w-2xl space-y-4">
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
        </RevealSection>
      </div>

      {/* Shop by Category */}
      {(categoriesQuery.data?.length ?? 0) > 0 && (
        <RevealSection className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#132238]/10 pb-4">
            <h2 className="text-2xl font-black tracking-tight text-[#132238] sm:text-3xl">
              {t('home.shopByCategory')}
            </h2>
            <Link to="/shop" className="text-sm font-extrabold text-[#FF6B1A] hover:underline">
              {t('home.viewAll')}
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {categoriesQuery.data?.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="rounded-xl border border-[#132238]/15 bg-[#FFFFFF] px-5 py-3 text-sm font-bold text-[#132238] shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#132238] hover:bg-[#132238] hover:text-[#F4F2EC] hover:shadow-xs"
              >
                {lang === 'ar' ? cat.name_ar : cat.name_en}
              </Link>
            ))}
          </div>
        </RevealSection>
      )}

      {/* Featured / Trending Winter Collection Grid */}
      <RevealSection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#132238]/10 pb-4">
          <h2 className="text-2xl font-black tracking-tight text-[#132238] sm:text-3xl">
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
              <Skeleton key={i} className="aspect-4/5 w-full rounded-2xl" />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <div className="rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-6 text-center text-[#132238] shadow-xs">
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
      </RevealSection>

      {/* Brand Value & Trust Strip */}
      <RevealSection className="border-t border-[#132238]/12 bg-[#ECE9E0] text-[#132238]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-12">
          <div className="flex items-start gap-3 rounded-2xl border border-[#132238]/10 bg-[#FFFFFF] p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#132238] text-[#FF6B1A]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.cod')}</h3>
              <p className="mt-0.5 text-xs text-[#132238]/75">{t('trust.codSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[#132238]/10 bg-[#FFFFFF] p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#132238] text-[#FF6B1A]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.shipping')}</h3>
              <p className="mt-0.5 text-xs text-[#132238]/75">{t('trust.shippingSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[#132238]/10 bg-[#FFFFFF] p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#132238] text-[#FF6B1A]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.returns')}</h3>
              <p className="mt-0.5 text-xs text-[#132238]/75">{t('trust.returnsSub')}</p>
            </div>
          </div>
        </div>
        <div className="hidden items-center justify-center gap-2 pb-6 text-xs font-semibold text-[#132238]/70 sm:flex">
          <ShieldCheck className="h-4 w-4 text-[#FF6B1A]" />
          <span>{t('footer.policies')}</span>
        </div>
      </RevealSection>
    </PageTransition>
  );
}
