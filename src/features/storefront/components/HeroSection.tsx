import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  ChevronDown,
  Flame,
  Layers,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useDir } from '@/shared/hooks/useDir';
import { Button } from '@/shared/components/ui/Button';
import type { HomepageHero } from '@/shared/types/domain';

const HERO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SLIDE_DURATION_MS = 6500;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: HERO_EASE },
  },
};

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

function StatValueDisplay({ value, reducedMotion }: { value: string; reducedMotion: boolean }) {
  const match = /^(\d+)(.*)$/.exec(value.trim());
  const numericTarget = match ? parseInt(match[1]!, 10) : null;
  const suffix = match ? match[2] ?? '' : '';

  const [displayNum, setDisplayNum] = useState<number>(() =>
    numericTarget !== null ? (reducedMotion ? numericTarget : 0) : 0,
  );
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (numericTarget === null) return;
    if (reducedMotion) {
      setDisplayNum(numericTarget);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const start = performance.now();
      const duration = 650;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayNum(Math.round(eased * numericTarget));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [numericTarget, reducedMotion]);

  if (numericTarget === null) {
    return <span>{value}</span>;
  }

  return (
    <span ref={ref} className="tabular-nums">
      {displayNum}
      {suffix}
    </span>
  );
}

interface HeroSectionProps {
  heroes?: HomepageHero[];
}

