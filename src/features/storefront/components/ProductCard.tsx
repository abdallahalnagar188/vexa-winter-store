import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#D5CEBC"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#124E3B" font-family="sans-serif" font-size="20" font-weight="bold">VEXA WINTER</text></svg>',
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

  return (
    <AnimatedProductCard>
      <Link
        to={`/product/${product.slug}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group flex h-full flex-col overflow-hidden rounded-2xl bg-[#E8E3D5] text-[#124E3B] shadow-md transition-shadow hover:shadow-xl"
      >
        <div className="relative aspect-4/5 overflow-hidden bg-[#D5CEBC]">
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
            {product.is_new && <Badge variant="accent">{t('catalog.newTag')}</Badge>}
            {lowestTier && !isSoldOut && (
              <Badge variant="accent">
                {lowestTier.type === 'percent'
                  ? lang === 'ar'
                    ? `قطعتين خصم ${lowestTier.value}%`
                    : `Buy ${lowestTier.minQty} Save ${lowestTier.value}%`
                  : lang === 'ar'
                    ? `قطعتين خصم ${lowestTier.value} ج.م`
                    : `Buy ${lowestTier.minQty} Save ${lowestTier.value} EGP`}
              </Badge>
            )}
          </div>

          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#124E3B]/70 backdrop-blur-[1px]">
              <span className="rounded-full bg-[#E8E3D5] px-4 py-1.5 text-xs font-extrabold text-[#124E3B]">
                {t('catalog.soldOut')}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-2 p-3.5 sm:p-4">
          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-[#124E3B] sm:text-base">
            {title}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <PriceTag price={product.base_price} />
          </div>
        </div>
      </Link>
    </AnimatedProductCard>
  );
}
