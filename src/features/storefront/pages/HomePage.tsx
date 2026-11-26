import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Layers,
  RefreshCw,
  ShieldCheck,
  Tag,
  Truck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { StaggerGrid } from '@/shared/components/motion/StaggerGrid';
import { HeroSection } from '@/features/storefront/components/HeroSection';
import { ProductCard } from '@/features/storefront/components/ProductCard';
import { useProducts } from '@/features/storefront/api/useProducts';
import { useCategories } from '@/features/storefront/api/useCategories';
import { useTiers } from '@/features/storefront/api/useTiers';
import { useHomepageContent } from '@/features/storefront/api/useHomepageContent';
import { useDir } from '@/shared/hooks/useDir';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { sanitizeSafeUrl } from '@/shared/validation/url';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Button } from '@/shared/components/ui/Button';
import { describeTier } from '@/shared/pricing/tiers';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HomePage() {
  const { t } = useTranslation();
  const { lang, isRtl } = useDir();
  const isAr = lang === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  useDocumentTitle(t('nav.home'));

  const cmsQuery = useHomepageContent();
  const productsQuery = useProducts({ sort: 'newest', limit: 8 });
  const categoriesQuery = useCategories();
  const tiersQuery = useTiers();

  const globalTiers = (tiersQuery.data ?? []).filter((tier) => tier.productId === null);

  const marqueeItems = cmsQuery.data?.marqueeItems ?? [];
  const promoBanner = cmsQuery.data?.promoBanner ?? null;
  const categoryCards = cmsQuery.data?.categoryCards ?? [];

  const bannerOverlayOpacity = promoBanner?.overlay_opacity ?? 0.35;
  const bannerPills = promoBanner
    ? isAr
      ? promoBanner.pill_tags_ar
      : promoBanner.pill_tags_en
    : [];

  return (
    <PageTransition>
      <HeroSection heroes={cmsQuery.data?.heroes} />

      {/* Continuous Infinite Brand Marquee Seamlessly Connected to Dark Hero */}
      {marqueeItems.length > 0 && (
        <div
          aria-label="Brand highlights"
          className="marquee-wrapper overflow-hidden border-y border-white/10 bg-[#0B1120] py-3.5 text-white"
        >
          <div
            className={`flex w-max items-center ${
              isRtl ? 'animate-marquee-rtl' : 'animate-marquee-ltr'
            }`}
          >
            {[0, 1].map((dupIdx) => (
              <div key={dupIdx} className="flex shrink-0 items-center">
                {marqueeItems.map((item) => (
                  <span
                    key={`${dupIdx}-${item.id}`}
                    className="inline-flex items-center gap-4 px-6 text-xs font-bold tracking-wider sm:text-sm"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 bg-[#F97316]" />
                    <span className="whitespace-nowrap">
                      {isAr ? item.text_ar : item.text_en || item.text_ar}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Bento Grid for Shop by Category */}
      {(categoryCards.length > 0 || (categoriesQuery.data?.length ?? 0) > 0) && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#132238]/12 pb-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="h-[2px] w-5 bg-[#FF6B1A]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#132238]/70">
                  {isAr ? 'مختارات الموسم' : 'CURATED SILHOUETTES'}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#132238] sm:text-3xl">
                {t('home.shopByCategory')}
              </h2>
            </div>
            <Link
              to="/shop"
              className="group inline-flex items-center gap-1.5 text-sm font-extrabold text-[#132238] hover:text-[#FF6B1A]"
            >
              <span>{t('home.viewAll')}</span>
              <ArrowIcon
                className={`h-4 w-4 transition-transform duration-200 ${
                  isRtl ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'
                }`}
              />
            </Link>
          </div>

          {categoryCards.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              className="grid grid-cols-2 gap-4 lg:grid-cols-12"
            >
              {categoryCards.map((card, idx) => {
                const isLead = idx === 0;
                const cardTitle = isAr ? card.title_ar : card.title_en || card.title_ar;
                const cardSub = isAr ? card.subtitle_ar : card.subtitle_en || card.subtitle_ar;
                return (
                  <motion.div
                    key={card.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
                    }}
                    className={
                      isLead
                        ? 'col-span-2 lg:col-span-6 lg:row-span-2'
                        : 'col-span-1 lg:col-span-3'
                    }
                  >
                    <Link
                      to={`/shop?category=${card.category_slug}`}
                      className={`group relative block h-full overflow-hidden rounded-sm border border-[#132238]/12 bg-[#ECE9E0] shadow-xs transition-all duration-300 hover:border-[#132238]/30 hover:shadow-md ${
                        isLead
                          ? 'aspect-4/3 lg:aspect-auto lg:min-h-[380px]'
                          : 'aspect-4/5 lg:aspect-square'
                      }`}
                    >
                      <img
                        src={card.cover_image_url}
                        alt={cardTitle}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#090D16]/90 via-[#090D16]/25 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 sm:p-5">
                        <div className="min-w-0">
                          {cardSub && (
                            <p className="mb-1 truncate text-[11px] font-bold tracking-wide text-[#FF6B1A] sm:text-xs">
                              {cardSub}
                            </p>
                          )}
                          <h3
                            className={`font-black leading-tight text-[#F4F2EC] ${
                              isLead ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                            }`}
                          >
                            {cardTitle}
                          </h3>
                        </div>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] bg-[#FF6B1A] text-white transition-transform duration-200 group-hover:scale-105">
                          <ArrowIcon
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'
                            }`}
                          />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {categoriesQuery.data?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="rounded-[2px] border border-[#132238]/15 bg-[#FFFFFF] px-5 py-3 text-sm font-bold text-[#132238] transition-colors hover:border-[#132238] hover:bg-[#132238] hover:text-[#F4F2EC]"
                >
                  {isAr ? cat.name_ar : cat.name_en}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sharp Editorial Asymmetric Campaign Promo Banner */}
      <section id="winter-campaign" className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="grid overflow-hidden rounded-sm border border-[#132238]/15 bg-[#0D1117] text-white shadow-md lg:grid-cols-12">
          {/* 55% Matte Charcoal Copy Column */}
          <div className="flex flex-col justify-between gap-6 p-6 sm:p-10 lg:col-span-7 lg:p-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-[2px] w-6 bg-[#F97316]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                  {promoBanner
                    ? isAr
                      ? promoBanner.badge_ar
                      : promoBanner.badge_en || promoBanner.badge_ar
                    : t('offers.bannerTitle')}
                </span>
              </div>

              <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">
                {promoBanner
                  ? isAr
                    ? promoBanner.title_ar
                    : promoBanner.title_en || promoBanner.title_ar
                  : isAr
                    ? 'خصومات تلقائية على الكميات + شحن لكل المحافظات'
                    : 'Automatic Multi-Piece Bundles + Nationwide COD'}
              </h2>

              <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                {promoBanner
                  ? isAr
                    ? promoBanner.subtitle_ar
                    : promoBanner.subtitle_en || promoBanner.subtitle_ar
                  : t('offers.bannerSub')}
              </p>

              {/* Sleek Architectural Spec Cells */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {bannerPills.length > 0
                  ? bannerPills.map((pill) => (
                      <span
                        key={pill}
                        className="rounded-[2px] border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/90"
                      >
                        {pill}
                      </span>
                    ))
                  : globalTiers.map((tier) => (
                      <span
                        key={tier.minQty}
                        className="rounded-[2px] border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/90"
                      >
                        {describeTier(tier, lang)}
                      </span>
                    ))}
                <span className="rounded-[2px] border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/80">
                  {t('trust.shipping')} • {t('trust.cod')}
                </span>
              </div>
            </div>

            <div>
              <Link
                to={sanitizeSafeUrl(promoBanner?.cta_link, '/shop')}
                className="group inline-flex min-h-12 items-center gap-2.5 rounded-[2px] bg-[#F97316] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#EA580C]"
              >
                <span>
                  {promoBanner
                    ? isAr
                      ? promoBanner.cta_ar
                      : promoBanner.cta_en || promoBanner.cta_ar
                    : t('hero.cta')}
                </span>
                <ArrowIcon
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isRtl ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'
                  }`}
                />
              </Link>
            </div>
          </div>

          {/* 45% Edge-to-Edge Campaign Image with Controlled Dark Vignette */}
          <div className="relative min-h-[260px] overflow-hidden bg-[#090D16] lg:col-span-5 lg:min-h-[380px]">
            <img
              src={
                promoBanner?.background_image_url ||
                'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1600&q=80'
              }
              alt={
                promoBanner
                  ? isAr
                    ? promoBanner.title_ar
                    : promoBanner.title_en
                  : t('offers.bannerTitle')
              }
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[#0D1117]"
              style={{ opacity: Math.min(0.85, Math.max(0.15, bannerOverlayOpacity * 0.65)) }}
            />
            <div
              className={`pointer-events-none absolute inset-0 hidden lg:block ${
                isRtl
                  ? 'bg-linear-to-l from-[#0D1117] via-[#0D1117]/30 to-transparent'
                  : 'bg-linear-to-r from-[#0D1117] via-[#0D1117]/30 to-transparent'
              }`}
            />
          </div>
        </div>
      </section>

      {/* Featured / Trending Winter Collection Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#132238]/12 pb-4">
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
              <Skeleton key={i} className="aspect-4/5 w-full rounded-sm" />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-6 text-center text-[#132238] shadow-xs">
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

      {/* Why VEXA / Bundle How It Works 3-Step Visual Strip */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="rounded-sm bg-[#132238] p-6 text-[#F4F2EC] shadow-md sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6B1A]">
                {isAr ? 'كيف يعمل الخصم التلقائي؟' : 'HOW BUNDLE SAVINGS WORK'}
              </span>
              <h2 className="mt-1 text-xl font-black sm:text-2xl">
                {isAr ? 'وفر تلقائياً في 3 خطوات' : 'Save Automatically in 3 Steps'}
              </h2>
            </div>
            <Link to="/shop">
              <Button variant="primary" size="sm">
                {t('hero.cta')}
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                num: '01',
                icon: Layers,
                titleAr: 'اختر ألوانك ومقاساتك',
                titleEn: 'Mix Colors & Sizes',
                subAr: 'امزج أي مقاسات أو ألوان من نفس الموديل في السلة.',
                subEn: 'Mix any size or color variants of the same product.',
              },
              {
                num: '02',
                icon: Tag,
                titleAr: 'الخصم يُحسب فوراً',
                titleEn: 'Instant Bundle Discount',
                subAr: 'خصم 10% لقطعتين أو 15% لـ 3 قطع تلقائياً بدون كوبون.',
                subEn: 'Unlock 10% off 2+ or 15% off 3+ automatically at checkout.',
              },
              {
                num: '03',
                icon: Banknote,
                titleAr: 'استلم وادفع كاش',
                titleEn: 'Inspect & Pay COD',
                subAr: 'توصيل لكل محافظات مصر مع إمكانية المعاينة قبل الدفع.',
                subEn: 'Nationwide delivery across 27 governorates with Cash on Delivery.',
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="flex items-start gap-3 rounded-[2px] border border-[#F4F2EC]/12 bg-[#1C314E]/60 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] bg-[#FF6B1A] font-display text-sm font-black text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-display text-[11px] font-bold text-[#FF6B1A]">
                      {step.num}
                    </span>
                    <h3 className="text-sm font-extrabold text-[#F4F2EC]">
                      {isAr ? step.titleAr : step.titleEn}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#ECE9E0]/75">
                      {isAr ? step.subAr : step.subEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand Value & Trust Strip */}
      <section className="border-t border-[#132238]/12 bg-[#ECE9E0] text-[#132238]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-12">
          <div className="flex items-start gap-3 rounded-sm border border-[#132238]/10 bg-[#FFFFFF] p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] bg-[#132238] text-[#FF6B1A]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.cod')}</h3>
              <p className="mt-0.5 text-xs text-[#132238]/75">{t('trust.codSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-sm border border-[#132238]/10 bg-[#FFFFFF] p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] bg-[#132238] text-[#FF6B1A]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold">{t('trust.shipping')}</h3>
              <p className="mt-0.5 text-xs text-[#132238]/75">{t('trust.shippingSub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-sm border border-[#132238]/10 bg-[#FFFFFF] p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] bg-[#132238] text-[#FF6B1A]">
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
      </section>
    </PageTransition>
  );
}
