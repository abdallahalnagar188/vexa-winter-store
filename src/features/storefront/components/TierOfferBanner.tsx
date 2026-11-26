import { Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { describeTier, type PricingTier } from '@/shared/pricing/tiers';
import { useDir } from '@/shared/hooks/useDir';
import { AnimatedDiscountBadge } from '@/shared/components/motion/AnimatedDiscountBadge';

interface TierOfferBannerProps {
  tiers: PricingTier[];
  activeMinQty?: number | null;
}

export function TierOfferBanner({ tiers, activeMinQty }: TierOfferBannerProps) {
  const { t } = useTranslation();
  const { lang } = useDir();

  if (tiers.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#124E3B]/20 bg-[#F2EFE6] p-4 text-[#124E3B]">
      <div className="flex items-center gap-2 text-sm font-extrabold">
        <Tag className="h-4 w-4 text-[#124E3B]" />
        <span>{t('offers.bannerTitle')}</span>
      </div>
      <p className="mt-1 text-xs text-[#124E3B]/75">{t('offers.bannerSub')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tiers.map((tier) => {
          const isActive = activeMinQty === tier.minQty;
          return isActive ? (
            <AnimatedDiscountBadge key={tier.minQty}>
              {describeTier(tier, lang)}
            </AnimatedDiscountBadge>
          ) : (
            <span
              key={tier.minQty}
              className="inline-flex items-center rounded-full border border-[#124E3B]/25 bg-[#E8E3D5] px-3 py-1 text-xs font-bold text-[#124E3B]"
            >
              {describeTier(tier, lang)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
