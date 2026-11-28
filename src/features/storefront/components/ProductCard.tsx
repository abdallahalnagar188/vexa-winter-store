import { useMemo, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ProductWithDetails } from '@/shared/types/domain';
import { resolveTiers, type PricingTier } from '@/shared/pricing/tiers';
import { useCartStore } from '@/features/cart/cartStore';
import { useDir } from '@/shared/hooks/useDir';
import { formatEGP } from '@/lib/format';
import { trackStorefrontEvent } from '@/lib/storefrontTracker';
import { AnimatedProductCard } from '@/shared/components/motion/AnimatedProductCard';
import { AnimatedDiscountBadge } from '@/shared/components/motion/AnimatedDiscountBadge';
import { cn } from '@/shared/components/ui/cn';

interface ProductCardProps {
  product: ProductWithDetails;
  tiers: PricingTier[];
}

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533"><rect width="400" height="533" fill="#F2F1ED"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#0D1526" font-family="sans-serif" font-size="18" font-weight="bold">VEXA WINTER</text></svg>',
  );

function resolveColorImage(product: ProductWithDetails, colorName: string): string | null {
  const colorImages = product.product_images.filter(
    (img) => img.color_name === colorName || img.color_name === null,
  );
  const picked = colorImages.find((img) => img.is_primary) ?? colorImages[0];
  return picked?.url ?? null;
}

