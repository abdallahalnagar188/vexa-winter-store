import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProductWithDetails } from '@/shared/types/domain';
import { resolveTiers, type PricingTier } from '@/shared/pricing/tiers';
import { useDir } from '@/shared/hooks/useDir';
import { AnimatedProductCard } from '@/shared/components/motion/AnimatedProductCard';
import { Badge } from '@/shared/components/ui/Badge';
import { PriceTag } from '@/shared/components/ui/PriceTag';

interface ProductCardProps {
  product: ProductWithDetails;
  tiers: PricingTier[];
}

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#ECE9E0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#132238" font-family="sans-serif" font-size="20" font-weight="bold">VEXA WINTER</text></svg>',
  );

export function ProductCard({ product, tiers }: ProductCardProps) {
  const { t } = useTranslation();
  const { lang } = useDir();
  const [hovered, setHovered] = useState(false);

  const primaryImg = product.product_images[0]?.url ?? FALLBACK_IMG;
  const secondaryImg = product.product_images[1]?.url;
  const totalStock = product.product_variants.reduce((acc, v) => acc + v.stock, 0);
  const isSoldOut = totalStock <= 0;

  const productTiers = resolveTiers(product.id, tiers);
  const lowestTier = productTiers[0];
  const title = lang === 'ar' ? product.title_ar : product.title_en || product.title_ar;

  const colors = Array.from(
    new Map(
      product.product_variants.map((v) => [
        v.color_name,
        { name: v.color_name, hex: v.color_hex ?? '#132238' },
      ]),
    ).values(),
  );

  const sizeAvailability = Array.from(new Set(product.product_variants.map((v) => v.size))).map(
    (size) => ({
      size,
      inStock: product.product_variants.some((v) => v.size === size && v.stock > 0),
    }),
  );

  return (
    <AnimatedProductCard>
      <Link
        to={`/product/${product.slug}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] text-[#132238] shadow-xs transition-all duration-200 hover:border-[#132238]/30 hover:shadow-xl"
      >
        <div className="relative aspect-4/5 overflow-hidden bg-[#ECE9E0]">
          <img
            src={hovered && secondaryImg ? secondaryImg : primaryImg}
            alt={title}
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_IMG) {
                e.currentTarget.src = FALLBACK_IMG;
              }
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute start-2.5 top-2.5 flex flex-col gap-1.5">
            {product.is_new && <Badge variant="primary">{t('catalog.newTag')}</Badge>}
            {lowestTier && !isSoldOut && (
              <Badge variant="accent">
                {lowestTier.type === 'percent'
                  ? lang === 'ar'
                    ? `قطعتين+ خصم ${lowestTier.value}%`
                    : `Buy ${lowestTier.minQty}+ Save ${lowestTier.value}%`
                  : lang === 'ar'
                    ? `قطعتين+ خصم ${lowestTier.value} ج.م`
                    : `Buy ${lowestTier.minQty}+ Save ${lowestTier.value} EGP`}
              </Badge>
            )}
          </div>

          {!isSoldOut && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden items-center justify-center sm:flex">
              <span className="inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-[#132238]/92 px-3.5 py-1.5 text-xs font-bold text-[#F4F2EC] opacity-0 backdrop-blur-xs transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                <Eye className="h-3.5 w-3.5 text-[#FF6B1A]" />
                <span>{lang === 'ar' ? 'عرض التفاصيل' : 'Quick View'}</span>
              </span>
            </div>
          )}

          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#132238]/75 backdrop-blur-[1px]">
              <span className="rounded-full bg-[#F4F2EC] px-4 py-1.5 text-xs font-extrabold text-[#132238]">
                {t('catalog.soldOut')}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-2.5 p-3.5 sm:p-4">
          <div>
            <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-[#132238] sm:text-base">
              {title}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <PriceTag price={product.base_price} />
              {colors.length > 0 && (
                <div className="flex items-center gap-1">
                  {colors.slice(0, 4).map((c) => (
                    <span
                      key={c.name}
                      title={c.name}
                      className="h-3.5 w-3.5 rounded-full border border-[#132238]/30"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {sizeAvailability.length > 0 && (
            <div className="flex flex-wrap gap-1 border-t border-[#132238]/10 pt-2">
              {sizeAvailability.map((s) => (
                <span
                  key={s.size}
                  className={`rounded-md px-1.5 py-0.5 font-display text-[10px] font-bold ${
                    s.inStock
                      ? 'bg-[#ECE9E0] text-[#132238]'
                      : 'bg-[#ECE9E0]/50 text-[#132238]/40 line-through'
                  }`}
                >
                  {s.size}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </AnimatedProductCard>
  );
}
