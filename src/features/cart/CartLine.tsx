import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CartItem, ProductVariant, ProductWithDetails } from '@/shared/types/domain';
import type { PricedLineOutput } from '@/shared/pricing/calculateCart';
import { useDir } from '@/shared/hooks/useDir';
import { formatEGP } from '@/lib/format';
import { QuantityStepper } from '@/shared/components/ui/QuantityStepper';
import { AnimatedDiscountBadge } from '@/shared/components/motion/AnimatedDiscountBadge';

interface CartLineProps {
  item: CartItem;
  pricedLine?: PricedLineOutput;
  product?: ProductWithDetails;
  maxStock?: number;
  isStale?: boolean;
  onQuantityChange: (qty: number) => void;
  onVariantChange?: (variant: ProductVariant) => void;
  onRemove: () => void;
}

export function CartLine({
  item,
  pricedLine,
  product,
  maxStock = 10,
  isStale,
  onQuantityChange,
  onVariantChange,
  onRemove,
}: CartLineProps) {
  const { t } = useTranslation();
  const { lang } = useDir();
  const title = lang === 'ar' ? item.snapshot.titleAr : item.snapshot.titleEn || item.snapshot.titleAr;

  const activeVariants = (product?.product_variants ?? []).filter((v) => v.is_active && v.stock > 0);
  const availableColors = Array.from(
    new Map(activeVariants.map((v) => [v.color_name, v.color_name])).values(),
  );
  const sizesForCurrentColor = activeVariants
    .filter((v) => v.color_name === item.snapshot.colorName)
    .map((v) => v.size);
  const showVariantControls =
    Boolean(onVariantChange) && (availableColors.length > 1 || sizesForCurrentColor.length > 1);

  const handleColorSelect = (nextColor: string) => {
    if (!onVariantChange || nextColor === item.snapshot.colorName) return;
    const sameSizeMatch = activeVariants.find(
      (v) => v.color_name === nextColor && v.size === item.snapshot.size,
    );
    const firstForColor = activeVariants.find((v) => v.color_name === nextColor);
    const nextVariant = sameSizeMatch ?? firstForColor;
    if (nextVariant) onVariantChange(nextVariant);
  };

  const handleSizeSelect = (nextSize: string) => {
    if (!onVariantChange || nextSize === item.snapshot.size) return;
    const match = activeVariants.find(
      (v) => v.color_name === item.snapshot.colorName && v.size === nextSize,
    );
    if (match) onVariantChange(match);
  };

  return (
    <div className="flex gap-3 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-3 text-[#132238] shadow-2xs">
      <img
        src={item.snapshot.imageUrl ?? ''}
        alt={title}
        className="h-24 w-20 shrink-0 rounded-xl bg-[#ECE9E0] object-contain p-1"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-extrabold">{title}</h4>
            {showVariantControls ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {availableColors.length > 1 ? (
                  <select
                    aria-label={t('product.selectColor')}
                    value={item.snapshot.colorName}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="h-7 max-w-[110px] cursor-pointer rounded-lg border border-[#132238]/18 bg-[#F4F2EC] px-2 text-xs font-bold text-[#132238] focus:border-[#FF6B1A] focus:outline-none"
                  >
                    {availableColors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-[#132238]/75">
                    {item.snapshot.colorName}
                  </span>
                )}

                {sizesForCurrentColor.length > 1 ? (
                  <select
                    aria-label={t('product.selectSize')}
                    value={item.snapshot.size}
                    onChange={(e) => handleSizeSelect(e.target.value)}
                    className="h-7 cursor-pointer rounded-lg border border-[#132238]/18 bg-[#F4F2EC] px-2 font-display text-xs font-bold text-[#132238] focus:border-[#FF6B1A] focus:outline-none"
                  >
                    {sizesForCurrentColor.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-display text-xs font-bold text-[#132238]/75">
                    {item.snapshot.size}
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-0.5 text-xs text-[#132238]/70">
                {item.snapshot.colorName} • {item.snapshot.size}
              </p>
            )}
            {isStale && (
              <p className="mt-1 text-xs font-bold text-rose-700">{t('product.outOfStock')}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('cart.remove')}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#132238]/60 hover:bg-rose-100 hover:text-rose-700"
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