export function ProductCard({ product, tiers }: ProductCardProps) {
  const { t } = useTranslation();
  const { lang } = useDir();
  const addToCart = useCartStore((s) => s.add);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const colorImageMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const img of product.product_images) {
      if (img.color_name && !map.has(img.color_name)) {
        map.set(img.color_name, img.url);
      }
    }
    return map;
  }, [product.product_images]);

  const colors = useMemo(
    () =>
      Array.from(
        new Map(
          product.product_variants.map((v) => [
            v.color_name,
            { name: v.color_name, hex: v.color_hex ?? '#0D1526' },
          ]),
        ).values(),
      ),
    [product.product_variants],
  );

  const activeColorName =
    hoveredColor ??
    selectedColor ??
    product.product_variants.find((v) => v.is_active && v.stock > 0)?.color_name ??
    colors[0]?.name ??
    null;

  const baseImg =
    (activeColorName && colorImageMap.get(activeColorName)) ??
    product.product_images.find((img) => img.is_primary)?.url ??
    product.product_images[0]?.url ??
    FALLBACK_IMG;

  const secondaryImg =
    !hoveredColor && !selectedColor ? product.product_images[1]?.url : undefined;

  const totalStock = product.product_variants.reduce((acc, v) => acc + v.stock, 0);
  const isSoldOut = totalStock <= 0;

  const productTiers = resolveTiers(product.id, tiers);
  const lowestTier = productTiers[0];
  const title = lang === 'ar' ? product.title_ar : product.title_en || product.title_ar;

  const sizeOptions = useMemo(() => {
    const uniqueSizes = Array.from(new Set(product.product_variants.map((v) => v.size)));
    return uniqueSizes.map((size) => {
      const variantForColor = activeColorName
        ? product.product_variants.find(
            (v) => v.color_name === activeColorName && v.size === size && v.is_active,
          )
        : product.product_variants.find((v) => v.size === size && v.is_active);
      return {
        size,
        variant: variantForColor ?? null,
        inStock: Boolean(variantForColor && variantForColor.stock > 0),
      };
    });
  }, [product.product_variants, activeColorName]);

  const handleQuickAddSize = (
    e: MouseEvent<HTMLButtonElement>,
    variant: ProductWithDetails['product_variants'][number],
  ) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(
      {
        variantId: variant.id,
        productId: product.id,
        quantity: 1,
        snapshot: {
          titleAr: product.title_ar,
          titleEn: product.title_en,
          size: variant.size,
          colorName: variant.color_name,
          colorHex: variant.color_hex,
          imageUrl: resolveColorImage(product, variant.color_name),
          slug: product.slug,
        },
      },
      variant.stock,
    );
    toast.success(
      t('product.addedVariantToast', {
        title,
        color: variant.color_name,
        size: variant.size,
      }),
      {
        action: {
          label: t('cart.viewCart'),
          onClick: () => openDrawer(),
        },
      },
    );
    trackStorefrontEvent('add_to_cart', {
      productId: product.id,
    });
  };

  return (
    <AnimatedProductCard>
      <Link to={`/product/${product.slug}`} className="group block text-[#0D1526]">
        {/* Frameless Editorial Image Container */}
        <div className="relative aspect-3/4 overflow-hidden rounded-[2px] bg-[#F2F1ED]">
          <img
            src={baseImg}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_IMG) {
                e.currentTarget.src = FALLBACK_IMG;
              }
            }}
            className={cn(
              'h-full w-full object-cover transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.03]',
              secondaryImg ? 'group-hover:opacity-0' : 'opacity-100',
            )}
          />

          {secondaryImg && (
            <img
              src={secondaryImg}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
            />
          )}

          {/* Low-Profile Top-Start NEW Micro-Tag */}
          {product.is_new && !isSoldOut && (
            <span className="absolute start-2.5 top-2.5 z-10 rounded-[2px] border border-black/5 bg-white/95 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#0D1526]">
              {t('catalog.newTag')}
            </span>
          )}

          {/* Minimalist Matte Out-of-Stock Overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
              <span className="rounded-[2px] border border-black/10 bg-white/95 px-3.5 py-1.5 text-[11px] font-bold tracking-widest text-[#0D1526] uppercase">
                {t('catalog.soldOut')}
              </span>
            </div>
          )}

          {/* Slide-Up Quick-Size Bar on Desktop Hover */}
          {!isSoldOut && sizeOptions.length > 0 && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute inset-x-0 bottom-0 z-20 hidden translate-y-full border-t border-black/5 bg-white/95 px-3 py-2.5 backdrop-blur-sm transition-transform duration-300 ease-out group-hover:translate-y-0 sm:block"
            >
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {sizeOptions.map(({ size, variant, inStock }) =>
                  inStock && variant ? (
                    <button
                      key={size}
                      type="button"
                      onClick={(e) => handleQuickAddSize(e, variant)}
                      aria-label={`${title} - ${activeColorName ?? ''} - ${size}`}
                      className="min-w-7 cursor-pointer rounded-[2px] border border-black/10 bg-transparent px-2 py-1 font-display text-xs font-semibold text-[#0D1526] transition-colors hover:border-[#0D1526] hover:bg-[#0D1526] hover:text-white"
                    >
                      {size}
                    </button>
                  ) : (
                    <span
                      key={size}
                      className="min-w-7 cursor-not-allowed rounded-[2px] border border-black/5 px-2 py-1 text-center font-display text-xs font-semibold text-[#0D1526] line-through opacity-35"
                    >
                      {size}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clean Borderless Editorial Typography & Swatches Below Image */}
        <div className="space-y-2 pt-3">
          {/* Row 1: Title & Price */}
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-[#0D1526] transition-colors group-hover:text-orange-600 sm:text-[15px]">
              {title}
            </h3>
            <span className="font-display text-sm font-bold whitespace-nowrap text-[#0D1526] tabular-nums sm:text-[15px]">
              {formatEGP(product.base_price, lang)}
            </span>
          </div>

          {/* Row 2: Color Swatches & Restrained Bundle Offer */}
          {(colors.length > 0 || (lowestTier && !isSoldOut)) && (
            <div className="flex min-h-5 items-center justify-between gap-2">
              {colors.length > 0 ? (
                <div className="flex items-center gap-2">
                  {colors.slice(0, 5).map((c) => {
                    const isActive = (hoveredColor ?? activeColorName) === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        title={c.name}
                        aria-label={c.name}
                        onMouseEnter={() => setHoveredColor(c.name)}
                        onMouseLeave={() => setHoveredColor(null)}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedColor(c.name);
                        }}
                        className={cn(
                          'h-3.5 w-3.5 cursor-pointer rounded-full border border-black/20 transition-transform hover:scale-110',
                          isActive && 'ring-1 ring-[#0D1526] ring-offset-2 ring-offset-[#F4F2EC]',
                        )}
                        style={{ backgroundColor: c.hex }}
                      />
                    );
                  })}
                </div>
              ) : (
                <span />
              )}

              {lowestTier && !isSoldOut && (
                <AnimatedDiscountBadge className="whitespace-nowrap">
                  {lowestTier.type === 'percent'
                    ? lang === 'ar'
                      ? `قطعتين+ خصم ${lowestTier.value}%`
                      : `Buy ${lowestTier.minQty}+ Save ${lowestTier.value}%`
                    : lang === 'ar'
                      ? `قطعتين+ خصم ${lowestTier.value} ج.م`
                      : `Buy ${lowestTier.minQty}+ Save ${lowestTier.value} EGP`}
                </AnimatedDiscountBadge>
              )}
            </div>
          )}
        </div>
      </Link>
    </AnimatedProductCard>
  );
}
