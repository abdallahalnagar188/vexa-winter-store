import { Link } from 'react-router-dom';
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
  onNavigate?: () => void;
}

export function CartLine({
  item,
  pricedLine,
  maxStock = 10,
  isStale,
  onQuantityChange,
  onRemove,
  onNavigate,
}: CartLineProps) {
  const { t } = useTranslation();
  const { lang } = useDir();
  const title = lang === 'ar' ? item.snapshot.titleAr : item.snapshot.titleEn || item.snapshot.titleAr;
  const productPath = `/product/${item.snapshot.slug}`;

  return (
    <div className="flex gap-3 rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-3 text-[#132238] shadow-2xs">
      <Link to={productPath} onClick={onNavigate} className="shrink-0">
        {item.snapshot.imageUrl ? (
          <img
            src={item.snapshot.imageUrl}
            alt={`${title} - ${item.snapshot.colorName}`}
            className="h-24 w-20 rounded-[2px] border border-[#132238]/10 bg-[#ECE9E0] object-cover"
          />
        ) : (
          <div
            aria-label={title}
            className="flex h-24 w-20 items-center justify-center rounded-[2px] border border-[#132238]/10 bg-[#ECE9E0] font-display text-[10px] font-bold text-[#132238]/45"
          >
            VEXA
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to={productPath}
              onClick={onNavigate}
              className="block truncate text-sm font-extrabold text-[#132238] transition-colors hover:text-[#FF6B1A]"
            >
              {title}
            </Link>

            {/* Clean static variant metadata line (no inline dropdown clutter) */}
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#132238]/75">
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                style={{ backgroundColor: item.snapshot.colorHex ?? '#132238' }}
              />
              <span>
                {item.snapshot.colorName} •{' '}
                <span className="font-display font-bold">{item.snapshot.size}</span>
              </span>
            </div>

            {isStale && (
              <p className="mt-1 text-xs font-bold text-rose-700">{t('product.outOfStock')}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label={t('cart.remove')}
            title={t('cart.remove')}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[2px] text-[#132238]/55 transition-colors hover:bg-rose-100 hover:text-rose-700"
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
                  <span className="font-display text-xs text-[#132238]/50 line-through tabular-nums">
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
