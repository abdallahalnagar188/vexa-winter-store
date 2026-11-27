import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from './cartStore';
import { useCartPricing } from './useCartPricing';
import { CartLine } from './CartLine';
import { CouponBox } from './CouponBox';
import { PriceSummary } from './PriceSummary';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import type { ProductVariant, ProductWithDetails } from '@/shared/types/domain';

function resolveColorImageUrl(product: ProductWithDetails, colorName: string): string | null {
  const colorImages = product.product_images.filter(
    (img) => img.color_name === colorName || img.color_name === null,
  );
  const picked = colorImages.find((img) => img.is_primary) ?? colorImages[0];
  return picked?.url ?? null;
}

export function CartPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('cart.title'));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const changeVariant = useCartStore((s) => s.changeVariant);
  const remove = useCartStore((s) => s.remove);
  const { items, priced, variantMap, productMap, staleVariantIds, freeShippingThreshold } =
    useCartPricing(null);

  const handleVariantChange = (
    cartItemKey: string,
    product: ProductWithDetails,
    nextVariant: ProductVariant,
  ) => {
    changeVariant(
      cartItemKey,
      {
        variantId: nextVariant.id,
        snapshot: {
          titleAr: product.title_ar,
          titleEn: product.title_en,
          size: nextVariant.size,
          colorName: nextVariant.color_name,
          colorHex: nextVariant.color_hex,
          imageUrl: resolveColorImageUrl(product, nextVariant.color_name),
          slug: product.slug,
        },
      },
      nextVariant.stock,
    );
  };

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-6 text-2xl font-black text-[#132238] sm:text-3xl">{t('cart.title')}</h1>

      {items.length === 0 ? (
        <EmptyState
          title={t('cart.emptyTitle')}
          description={t('cart.emptySub')}
          action={
            <Link to="/shop">
              <Button variant="primary" size="lg">
                {t('cart.shopNow')}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-3 rounded-sm border border-[#132238]/12 bg-[#ECE9E0] p-4 lg:col-span-8">
            {items.map((item) => {
              const pricedLine = priced.lines.find(
                (l) => l.lineKey === item.cartItemKey || l.variantId === item.variantId,
              );
              const product = productMap.get(item.productId);
              const maxStock = variantMap.get(item.variantId)?.variant.stock ?? 10;
              return (
                <CartLine
                  key={item.cartItemKey}
                  item={item}
                  pricedLine={pricedLine}
                  product={product}
                  maxStock={maxStock}
                  isStale={staleVariantIds.includes(item.variantId)}
                  onQuantityChange={(qty) => setQuantity(item.cartItemKey, qty, maxStock)}
                  onVariantChange={
                    product ? (nextVar) => handleVariantChange(item.cartItemKey, product, nextVar) : undefined
                  }
                  onRemove={() => remove(item.cartItemKey)}
                />
              );
            })}
          </div>

          <div className="h-fit rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-5 text-[#132238] shadow-lg lg:sticky lg:top-24 lg:col-span-4">
            <h2 className="mb-4 text-lg font-extrabold">{t('checkout.summary')}</h2>
            <CouponBox subtotalAfterBundle={priced.subtotalAfterBundle} />
            <PriceSummary priced={priced} freeShippingThreshold={freeShippingThreshold} />
            <Link to="/checkout" className="mt-5 block">
              <Button variant="primary" size="lg" className="w-full">
                {t('cart.checkout')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
