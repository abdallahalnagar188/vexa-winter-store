import { useMemo } from 'react';
import { useCartStore } from './cartStore';
import { useProducts } from '@/features/storefront/api/useProducts';
import { useTiers } from '@/features/storefront/api/useTiers';
import { usePublicSettings } from '@/features/storefront/api/usePublicSettings';
import { calculateCart } from '@/shared/pricing/calculateCart';
import type { ProductVariant, ProductWithDetails } from '@/shared/types/domain';

export function useCartPricing(shippingFee: number | null = null) {
  const items = useCartStore((s) => s.items);
  const productIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.productId))).sort(),
    [items],
  );

  const productsQuery = useProducts({ ids: productIds.length > 0 ? productIds : ['__none__'] });
  const tiersQuery = useTiers();
  const settingsQuery = usePublicSettings();

  const { priced, variantMap, productMap, staleVariantIds } = useMemo(() => {
    const products = productsQuery.data ?? [];
    const productById = new Map<string, ProductWithDetails>(products.map((p) => [p.id, p]));
    const vMap = new Map<string, { variant: ProductVariant; basePrice: number }>();

    for (const p of products) {
      for (const v of p.product_variants) {
        vMap.set(v.id, { variant: v, basePrice: p.base_price });
      }
    }

    const staleIds: string[] = [];
    const lines = items
      .map((item) => {
        const liveProduct = productById.get(item.productId);
        const liveEntry = vMap.get(item.variantId);
        if (!liveProduct || !liveEntry || !liveEntry.variant.is_active || liveEntry.variant.stock <= 0) {
          if (productsQuery.isFetched && !productsQuery.isFetching) {
            staleIds.push(item.variantId);
          }
          return null;
        }
        return {
          lineKey: item.cartItemKey,
          variantId: item.variantId,
          productId: item.productId,
          unitPrice: liveEntry.basePrice,
          quantity: Math.min(item.quantity, Math.min(10, liveEntry.variant.stock)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const result = calculateCart({
      lines,
      tiers: tiersQuery.data ?? [],
      shippingFee,
      freeShippingThreshold: settingsQuery.data?.freeShippingThreshold ?? 0,
    });

    return { priced: result, variantMap: vMap, productMap: productById, staleVariantIds: staleIds };
  }, [
    items,
    productsQuery.data,
    productsQuery.isFetched,
    productsQuery.isFetching,
    tiersQuery.data,
    settingsQuery.data?.freeShippingThreshold,
    shippingFee,
  ]);

  return {
    items,
    priced,
    variantMap,
    productMap,
    staleVariantIds,
    freeShippingThreshold: settingsQuery.data?.freeShippingThreshold ?? 0,
    tiers: tiersQuery.data ?? [],
    isLoading:
      items.length > 0 && (productsQuery.isLoading || tiersQuery.isLoading || settingsQuery.isLoading),
  };
}
