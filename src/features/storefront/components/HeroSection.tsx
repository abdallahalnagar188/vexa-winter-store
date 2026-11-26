import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
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
import { useTranslation } from 'react-i18next';
import { useDir } from '@/shared/hooks/useDir';
import { Button } from '@/shared/components/ui/Button';

const HERO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
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

function CountUpNumber({
  target,
  suffix = '',
  reducedMotion,
}: {
  target: number;
  suffix?: string;
  reducedMotion: boolean;
}) {
  const [value, setValue] = useState(() => (reducedMotion ? target : 0));
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      setValue(target);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const runAnimation = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const duration = 650;
      const start = performance.now();

      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, reducedMotion]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

export function HeroSection() {
  const { t, i18n } = useTranslation();
  const { isRtl } = useDir();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const isAr = !i18n.language?.startsWith('en');
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const shapeParallaxY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 24]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#F4F2EC] text-[#132238]"
    >
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 sm:pt-10 sm:pb-12 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-4">
          {/* Editorial Copy Column */}
          <motion.div
            variants={containerVariants}
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
            className="relative z-20 lg:col-span-7"
          >
            {/* 1. Badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FF6B1A] px-4 py-1.5 text-xs font-extrabold tracking-wide text-white shadow-xs">
                <Flame className="h-3.5 w-3.5" />
                {t('hero.badge')}
              </span>
            </motion.div>

            {/* 2. Headline */}
            <motion.h1
              variants={itemVariants}
              className="mt-6 text-4xl font-black leading-[1.06] tracking-tight text-[#132238] sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
            >
              {t('hero.title')}
            </motion.h1>

            {/* 3. Paragraph */}
            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-xl text-base leading-relaxed text-[#132238]/80 sm:text-lg sm:leading-relaxed"
            >
              {t('hero.subtitle')}
            </motion.p>

            {/* 4. CTAs */}
            <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/shop" className="group">
                <Button size="lg" variant="primary" className="min-h-13 px-8 text-base">
                  <span>{t('hero.cta')}</span>
                  <ArrowIcon
                    className={`h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isRtl ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'
                    }`}
                  />
                </Button>
              </Link>
              <Link to="/track">
                <Button size="lg" variant="outline" className="min-h-13 px-7 text-base">
                  {t('hero.trackCta')}
                </Button>
              </Link>
            </motion.div>

            {/* 5. Compact Trust & Stats Strip */}
            <motion.div
              variants={itemVariants}
              className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-[#132238]/12 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF]/75 px-2 py-4 shadow-2xs sm:px-4 rtl:divide-x-reverse"
            >
              <div className="flex flex-col items-start gap-1 px-2 sm:px-4">
                <div className="flex items-center gap-1.5 text-[#132238]/65">
                  <Layers className="h-4 w-4 text-[#FF6B1A]" />
                  <span className="text-[11px] font-bold sm:text-xs">
                    {isAr ? 'قطن مصري ثقيل' : 'Heavyweight Cotton'}
                  </span>
                </div>
                <p className="font-display text-2xl font-black text-[#132238] sm:text-3xl">
                  <CountUpNumber target={480} suffix="gsm" reducedMotion={prefersReducedMotion} />
                </p>
              </div>

              <div className="flex flex-col items-start gap-1 px-2 sm:px-4">
                <div className="flex items-center gap-1.5 text-[#132238]/65">
                  <MapPin className="h-4 w-4 text-[#FF6B1A]" />
                  <span className="text-[11px] font-bold sm:text-xs">
                    {isAr ? 'محافظة في مصر' : 'Governorates'}
                  </span>
                </div>
                <p className="font-display text-2xl font-black text-[#FF6B1A] sm:text-3xl">
                  <CountUpNumber target={27} reducedMotion={prefersReducedMotion} />
                </p>
              </div>

              <div className="flex flex-col items-start gap-1 px-2 sm:px-4">
                <div className="flex items-center gap-1.5 text-[#132238]/65">
                  <Banknote className="h-4 w-4 text-[#FF6B1A]" />
                  <span className="text-[11px] font-bold sm:text-xs">
                    {isAr ? 'كاش عند الاستلام' : 'Cash on Delivery'}
                  </span>
                </div>
                <p className="font-display text-2xl font-black text-[#132238] sm:text-3xl">COD</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Product Visual Column — Open, Frameless, Overlapping */}
          <div className="relative z-10 lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:-ms-10 lg:max-w-none">
              {/* Organic Low-Opacity Backdrop Shape with Capped Scroll Parallax */}
              <motion.div
                aria-hidden="true"
                style={{ y: shapeParallaxY }}
                className="pointer-events-none absolute -inset-4 -z-10 flex items-center justify-center sm:-inset-6"
              >
                <svg
                  viewBox="0 0 480 540"
                  className="h-full w-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M412.5 114.2C456.8 175.4 468.9 264.7 439.2 339.1C409.5 413.5 338 473.1 258.4 489.6C178.8 506.1 91.1 479.5 48.2 418.4C5.3 357.3 7.2 261.7 43.9 182.8C80.6 103.9 152.1 41.7 232.3 25.1C312.5 8.5 368.2 53 412.5 114.2Z"
                    fill="#132238"
                    fillOpacity="0.065"
                  />
                  <circle
                    cx="265"
                    cy="275"
                    r="185"
                    stroke="#FF6B1A"
                    strokeOpacity="0.16"
                    strokeWidth="2"
                    strokeDasharray="10 10"
                  />
                </svg>
              </motion.div>

              {/* Frameless Product Image: Calm Entrance + Gentle Float */}
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.12, ease: HERO_EASE }}
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
                    src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80"
                    alt={t('hero.title')}
                    fetchPriority="high"
                    className="aspect-4/5 w-full rounded-[2rem] object-cover drop-shadow-[0_18px_28px_rgba(19,34,56,0.12)]"
                  />

                  {/* Refined Floating Promo Chip on Image Edge */}
                  <div className="absolute bottom-4 start-2 z-20 inline-flex max-w-[calc(100%-1rem)] items-center gap-3 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF]/95 px-3.5 py-2.5 text-[#132238] shadow-md sm:bottom-6 sm:-start-6 sm:px-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#132238] text-[#FF6B1A]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-extrabold text-[#132238]">
                        {t('offers.bannerTitle')}
                      </p>
                      <p className="truncate text-[11px] font-semibold text-[#132238]/70">
                        {t('trust.cod')}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-xl bg-[#FF6B1A] px-2.5 py-1 font-display text-[11px] font-black text-white">
                      {isAr ? 'وفر حتى 15%' : 'SAVE 15%'}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Integrated Scroll Indicator */}
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

      {/* Soft Gradient Bridge to Campaign Section */}
      <div
        aria-hidden="true"
        className="pointer-events-none h-6 w-full bg-linear-to-b from-[#F4F2EC] to-[#ECE9E0]/35"
      />
    </section>
  );
}
