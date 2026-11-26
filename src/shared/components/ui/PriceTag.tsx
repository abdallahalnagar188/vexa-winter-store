import { formatEGP } from '@/lib/format';
import { useDir } from '@/shared/hooks/useDir';
import { cn } from './cn';

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceTag({ price, originalPrice, size = 'md', className }: PriceTagProps) {
  const { lang } = useDir();
  const hasDiscount = originalPrice !== undefined && originalPrice > price;

  const sizeClass =
    size === 'lg' ? 'text-xl sm:text-2xl' : size === 'sm' ? 'text-sm' : 'text-base sm:text-lg';

  return (
    <div className={cn('inline-flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('font-display font-extrabold tabular-nums text-[#124E3B]', sizeClass)}>
        {formatEGP(price, lang)}
      </span>
      {hasDiscount && (
        <span className="font-display text-xs font-medium text-[#124E3B]/55 line-through tabular-nums sm:text-sm">
          {formatEGP(originalPrice, lang)}
        </span>
      )}
    </div>
  );
}
