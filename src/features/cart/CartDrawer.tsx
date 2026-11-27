import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from './cartStore';
import { useCartPricing } from './useCartPricing';
import { CartLine } from './CartLine';
import { CouponBox } from './CouponBox';
import { PriceSummary } from './PriceSummary';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useDir } from '@/shared/hooks/useDir';
import { formatEGP } from '@/lib/format';
import type { ProductVariant, ProductWithDetails } from '@/shared/types/domain';

function resolveColorImageUrl(product: ProductWithDetails, colorName: string): string | null {
  const colorImages = product.product_images.filter(
    (img) => img.color_name === colorName || img.color_name === null,
  );
  const picked = colorImages.find((img) => img.is_primary) ?? colorImages[0];
  return picked?.url ?? null;
}

export function CartDrawer() {
  const { t } = useTranslation();
  const { lang } = useDir();
  const drawerOpen = useCartStore((s) => s.drawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const changeVariant = useCartStore((s) => s.changeVariant);
  const remove = useCartStore((s) => s.remove);
  const syncStock = useCartStore((s) => s.syncStock);

  const { items, priced, variantMap, productMap, staleVariantIds, freeShippingThreshold } =
    useCartPricing(null);

  useEffect(() => {
    if (!drawerOpen || variantMap.size === 0) return;
    const stockRecord: Record<string, number> = {};
    for (const [vid, entry] of variantMap.entries()) {
      stockRecord[vid] = entry.variant.stock;
    }
    syncStock(stockRecord);
  }, [drawerOpen, variantMap, syncStock]);

  const hint = priced.nextTierHint;

  const handleVariantChange = (cartItemKey: string, product: ProductWithDetails, nextVariant: ProductVariant) => {
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
    <Drawer open={drawerOpen} onClose={closeDrawer} ariaLabel={t('cart.title')}>
      <div className="flex items-center justify-between border-b border-[#132238]/15 bg-[#FFFFFF] px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-[#FF6B1A]" />
          <h2 className="text-lg font-extrabold text-[#132238]">{t('cart.title')}</h2>
        </div>
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Close"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[2px] text-[#132238] hover:bg-[#132238]/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {items.length === 0 ? (
          <EmptyState
            title={t('cart.emptyTitle')}
            description={t('cart.emptySub')}
            action={
              <Link to="/shop" onClick={closeDrawer}>
                <Button variant="primary">{t('cart.shopNow')}</Button>
              </Link>
            }
          />
        ) : (
          <>
            {hint && (
              <div className="flex items-center gap-2 rounded-[2px] bg-[#FF6B1A] px-3.5 py-2.5 text-xs font-extrabold text-white shadow-xs">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>
                  {hint.type === 'percent'
                    ? t('offers.addMorePct', { qty: hint.addQty, val: hint.value })
                    : t('offers.addMoreFixed', { qty: hint.addQty, val: formatEGP(hint.value, lang) })}
                </span>
              </div>
            )}

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
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-[#132238]/15 bg-[#FFFFFF] p-4">
          <CouponBox subtotalAfterBundle={priced.subtotalAfterBundle} />
          <PriceSummary priced={priced} freeShippingThreshold={freeShippingThreshold} />
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/checkout" onClick={closeDrawer}>
              <Button variant="primary" size="lg" className="w-full">
                {t('cart.checkout')}
              </Button>
            </Link>
            <Link to="/cart" onClick={closeDrawer}>
              <Button variant="outline" size="md" className="w-full">
                {t('cart.viewCart')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}