export function HeroSection({ heroes = [] }: HeroSectionProps) {
  const { isRtl, lang } = useDir();
  const isAr = lang === 'ar';
  const prefersReducedMotion = Boolean(useReducedMotion());
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const activeHeroes = heroes.length > 0 ? heroes : [FALLBACK_HERO];
  const [slideIdx, setSlideIdx] = useState(0);
  const hero = activeHeroes[slideIdx % activeHeroes.length] ?? FALLBACK_HERO;

  useEffect(() => {
    if (activeHeroes.length <= 1 || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % activeHeroes.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [activeHeroes.length, prefersReducedMotion]);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const ambientParallaxY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 28]);

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
      ref={sectionRef}
      className="relative overflow-hidden bg-[#F4F2EC] text-[#132238]"
    >
      <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 sm:pt-10 sm:pb-12 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Editorial Copy Column */}
          <AnimatePresence mode="wait">
            <motion.div
              key={hero.id}
              variants={containerVariants}
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.2 } }}
              className="relative z-20 lg:col-span-7"
            >
              <div className="overflow-hidden">
                <motion.div variants={itemVariants}>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#FF6B1A] px-4 py-1.5 text-xs font-extrabold tracking-wide text-white shadow-xs">
                    <Flame className="h-3.5 w-3.5" />
                    {badge}
                  </span>
                </motion.div>
              </div>

              <div className="mt-6 overflow-hidden">
                <motion.h1
                  variants={itemVariants}
                  className="text-4xl font-black leading-[1.06] tracking-tight text-[#132238] sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
                >
                  {title}
                </motion.h1>
              </div>

              <div className="mt-5 overflow-hidden">
                <motion.p
                  variants={itemVariants}
                  className="max-w-xl text-base leading-relaxed text-[#132238]/80 sm:text-lg"
                >
                  {subtitle}
                </motion.p>
              </div>

              <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-4">
                <Link to={hero.primary_cta_link || '/shop'} className="group">
                  <Button size="lg" variant="primary" className="min-h-13 px-8 text-base">
                    <span>{primaryCta}</span>
                    <ArrowIcon
                      className={`h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isRtl ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'
                      }`}
                    />
                  </Button>
                </Link>
                <Link to={hero.secondary_cta_link || '/track'}>
                  <Button size="lg" variant="outline" className="min-h-13 px-7 text-base">
                    {secondaryCta}
                  </Button>
                </Link>
              </motion.div>

              {/* Clean Minimal Trust Stats Bar */}
              <motion.div
                variants={itemVariants}
                className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-[#132238]/12 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF]/85 px-2 py-4 shadow-2xs sm:px-4 rtl:divide-x-reverse"
              >
                <div className="flex flex-col items-start gap-1 px-2 sm:px-4">
                  <div className="flex items-center gap-1.5 text-[#132238]/65">
                    <Layers className="h-4 w-4 shrink-0 text-[#FF6B1A]" />
                    <span className="truncate text-[11px] font-bold sm:text-xs">
                      {isAr ? hero.stat_1_label_ar : hero.stat_1_label_en}
                    </span>
                  </div>
                  <p className="font-display text-2xl font-black text-[#132238] sm:text-3xl">
                    <StatValueDisplay
                      value={hero.stat_1_value}
                      reducedMotion={prefersReducedMotion}
                    />
                  </p>
                </div>

                <div className="flex flex-col items-start gap-1 px-2 sm:px-4">
                  <div className="flex items-center gap-1.5 text-[#132238]/65">
                    <MapPin className="h-4 w-4 shrink-0 text-[#FF6B1A]" />
                    <span className="truncate text-[11px] font-bold sm:text-xs">
                      {isAr ? hero.stat_2_label_ar : hero.stat_2_label_en}
                    </span>
                  </div>
                  <p className="font-display text-2xl font-black text-[#FF6B1A] sm:text-3xl">
                    <StatValueDisplay
                      value={hero.stat_2_value}
                      reducedMotion={prefersReducedMotion}
                    />
                  </p>
                </div>

                <div className="flex flex-col items-start gap-1 px-2 sm:px-4">
                  <div className="flex items-center gap-1.5 text-[#132238]/65">
                    <Banknote className="h-4 w-4 shrink-0 text-[#FF6B1A]" />
                    <span className="truncate text-[11px] font-bold sm:text-xs">
                      {isAr ? hero.stat_3_label_ar : hero.stat_3_label_en}
                    </span>
                  </div>
                  <p className="font-display text-2xl font-black text-[#132238] sm:text-3xl">
                    <StatValueDisplay
                      value={hero.stat_3_value}
                      reducedMotion={prefersReducedMotion}
                    />
                  </p>
                </div>
              </motion.div>

              {activeHeroes.length > 1 && (
                <div className="mt-5 flex max-w-xs items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {activeHeroes.map((h, i) => (
                      <button
                        key={h.id}
                        type="button"
                        aria-label={`Slide ${i + 1}`}
                        onClick={() => setSlideIdx(i)}
                        className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${
                          i === slideIdx ? 'w-6 bg-[#FF6B1A]' : 'w-2 bg-[#132238]/25 hover:bg-[#132238]/50'
                        }`}
                      />
                    ))}
                  </div>
                  {!prefersReducedMotion && (
                    <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-[#132238]/12">
                      <motion.div
                        key={slideIdx}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: SLIDE_DURATION_MS / 1000, ease: 'linear' }}
                        style={{ transformOrigin: isRtl ? 'right' : 'left' }}
                        className="h-full bg-[#FF6B1A]"
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Framed Editorial Garment Showcase with Subtle Ambient Glow */}
          <div className="relative z-10 lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Subtle Ambient Glow / Gradient Mesh */}
              <motion.div
                aria-hidden="true"
                style={{ y: ambientParallaxY }}
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_30%_25%,rgba(255,107,26,0.18),transparent_60%),radial-gradient(circle_at_75%_75%,rgba(19,34,56,0.14),transparent_65%)] blur-2xl"
              />

              {/* Editorial Framed Product Card with Ken Burns Entrance */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-[#132238]/10 bg-[radial-gradient(circle_at_center,#FFFFFF_0%,#F3F2EE_65%,#EAE6DC_100%)] shadow-[0_24px_48px_-12px_rgba(19,34,56,0.18)]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={hero.hero_image_url}
                    src={hero.hero_image_url}
                    alt={title}
                    fetchPriority="high"
                    initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 1.2, ease: HERO_EASE }}
                    className="h-full w-full object-cover object-center"
                  />
                </AnimatePresence>
              </div>

              {/* Glassmorphism Floating Spec Badge with Gentle Float */}
              <motion.div
                animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
                transition={
                  prefersReducedMotion
                    ? undefined
                    : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                }
                className="absolute bottom-4 start-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-2.5 text-[#F4F2EC] shadow-xl backdrop-blur-md sm:bottom-6 sm:-start-5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF6B1A] text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-[#F4F2EC]">
                    {floatingTitle}
                  </p>
                  <p className="truncate text-[11px] font-semibold text-[#ECE9E0]/75">
                    {isAr ? hero.stat_3_label_ar : hero.stat_3_label_en}
                  </p>
                </div>
                <span className="shrink-0 rounded-xl bg-[#FF6B1A] px-2.5 py-1 font-display text-[11px] font-black text-white">
                  {floatingBadge}
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-8 flex justify-center lg:mt-10">
          <motion.a
            href="#winter-campaign"
            aria-label="Scroll to collection"
            animate={prefersReducedMotion ? undefined : { y: [0, 4, 0] }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
            }
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#132238]/20 bg-[#FFFFFF]/85 text-[#132238] shadow-2xs transition-colors duration-200 hover:border-[#FF6B1A] hover:text-[#FF6B1A]"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.a>
        </div>
      </div>
    </section>
  );
}
