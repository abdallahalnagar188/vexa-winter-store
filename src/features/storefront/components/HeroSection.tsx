import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDir } from '@/shared/hooks/useDir';
import { Button } from '@/shared/components/ui/Button';

export function HeroSection() {
  const { t } = useTranslation();
  const { isRtl } = useDir();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-[#124E3B] text-[#E8E3D5]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="lg:col-span-7"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFD60A] px-3.5 py-1 text-xs font-extrabold text-[#124E3B]">
            <Sparkles className="h-3.5 w-3.5" />
            {t('hero.badge')}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-[#E8E3D5] sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#E8E3D5]/80 sm:text-lg">
            {t('hero.subtitle')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop">
              <Button size="lg" variant="primary">
                <span>{t('hero.cta')}</span>
                <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/track">
              <Button size="lg" variant="outlineLight">
                {t('hero.trackCta')}
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="lg:col-span-5"
        >
          <div className="relative overflow-hidden rounded-3xl border border-[#E8E3D5]/20 bg-[#E8E3D5] p-2 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=900&q=80"
              alt={t('hero.title')}
              className="aspect-4/5 w-full rounded-2xl object-cover"
            />
            <div className="absolute bottom-5 start-5 end-5 rounded-2xl bg-[#124E3B]/90 p-4 text-[#E8E3D5] backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#FFD60A]">{t('offers.bannerTitle')}</p>
                  <p className="mt-0.5 text-sm font-bold">{t('trust.cod')}</p>
                </div>
                <span className="rounded-xl bg-[#FFD60A] px-3 py-1.5 font-display text-xs font-black text-[#124E3B]">
                  COD
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
