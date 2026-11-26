import type { DiscountType } from '@/shared/types/database';

export interface PricingTier {
  productId: string | null;
  minQty: number;
  type: DiscountType;
  value: number;
  isActive?: boolean;
}

/**
 * Resolve applicable tiers for a product.
 * Per-product tiers completely override global tiers (productId === null).
 */
export function resolveTiers(productId: string, allTiers: PricingTier[]): PricingTier[] {
  const active = allTiers.filter((t) => t.isActive !== false);
  const productSpecific = active.filter((t) => t.productId === productId);
  const scoped = productSpecific.length > 0 ? productSpecific : active.filter((t) => t.productId === null);
  return [...scoped].sort((a, b) => a.minQty - b.minQty);
}

/**
 * Find the single best tier (highest minQty <= groupQty). Tiers never stack.
 */
export function bestTier(tiers: PricingTier[], groupQty: number): PricingTier | null {
  let chosen: PricingTier | null = null;
  for (const tier of tiers) {
    if (tier.minQty <= groupQty && (!chosen || tier.minQty > chosen.minQty)) {
      chosen = tier;
    }
  }
  return chosen;
}

/**
 * Find the next higher tier to unlock for upsell prompts.
 */
export function nextTier(tiers: PricingTier[], groupQty: number): PricingTier | null {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  return sorted.find((t) => t.minQty > groupQty) ?? null;
}

export function describeTier(tier: PricingTier, lang: 'ar' | 'en'): string {
  if (tier.type === 'percent') {
    return lang === 'ar'
      ? `${tier.minQty} قطع · خصم ${tier.value}%`
      : `${tier.minQty}+ pcs · Save ${tier.value}%`;
  }
  return lang === 'ar'
    ? `${tier.minQty} قطع · خصم ${tier.value} ج.م`
    : `${tier.minQty}+ pcs · Save ${tier.value} EGP`;
}
