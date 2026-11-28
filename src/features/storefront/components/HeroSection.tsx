import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Banknote, Layers, MapPin } from 'lucide-react';
import { useDir } from '@/shared/hooks/useDir';
import { sanitizeSafeUrl } from '@/shared/validation/url';
import type { HomepageHero } from '@/shared/types/domain';

const LUXURY_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SLIDE_DURATION_MS = 7000;

const FALLBACK_HERO: HomepageHero = {
  id: 'fallback',
  badge_ar: 'مجموعة شتاء 2026 — مصر',
  badge_en: 'WINTER 2026 COLLECTION — EGYPT',
  title_ar: 'دفء الشتاء بأناقة عصرية',
  title_en: 'Modern Winter Essentials',
  subtitle_ar:
    'خامات قطنية وصوفية ثقيلة مصممة للشتاء المصري. اشتري أكثر ووفر أكثر تلقائياً، والدفع كاش عند الاستلام.',
  subtitle_en:
    'Heavyweight Egyptian cottons and structured winter layers. Automatic multi-piece quantity discounts with Cash on Delivery across Egypt.',
  primary_cta_ar: 'تسوق المجموعة الآن',
  primary_cta_en: 'Shop Collection',
  primary_cta_link: '/shop',
  secondary_cta_ar: 'تتبع طلبك',
  secondary_cta_en: 'Track Order',
  secondary_cta_link: '/track',
  hero_image_url:
    'https://vegsaqfjgbcnhjxdhpme.supabase.co/storage/v1/object/public/products/products/1b635b51-b433-4853-88b3-6e635cbfb59e/6e2ef151-d325-495c-8ab4-ca4953c282e4.webp',
  floating_tag_title_ar: 'عروض الكميات التلقائية',
  floating_tag_title_en: 'Automatic Bundle Offers',
  floating_tag_badge_ar: 'وفر حتى 15%',
  floating_tag_badge_en: 'SAVE 15%',
  stat_1_value: '480gsm',
  stat_1_label_ar: 'قطن مصري ثقيل',
  stat_1_label_en: 'Heavyweight Cotton',
  stat_2_value: '27',
  stat_2_label_ar: 'محافظة في مصر',
  stat_2_label_en: 'Governorates',
  stat_3_value: 'COD',
  stat_3_label_ar: 'كاش عند الاستلام',
  stat_3_label_en: 'Cash on Delivery',
  display_order: 0,
  is_active: true,
  updated_at: '',
};

interface HeroSectionProps {
  heroes?: HomepageHero[];
}

