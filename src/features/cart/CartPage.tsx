import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from './cartStore';
import { useCartPricing } from './useCartPricing';
import { CartLine } from './CartLine';
import { PriceSummary } from './PriceSummary';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export function CartPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('cart.title'));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const { items, priced, variantMap, staleVariantIds, freeShippingThreshold } = useCartPricing(null);

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-6 text-2xl font-extrabold text-[#E8E3D5] sm:text-3xl">{t('cart.title')}</h1>

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
          <div className="space-y-3 rounded-2xl bg-[#E8E3D5] p-4 lg:col-span-8">
            {items.map((item) => {
              const pricedLine = priced.lines.find((l) => l.variantId === item.variantId);
              const maxStock = variantMap.get(item.variantId)?.variant.stock ?? 10;
              return (
                <CartLine
                  key={item.variantId}
                  item={item}
                  pricedLine={pricedLine}
                  maxStock={maxStock}
                  isStale={staleVariantIds.includes(item.variantId)}
                  onQuantityChange={(qty) => setQuantity(item.variantId, qty, maxStock)}
                  onRemove={() => remove(item.variantId)}
                />
              );
            })}
          </div>

          <div className="h-fit rounded-2xl bg-[#E8E3D5] p-5 text-[#124E3B] shadow-lg lg:sticky lg:top-24 lg:col-span-4">
            <h2 className="mb-4 text-lg font-extrabold">{t('checkout.summary')}</h2>
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
