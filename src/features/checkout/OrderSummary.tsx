import { useTranslation } from 'react-i18next';
import type { CartItem } from '@/shared/types/domain';
import type { PricedOutput } from '@/shared/pricing/calculateCart';
import { CouponBox } from '@/features/cart/CouponBox';
import { PriceSummary } from '@/features/cart/PriceSummary';
import { formatEGP } from '@/lib/format';
import { useDir } from '@/shared/hooks/useDir';

interface OrderSummaryProps {
  items: CartItem[];
  priced: PricedOutput;
  freeShippingThreshold: number;
  rawShippingFee: number | null;
}

export function OrderSummary({
  items,
  priced,
  freeShippingThreshold,
  rawShippingFee,
}: OrderSummaryProps) {
  const { t } = useTranslation();
  const { lang } = useDir();

  return (
    <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-5 text-[#132238] shadow-lg">
      <h2 className="mb-4 text-lg font-extrabold">{t('checkout.summary')}</h2>
      <div className="mb-4 space-y-3 border-b border-[#132238]/12 pb-4">
        {items.map((item) => {
          const line = priced.lines.find(
            (l) => l.lineKey === item.cartItemKey || l.variantId === item.variantId,
          );
          const title =
            lang === 'ar' ? item.snapshot.titleAr : item.snapshot.titleEn || item.snapshot.titleAr;
          return (
            <div key={item.cartItemKey} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2.5">
                <img
                  src={item.snapshot.imageUrl ?? ''}
                  alt={title}
                  className="h-12 w-10 shrink-0 rounded-[2px] bg-[#ECE9E0] object-contain p-0.5"
                />
                <div className="min-w-0">
                  <p className="truncate font-bold">{title}</p>
                  <p className="text-xs text-[#132238]/70">
                    {item.quantity} × {item.snapshot.size} / {item.snapshot.colorName}
                  </p>
                </div>
              </div>
              {line && (
                <div className="shrink-0 text-end">
                  <p className="font-display font-extrabold tabular-nums">
                    {formatEGP(line.lineTotal, lang)}
                  </p>
                  {line.lineDiscount > 0 && (
                    <p className="font-display text-xs text-[#132238]/50 line-through">
                      {formatEGP(line.lineOriginal, lang)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CouponBox subtotalAfterBundle={priced.subtotalAfterBundle} />

      <PriceSummary
        priced={priced}
        freeShippingThreshold={freeShippingThreshold}
        rawShippingFee={rawShippingFee}
      />
    </div>
  );
}
