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
        { name: v.color_name, hex: v.color_hex ?? '#132238' },
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
          <span className="font-bold text-[#132238]">{t('product.selectColor')}</span>
          {selectedColor && <span className="font-semibold text-[#132238]/75">{selectedColor}</span>}
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
                    ? 'border-[#132238] bg-[#132238] text-[#F4F2EC] shadow-sm'
                    : 'border-[#132238]/20 bg-[#F4F2EC] text-[#132238] hover:border-[#132238]',
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
        <div className="mb-2 text-sm font-bold text-[#132238]">{t('product.selectSize')}</div>
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
                    ? 'cursor-not-allowed border-[#132238]/12 bg-[#ECE9E0]/60 text-[#132238]/35 line-through'
                    : active
                      ? 'cursor-pointer border-[#FF6B1A] bg-[#FF6B1A] text-white shadow-sm'
                      : 'cursor-pointer border-[#132238]/20 bg-[#F4F2EC] text-[#132238] hover:border-[#132238]',
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
