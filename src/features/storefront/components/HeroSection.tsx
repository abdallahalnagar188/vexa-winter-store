import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Flame, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDir } from '@/shared/hooks/useDir';
import { Button } from '@/shared/components/ui/Button';

export function HeroSection() {
  const { t, i18n } = useTranslation();
  const { isRtl } = useDir();
  const isAr = !i18n.language?.startsWith('en');
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-[#C5BFA8] text-[#3E452B]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="lg:col-span-7"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F47B20] px-4 py-1.5 text-xs font-extrabold tracking-wide text-white shadow-sm">
            <Flame className="h-3.5 w-3.5" />
            {t('hero.badge')}
          </span>

          <h1 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight text-[#3E452B] sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#3E452B]/80 sm:text-lg">
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
              <Button size="lg" variant="outline">
                {t('hero.trackCta')}
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-[#3E452B]/20 pt-6">
            <div>
              <p className="font-display text-xl font-black text-[#3E452B] sm:text-2xl">480gsm</p>
              <p className="text-xs font-bold text-[#3E452B]/75">
                {isAr ? 'قطن مصري ثقيل' : 'Heavyweight Cotton'}
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-black text-[#F47B20] sm:text-2xl">27</p>
              <p className="text-xs font-bold text-[#3E452B]/75">
                {isAr ? 'محافظة في مصر' : 'Governorates'}
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-black text-[#3E452B] sm:text-2xl">COD</p>
              <p className="text-xs font-bold text-[#3E452B]/75">
                {isAr ? 'كاش عند الاستلام' : 'Cash on Delivery'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="lg:col-span-5"
        >
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#3E452B]/20 bg-[#EAE6D7] p-2.5 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=900&q=80"
              alt={t('hero.title')}
              className="aspect-4/5 w-full rounded-2xl object-cover"
            />
            <div className="absolute bottom-5 start-5 end-5 rounded-2xl bg-[#3E452B]/95 p-4 text-[#EAE6D7] shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-[#F47B20]">{t('offers.bannerTitle')}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold">
                    <ShieldCheck className="h-4 w-4 text-[#F47B20]" />
                    <span>{t('trust.cod')}</span>
                  </p>
                </div>
                <span className="rounded-xl bg-[#F47B20] px-3 py-1.5 font-display text-xs font-black text-white">
                  {isAr ? 'وفر حتى 15%' : 'SAVE 15%'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
