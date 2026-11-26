import { useTranslation } from 'react-i18next';
import type { ProductVariant } from '@/shared/types/domain';
import { cn } from '@/shared/components/ui/cn';

interface VariantPickerProps {
  variants: ProductVariant[];
  selectedColor: string | null;
  selectedSize: string | null;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: string) => void;
}

export function VariantPicker({
  variants,
  selectedColor,
  selectedSize,
  onSelectColor,
  onSelectSize,
}: VariantPickerProps) {
  const { t } = useTranslation();

  const uniqueColors = Array.from(
    new Map(
      variants.map((v) => [
        v.color_name,
        { name: v.color_name, hex: v.color_hex ?? '#3E452B' },
      ]),
    ).values(),
  );

  const uniqueSizes = Array.from(new Set(variants.map((v) => v.size)));

  const sizeStock = (size: string): number => {
    const match = variants.find(
      (v) => v.size === size && (!selectedColor || v.color_name === selectedColor),
    );
    return match ? match.stock : 0;
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-[#3E452B]">{t('product.selectColor')}</span>
          {selectedColor && <span className="font-semibold text-[#3E452B]/75">{selectedColor}</span>}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {uniqueColors.map((color) => {
            const active = selectedColor === color.name;
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => onSelectColor(color.name)}
                className={cn(
                  'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition-all',
                  active
                    ? 'border-[#3E452B] bg-[#3E452B] text-[#EAE6D7] shadow-sm'
                    : 'border-[#3E452B]/25 bg-[#F5F2E8] text-[#3E452B] hover:border-[#3E452B]',
                )}
              >
                <span
                  className="h-4 w-4 rounded-full border border-black/20"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-bold text-[#3E452B]">{t('product.selectSize')}</div>
        <div className="flex flex-wrap gap-2">
          {uniqueSizes.map((size) => {
            const stock = sizeStock(size);
            const disabled = stock <= 0;
            const active = selectedSize === size && !disabled;
            return (
              <button
                key={size}
                type="button"
                disabled={disabled}
                onClick={() => onSelectSize(size)}
                className={cn(
                  'min-h-11 min-w-13 rounded-xl border px-3.5 font-display text-sm font-bold transition-all',
                  disabled
                    ? 'cursor-not-allowed border-[#3E452B]/15 bg-[#D2CCB8]/60 text-[#3E452B]/40 line-through'
                    : active
                      ? 'cursor-pointer border-[#F47B20] bg-[#F47B20] text-white shadow-sm'
                      : 'cursor-pointer border-[#3E452B]/25 bg-[#F5F2E8] text-[#3E452B] hover:border-[#3E452B]',
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
