import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ArrowRight, Banknote, Layers, MapPin, Sparkles } from 'lucide-react';
import { useDir } from '@/shared/hooks/useDir';
import type { HomepageHero } from '@/shared/types/domain';

const LUXURY_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SLIDE_DURATION_MS = 7000;

const FILM_GRAIN_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

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

  // Auto-advance multi-slide hero with pause-on-hover
  useEffect(() => {
    if (activeHeroes.length <= 1 || paused || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % activeHeroes.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [activeHeroes.length, paused, prefersReducedMotion]);

  // Multi-speed scroll parallax
  const stageRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end start'],
  });

  const watermarkX = useTransform(
    scrollYProgress,
    [0, 1],
    [0, prefersReducedMotion ? 0 : isRtl ? 70 : -70],
  );
  const ambientY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 48]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 28]);

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
      ref={stageRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative flex min-h-[82vh] flex-col justify-between overflow-hidden bg-[#090D16] text-white lg:min-h-[88vh]"
    >
      {/* 1. Ambient Studio Mesh Gradients */}
      <motion.div
        aria-hidden="true"
        style={{ y: ambientY }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { x: [0, 30, -15, 0], y: [0, -25, 20, 0], scale: [1, 1.08, 0.96, 1] }
          }
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 start-1/4 h-[480px] w-[480px] rounded-full bg-[#F97316]/18 blur-[120px]"
        />
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { x: [0, -25, 20, 0], y: [0, 30, -15, 0], scale: [1, 0.94, 1.06, 1] }
          }
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 end-1/4 h-[520px] w-[520px] rounded-full bg-[#1E293B]/75 blur-[130px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(148,163,184,0.12),transparent_55%)]" />
      </motion.div>

      {/* 2. Subtle Editorial Film Grain Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: `url("${FILM_GRAIN_SVG}")` }}
      />

      {/* 3. Oversized Background Watermark Typography */}
      <motion.div
        aria-hidden="true"
        style={{ x: watermarkX }}
        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 select-none overflow-hidden"
      >
        <motion.p
          animate={prefersReducedMotion ? undefined : { x: isRtl ? ['0%', '4%', '0%'] : ['0%', '-4%', '0%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="whitespace-nowrap text-center font-display text-[22vw] font-black uppercase leading-none tracking-tighter text-white/[0.04] lg:text-[16vw]"
          style={{ WebkitTextStroke: '1px rgba(255,255,255,0.05)' }}
        >
          VEXA WINTER 26
        </motion.p>
      </motion.div>

      {/* 4. Dramatic Primary Hero Visual (Full-bleed Asymmetric Stage with Gradient Masks) */}
      <motion.div
        style={{ y: visualY }}
        className="relative z-10 flex flex-1 flex-col lg:block"
      >
        {/* Edge-to-Edge Visual Stage (Mobile top block -> Desktop right/end 58% full height) */}
        <div className="relative h-[44vh] min-h-[320px] w-full overflow-hidden lg:absolute lg:inset-y-0 lg:end-0 lg:h-full lg:w-[58%]">
          <AnimatePresence mode="wait">
            <motion.div
              key={hero.hero_image_url}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.65, ease: LUXURY_EASE }}
              className="relative h-full w-full"
            >
              <motion.img
                src={hero.hero_image_url}
                alt={title}
                fetchPriority="high"
                initial={prefersReducedMotion ? { scale: 1 } : { scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 7, ease: 'easeOut' }}
                className="h-full w-full object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>

          {/* Sleek 1px gradient frame accent */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 hidden rounded-3xl border border-white/10 lg:block"
          />

          {/* Seamless dark gradient masks blending visual into #090D16 stage */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#090D16] via-[#090D16]/35 to-[#090D16]/20"
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 hidden lg:block ${
              isRtl
                ? 'bg-linear-to-l from-[#090D16] via-[#090D16]/60 to-transparent'
                : 'bg-linear-to-r from-[#090D16] via-[#090D16]/60 to-transparent'
            }`}
          />

          {/* Floating Dark-Glass Offer Pill */}
          <motion.div
            animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
            }
            className="absolute bottom-5 start-4 z-20 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-white shadow-2xl backdrop-blur-xl sm:bottom-8 sm:start-8"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {!prefersReducedMotion && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F97316] opacity-75" />
              )}
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F97316]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-white">{floatingTitle}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#F97316] px-2.5 py-0.5 font-display text-[11px] font-black text-white">
              {floatingBadge}
            </span>
          </motion.div>

          {/* Floating Glassmorphic Lookbook Thumbnail Switcher (when multi-slide or interactive) */}
          {activeHeroes.length > 1 && (
            <div className="absolute bottom-5 end-4 z-20 flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 p-1.5 backdrop-blur-xl sm:bottom-8 sm:end-8">
              {activeHeroes.map((slide, idx) => {
                const isActive = idx === safeIdx;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setSlideIdx(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`relative h-12 w-10 cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 ${
                      isActive
                        ? 'scale-105 border-[#F97316] ring-2 ring-[#F97316]/40'
                        : 'border-white/15 opacity-55 hover:opacity-90'
                    }`}
                  >
                    <img
                      src={slide.hero_image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Editorial Typography Overlay Column */}
        <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-1 items-end px-4 pb-10 pt-4 sm:px-6 lg:min-h-[76vh] lg:items-center lg:py-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={hero.id}
              initial="hidden"
              animate="visible"
              exit={prefersReducedMotion ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
              className="w-full max-w-2xl"
            >
              {/* Season Badge */}
              <div className="overflow-hidden">
                <motion.div
                  variants={{
                    hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: '100%' },
                    visible: { opacity: 1, y: '0%', transition: { duration: 0.55, ease: LUXURY_EASE } },
                  }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-extrabold tracking-widest text-white backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 text-[#F97316]" />
                    <span>{badge}</span>
                  </span>
                </motion.div>
              </div>

              {/* Massive Masked Editorial Headline */}
              <div className="mt-5 overflow-hidden">
                <motion.h1
                  variants={{
                    hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: '100%' },
                    visible: { opacity: 1, y: '0%', transition: { duration: 0.7, ease: LUXURY_EASE } },
                  }}
                  className="text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl"
                >
                  {title}
                </motion.h1>
              </div>

              {/* Minimal Muted Subtitle */}
              <div className="mt-5 overflow-hidden">
                <motion.p
                  variants={{
                    hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: '100%' },
                    visible: { opacity: 1, y: '0%', transition: { duration: 0.6, ease: LUXURY_EASE } },
                  }}
                  className="line-clamp-2 max-w-md text-sm leading-relaxed text-white/70 sm:text-base"
                >
                  {subtitle}
                </motion.p>
              </div>

              {/* Sleek CTA Group */}
              <motion.div
                variants={{
                  hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: LUXURY_EASE } },
                }}
                className="mt-8 flex flex-wrap items-center gap-3.5"
              >
                <Link
                  to={hero.primary_cta_link || '/shop'}
                  className="group relative inline-flex min-h-13 items-center gap-2.5 overflow-hidden rounded-full bg-[#F97316] px-8 text-sm font-black text-white shadow-[0_10px_30px_-8px_rgba(249,115,22,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#EA580C] sm:text-base"
                >
                  {/* Hover Sheen Sweep */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <span className="relative">{primaryCta}</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>

                <Link
                  to={hero.secondary_cta_link || '/track'}
                  className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 text-sm font-bold text-white backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 sm:text-base"
                >
                  {secondaryCta}
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 6. Minimal Integrated Bottom Trust Bar + Slide Progress Line */}
      <div className="relative z-20 border-t border-white/10 bg-black/25 backdrop-blur-md">
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