export function HeroSection({ heroes = [] }: HeroSectionProps) {
  const { isRtl, lang } = useDir();
  const isAr = lang === 'ar';
  const prefersReducedMotion = Boolean(useReducedMotion());

  const activeHeroes = heroes.length > 0 ? heroes : [FALLBACK_HERO];
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const safeIdx = slideIdx % activeHeroes.length;
  const hero = activeHeroes[safeIdx] ?? FALLBACK_HERO;

  useEffect(() => {
    if (activeHeroes.length <= 1 || paused || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % activeHeroes.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [activeHeroes.length, paused, prefersReducedMotion]);

  const badge = isAr ? hero.badge_ar : hero.badge_en || hero.badge_ar;
  const title = isAr ? hero.title_ar : hero.title_en || hero.title_ar;
  const subtitle = isAr ? hero.subtitle_ar : hero.subtitle_en || hero.subtitle_ar;
  const primaryCta = isAr ? hero.primary_cta_ar : hero.primary_cta_en || hero.primary_cta_ar;
  const secondaryCta = isAr
    ? hero.secondary_cta_ar
    : hero.secondary_cta_en || hero.secondary_cta_ar;
  const floatingTitle = isAr
    ? hero.floating_tag_title_ar
    : hero.floating_tag_title_en || hero.floating_tag_title_ar;
  const floatingBadge = isAr
    ? hero.floating_tag_badge_ar
    : hero.floating_tag_badge_en || hero.floating_tag_badge_ar;

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative flex min-h-[80vh] flex-col justify-between overflow-hidden bg-[#090D16] text-white lg:min-h-[86vh]"
    >
      {/* Lightweight Static Ambient Gradient (GPU-friendly, zero animated blur filters) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,rgba(249,115,22,0.12),transparent_55%),radial-gradient(ellipse_at_25%_80%,rgba(30,41,59,0.55),transparent_60%)]"
      />

      {/* Oversized Subtle Architectural Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 select-none overflow-hidden"
      >
        <p
          className="whitespace-nowrap text-center font-display text-[20vw] font-black uppercase leading-none tracking-tighter text-white/[0.03] lg:text-[15vw]"
          style={{ WebkitTextStroke: '1px rgba(255,255,255,0.04)' }}
        >
          VEXA WINTER 26
        </p>
      </div>

      <div className="relative z-10 flex flex-1 flex-col lg:block">
        {/* Edge-to-Edge Visual Stage with Explicit Aspect Ratio for 0 CLS */}
        <div className="relative aspect-[4/5] w-full max-h-[54vh] overflow-hidden bg-[#0B1120] lg:absolute lg:inset-y-0 lg:end-0 lg:aspect-auto lg:h-full lg:max-h-none lg:w-[56%]">
          <AnimatePresence mode="wait">
            <motion.img
              key={hero.hero_image_url}
              src={hero.hero_image_url}
              alt={title}
              width={1000}
              height={1250}
              fetchPriority="high"
              loading="eager"
              decoding="sync"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.7, ease: LUXURY_EASE }}
              className="h-full w-full object-cover object-center"
            />
          </AnimatePresence>

          {/* Architectural 1px hairline inner frame */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 hidden border border-white/10 lg:block"
          />

          {/* Seamless dark gradient scrims */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#090D16] via-[#090D16]/35 to-transparent"
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 hidden lg:block ${
              isRtl
                ? 'bg-linear-to-l from-[#090D16] via-[#090D16]/55 to-transparent'
                : 'bg-linear-to-r from-[#090D16] via-[#090D16]/55 to-transparent'
            }`}
          />

          {/* Bottom Bar: Spec Strip + Slide Switcher (Zero Collision at 375px) */}
          <div className="absolute inset-x-4 bottom-4 z-20 flex flex-wrap items-end justify-between gap-2 sm:inset-x-8 sm:bottom-8">
            <div className="inline-flex min-w-0 items-center gap-2.5 rounded-[2px] border-s-2 border-[#F97316] bg-[#0B0F19]/95 px-3 py-2 text-[11px] shadow-lg sm:gap-3 sm:px-4 sm:py-2.5 sm:text-xs">
              <span className="truncate font-semibold text-white/85">{floatingTitle}</span>
              <span className="h-3 w-px shrink-0 bg-white/20" />
              <span className="shrink-0 font-display font-extrabold tracking-wide text-[#F97316]">
                {floatingBadge}
              </span>
            </div>

            {activeHeroes.length > 1 && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-[2px] border border-white/15 bg-[#090D16]/90 p-1">
                {activeHeroes.map((slide, idx) => {
                  const isActive = idx === safeIdx;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setSlideIdx(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`h-9 w-7 cursor-pointer overflow-hidden rounded-[2px] border transition-opacity duration-200 sm:h-11 sm:w-9 ${
                        isActive ? 'border-[#F97316] opacity-100' : 'border-white/15 opacity-50 hover:opacity-85'
                      }`}
                    >
                      <img
                        src={slide.hero_image_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Editorial Typography Column */}
        <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-1 items-end px-4 pb-10 pt-6 sm:px-6 lg:min-h-[76vh] lg:items-center lg:py-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={hero.id}
              initial="hidden"
              animate="visible"
              exit={prefersReducedMotion ? undefined : { opacity: 0, transition: { duration: 0.18 } }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
              className="w-full max-w-xl"
            >
              {/* Clean Borderless Editorial Eyebrow */}
              <motion.div
                variants={{
                  hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: LUXURY_EASE } },
                }}
                className="flex items-center gap-3"
              >
                <span className="h-[2px] w-6 shrink-0 bg-[#F97316]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                  {badge}
                </span>
              </motion.div>

              {/* Massive Masked Editorial Headline */}
              <div className="mt-4 overflow-hidden">
                <motion.h1
                  variants={{
                    hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: '100%' },
                    visible: { opacity: 1, y: '0%', transition: { duration: 0.65, ease: LUXURY_EASE } },
                  }}
                  className="text-4xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl"
                >
                  {title}
                </motion.h1>
              </div>

              {/* Concise Muted Subtitle */}
              <motion.p
                variants={{
                  hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: LUXURY_EASE } },
                }}
                className="mt-5 line-clamp-2 max-w-md text-sm leading-relaxed text-white/70 sm:text-base"
              >
                {subtitle}
              </motion.p>

              {/* Sharp Architectural CTA Buttons */}
              <motion.div
                variants={{
                  hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: LUXURY_EASE } },
                }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Link
                  to={sanitizeSafeUrl(hero.primary_cta_link, '/shop')}
                  className="group inline-flex min-h-13 items-center gap-2.5 rounded-[2px] bg-[#F97316] px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-[#EA580C] sm:text-base"
                >
                  <span>{primaryCta}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>

                <Link
                  to={sanitizeSafeUrl(hero.secondary_cta_link, '/track')}
                  className="inline-flex min-h-13 items-center justify-center rounded-[2px] border border-white/30 px-8 py-4 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white hover:text-slate-950 sm:text-base"
                >
                  {secondaryCta}
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Minimal Bottom Trust Bar + Slide Progress Line */}
      <div className="relative z-20 border-t border-white/10 bg-black/30">
        {activeHeroes.length > 1 && !prefersReducedMotion && (
          <div className="h-[2px] w-full bg-white/10">
            <motion.div
              key={`${safeIdx}-${paused}`}
              initial={{ scaleX: 0 }}
              animate={paused ? undefined : { scaleX: 1 }}
              transition={{ duration: SLIDE_DURATION_MS / 1000, ease: 'linear' }}
              style={{ transformOrigin: isRtl ? 'right' : 'left' }}
              className="h-full bg-[#F97316]"
            />
          </div>
        )}

        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-white/10 px-4 py-3.5 sm:px-6 rtl:divide-x-reverse">
          <div className="flex items-center justify-center gap-2.5 px-2 sm:justify-start sm:px-4">
            <Layers className="h-4 w-4 shrink-0 text-white/60" />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-sm font-black text-white sm:text-base">
                {hero.stat_1_value}
              </span>
              <span className="hidden text-xs font-medium text-white/60 sm:inline">
                {isAr ? hero.stat_1_label_ar : hero.stat_1_label_en}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 px-2 sm:px-4">
            <MapPin className="h-4 w-4 shrink-0 text-[#F97316]" />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-sm font-black text-white sm:text-base">
                {hero.stat_2_value}
              </span>
              <span className="hidden text-xs font-medium text-white/60 sm:inline">
                {isAr ? hero.stat_2_label_ar : hero.stat_2_label_en}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 px-2 sm:justify-end sm:px-4">
            <Banknote className="h-4 w-4 shrink-0 text-white/60" />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-sm font-black text-white sm:text-base">
                {hero.stat_3_value}
              </span>
              <span className="hidden text-xs font-medium text-white/60 sm:inline">
                {isAr ? hero.stat_3_label_ar : hero.stat_3_label_en}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
