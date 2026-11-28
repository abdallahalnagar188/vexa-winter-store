import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from './cartStore';
import { useCartPricing } from './useCartPricing';
import { CartLine } from './CartLine';
import { CouponBox } from './CouponBox';
import { PriceSummary } from './PriceSummary';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { useDir } from '@/shared/hooks/useDir';
import { formatEGP } from '@/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export function CartPage() {
  const { t } = useTranslation();
  const { lang } = useDir();
  useDocumentTitle(t('cart.title'));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const { items, priced, variantMap, staleVariantIds, freeShippingThreshold } =
    useCartPricing(null);

  const hint = priced.nextTierHint;

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
              const maxStock = variantMap.get(item.variantId)?.variant.stock ?? 10;
              return (
                <CartLine
                  key={item.cartItemKey}
                  item={item}
                  pricedLine={pricedLine}
                  maxStock={maxStock}
                  isStale={staleVariantIds.includes(item.variantId)}
                  onQuantityChange={(qty) => setQuantity(item.cartItemKey, qty, maxStock)}
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
            <Link
              to="/shop"
              className="mt-3 block text-center text-xs font-bold text-[#132238]/75 underline-offset-4 hover:text-[#132238] hover:underline"
            >
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
