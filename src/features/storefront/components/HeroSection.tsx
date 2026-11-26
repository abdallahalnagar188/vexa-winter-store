import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
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

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
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

  // Scroll parallax capped at 24px
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const shapeParallaxY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 24]);

  // Interactive 3D tilt on pointer move (desktop)
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [4, -4]), {
    stiffness: 180,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-4, 4]), {
    stiffness: 180,
    damping: 22,
  });

  const handlePointerMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

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
      {/* Subtle architectural grid pattern across canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #132238 1px, transparent 1px), linear-gradient(to bottom, #132238 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 sm:pt-10 sm:pb-12 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-4">
          {/* Editorial Copy Column */}
          <motion.div
            key={hero.id}
            variants={containerVariants}
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
            className="relative z-20 lg:col-span-7"
          >
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FF6B1A] px-4 py-1.5 text-xs font-extrabold tracking-wide text-white shadow-xs">
                <Flame className="h-3.5 w-3.5" />
                {badge}
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-[#132238] sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
            >
              {title}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-xl text-base leading-relaxed text-[#132238]/80 sm:text-lg"
            >
              {subtitle}
            </motion.p>

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

            {/* Compact Trust Strip with Line Icons & Count-Up */}
            <motion.div
              variants={itemVariants}
              className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-[#132238]/12 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF]/80 px-2 py-4 shadow-2xs backdrop-blur-xs sm:px-4 rtl:divide-x-reverse"
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
              <div className="mt-5 flex items-center gap-2">
                {activeHeroes.map((h, i) => (
                  <button
                    key={h.id}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setSlideIdx(i)}
                    className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${
                      i === slideIdx ? 'w-7 bg-[#FF6B1A]' : 'w-2 bg-[#132238]/25 hover:bg-[#132238]/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Architectural Showcase — Zero White Box Frame, Sculpted Navy Shape + Interactive Tilt */}
          <div className="relative z-10 lg:col-span-5">
            <div
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
              className="relative mx-auto max-w-md lg:-ms-10 lg:max-w-none"
              style={{ perspective: 900 }}
            >
              {/* Sculpted Navy Architectural Backdrop & Orange Orbital Arc */}
              <motion.div
                aria-hidden="true"
                style={{ y: shapeParallaxY }}
                className="pointer-events-none absolute -inset-4 -z-10 flex items-center justify-center sm:-inset-6"
              >
                <svg
                  viewBox="0 0 500 560"
                  className="h-full w-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M425 120C472 184 486 276 454 352C422 428 346 488 264 504C182 520 94 492 50 428C6 364 10 264 48 184C86 104 160 40 242 24C324 8 378 56 425 120Z"
                    fill="#132238"
                    fillOpacity="0.08"
                  />
                  <circle
                    cx="265"
                    cy="280"
                    r="195"
                    stroke="#FF6B1A"
                    strokeOpacity="0.22"
                    strokeWidth="2"
                    strokeDasharray="10 10"
                  />
                </svg>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={hero.hero_image_url}
                  initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: HERO_EASE }}
                  style={prefersReducedMotion ? undefined : { rotateX, rotateY }}
                >
                  <motion.div
                    animate={prefersReducedMotion ? undefined : { y: [-4, 4, -4] }}
                    transition={
                      prefersReducedMotion
                        ? undefined
                        : { duration: 7, repeat: Infinity, ease: 'easeInOut' }
                    }
                    className="relative"
                  >
                    <img
                      src={hero.hero_image_url}
                      alt={title}
                      fetchPriority="high"
                      className="aspect-4/5 w-full rounded-[2rem] object-contain drop-shadow-[0_22px_30px_rgba(19,34,56,0.16)]"
                    />

                    {/* Refined Floating Glass/Navy Spec Chip */}
                    <div className="absolute bottom-4 start-2 z-20 inline-flex max-w-[calc(100%-1rem)] items-center gap-3 rounded-2xl border border-[#F4F2EC]/20 bg-[#132238]/92 px-4 py-2.5 text-[#F4F2EC] shadow-lg backdrop-blur-md sm:bottom-6 sm:-start-6">
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
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-6 flex justify-center lg:mt-8">
          <motion.a
            href="#winter-campaign"
            aria-label="Scroll to collection"
            animate={prefersReducedMotion ? undefined : { y: [0, 4, 0] }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
            }
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#132238]/20 bg-[#FFFFFF]/80 text-[#132238] shadow-2xs transition-colors duration-200 hover:border-[#FF6B1A] hover:text-[#FF6B1A]"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.a>
        </div>
      </div>
    </section>
  );
}
