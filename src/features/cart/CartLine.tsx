import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CartItem } from '@/shared/types/domain';
import type { PricedLineOutput } from '@/shared/pricing/calculateCart';
import { useDir } from '@/shared/hooks/useDir';
import { formatEGP } from '@/lib/format';
import { QuantityStepper } from '@/shared/components/ui/QuantityStepper';
import { AnimatedDiscountBadge } from '@/shared/components/motion/AnimatedDiscountBadge';

interface CartLineProps {
  item: CartItem;
  pricedLine?: PricedLineOutput;
  maxStock?: number;
  isStale?: boolean;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}

export function CartLine({
  item,
  pricedLine,
  maxStock = 10,
  isStale,
  onQuantityChange,
  onRemove,
}: CartLineProps) {
  const { t } = useTranslation();
  const { lang } = useDir();
  const title = lang === 'ar' ? item.snapshot.titleAr : item.snapshot.titleEn || item.snapshot.titleAr;

  return (
    <div className="flex gap-3 rounded-2xl border border-[#3E452B]/15 bg-[#F5F2E8] p-3 text-[#3E452B]">
      <img
        src={item.snapshot.imageUrl ?? ''}
        alt={title}
        className="h-24 w-20 shrink-0 rounded-xl bg-[#D2CCB8] object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-extrabold">{title}</h4>
            <p className="mt-0.5 text-xs text-[#3E452B]/70">
              {item.snapshot.colorName} • {item.snapshot.size}
            </p>
            {isStale && (
              <p className="mt-1 text-xs font-bold text-rose-700">{t('product.outOfStock')}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('cart.remove')}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#3E452B]/60 hover:bg-rose-100 hover:text-rose-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <QuantityStepper
            value={item.quantity}
            max={Math.min(10, Math.max(1, maxStock))}
            onChange={onQuantityChange}
            disabled={isStale}
          />
          {pricedLine && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-sm font-extrabold tabular-nums">
                  {formatEGP(pricedLine.lineTotal, lang)}
                </span>
                {pricedLine.lineDiscount > 0 && (
                  <span className="font-display text-xs text-[#3E452B]/50 line-through tabular-nums">
                    {formatEGP(pricedLine.lineOriginal, lang)}
                  </span>
                )}
              </div>
              {pricedLine.lineDiscount > 0 && (
                <AnimatedDiscountBadge>
                  {t('offers.youSave', { amount: formatEGP(pricedLine.lineDiscount, lang) })}
                </AnimatedDiscountBadge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
