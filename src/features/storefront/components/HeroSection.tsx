import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronDown, Flame, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDir } from '@/shared/hooks/useDir';
import { Button } from '@/shared/components/ui/Button';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: 'easeOut' as const },
  },
};

export function HeroSection() {
  const { t, i18n } = useTranslation();
  const { isRtl } = useDir();
  const isAr = !i18n.language?.startsWith('en');
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-[#F4F2EC] text-[#132238]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-12 lg:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7"
        >
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#FF6B1A] px-4 py-1.5 text-xs font-extrabold tracking-wide text-white shadow-sm">
              <Flame className="h-3.5 w-3.5" />
              {t('hero.badge')}
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-[#132238] sm:text-5xl lg:text-6xl"
          >
            {t('hero.title')}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-xl text-base leading-relaxed text-[#132238]/75 sm:text-lg"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop">
              <Button size="lg" variant="primary">
                <span>{t('hero.cta')}</span>
                <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/track">
              <Button size="lg" variant="outline">
                {t('hero.trackCta')}
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-[#132238]/15 pt-6"
          >
            <div>
              <p className="font-display text-xl font-black text-[#132238] sm:text-2xl">480gsm</p>
              <p className="text-xs font-bold text-[#132238]/70">
                {isAr ? 'قطن مصري ثقيل' : 'Heavyweight Cotton'}
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-black text-[#FF6B1A] sm:text-2xl">27</p>
              <p className="text-xs font-bold text-[#132238]/70">
                {isAr ? 'محافظة في مصر' : 'Governorates'}
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-black text-[#132238] sm:text-2xl">COD</p>
              <p className="text-xs font-bold text-[#132238]/70">
                {isAr ? 'كاش عند الاستلام' : 'Cash on Delivery'}
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
          className="lg:col-span-5"
        >
          <div className="relative overflow-hidden rounded-3xl border border-[#132238]/15 bg-[#FFFFFF] p-2.5 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=900&q=80"
              alt={t('hero.title')}
              className="aspect-4/5 w-full rounded-2xl object-cover"
            />
            <div className="absolute bottom-5 start-5 end-5 rounded-2xl bg-[#132238]/95 p-4 text-[#F4F2EC] shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-[#FF6B1A]">{t('offers.bannerTitle')}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold">
                    <ShieldCheck className="h-4 w-4 text-[#FF6B1A]" />
                    <span>{t('trust.cod')}</span>
                  </p>
                </div>
                <span className="rounded-xl bg-[#FF6B1A] px-3 py-1.5 font-display text-xs font-black text-white">
                  {isAr ? 'وفر حتى 15%' : 'SAVE 15%'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle Scroll Indicator */}
      <div className="flex justify-center pb-5">
        <motion.a
          href="#winter-campaign"
          aria-label="Scroll to collection"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#132238]/20 bg-[#FFFFFF] text-[#132238] shadow-xs hover:border-[#FF6B1A] hover:text-[#FF6B1A]"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.a>
      </div>
    </section>
  );
}
