import { useTranslation } from 'react-i18next';
import type { PricedOutput } from '@/shared/pricing/calculateCart';
import { formatEGP } from '@/lib/format';
import { useDir } from '@/shared/hooks/useDir';
import { AnimatedDiscountBadge } from '@/shared/components/motion/AnimatedDiscountBadge';

interface PriceSummaryProps {
  priced: PricedOutput;
  freeShippingThreshold: number;
  rawShippingFee?: number | null;
}

export function PriceSummary({ priced, freeShippingThreshold, rawShippingFee }: PriceSummaryProps) {
  const { t } = useTranslation();
  const { lang } = useDir();

  const awayFromFree =
    freeShippingThreshold > 0 && priced.subtotalAfterDiscount < freeShippingThreshold
      ? freeShippingThreshold - priced.subtotalAfterDiscount
      : 0;

  return (
    <div className="flex flex-col gap-2.5 text-sm text-[#132238]">
      {priced.discountTotal > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[#132238]/75">{t('cart.originalSubtotal')}</span>
            <span className="font-display text-[#132238]/55 line-through tabular-nums">
              {formatEGP(priced.subtotalOriginal, lang)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold">{t('cart.discountTotal')}</span>
            <AnimatedDiscountBadge>
              -{formatEGP(priced.discountTotal, lang)}
            </AnimatedDiscountBadge>
          </div>
        </>
      )}

      <div className="flex items-center justify-between font-bold">
        <span>{t('cart.subtotal')}</span>
        <span className="font-display text-base font-extrabold tabular-nums">
          {formatEGP(priced.subtotalAfterDiscount, lang)}
        </span>
      </div>

      {priced.shippingFee !== null ? (
        <div className="flex items-center justify-between">
          <span className="text-[#132238]/80">{t('checkout.shippingFee')}</span>
          {priced.isFreeShipping ? (
            <div className="flex items-center gap-2">
              {rawShippingFee ? (
                <span className="font-display text-xs text-[#132238]/50 line-through">
                  {formatEGP(rawShippingFee, lang)}
                </span>
              ) : null}
              <AnimatedDiscountBadge>{t('checkout.free')}</AnimatedDiscountBadge>
            </div>
          ) : (
            <span className="font-display font-bold tabular-nums">
              {formatEGP(priced.shippingFee, lang)}
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#132238]/70">{t('cart.shippingNote')}</p>
      )}

      {freeShippingThreshold > 0 && (
        <div className="rounded-xl bg-[#132238]/8 px-3 py-2 text-xs font-bold text-[#132238]">
          {awayFromFree === 0
            ? t('cart.freeShippingUnlocked')
            : t('cart.freeShippingAway', { amount: formatEGP(awayFromFree, lang) })}
        </div>
      )}

      {priced.totalCod !== null && (
        <div className="mt-1 flex items-center justify-between border-t border-[#132238]/15 pt-3 text-base font-extrabold">
          <span>{t('checkout.totalCod')}</span>
          <span className="font-display text-xl text-[#132238] tabular-nums">
            {formatEGP(priced.totalCod, lang)}
          </span>
        </div>
      )}
    </div>
  );
}
