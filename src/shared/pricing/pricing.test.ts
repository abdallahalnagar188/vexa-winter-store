import { describe, expect, it } from 'vitest';
import { calculateCart } from './calculateCart';
import type { PricingTier } from './tiers';

const globalTen: PricingTier[] = [{ productId: null, minQty: 2, type: 'percent', value: 10 }];

describe('calculateCart pricing engine', () => {
  it('1. 1 unit with 2->10% tier gets 0 discount', () => {
    const res = calculateCart({
      lines: [{ variantId: 'v1', productId: 'p1', unitPrice: 1000, quantity: 1 }],
      tiers: globalTen,
      shippingFee: 60,
      freeShippingThreshold: 0,
    });
    expect(res.discountTotal).toBe(0);
    expect(res.subtotalAfterDiscount).toBe(1000);
    expect(res.totalCod).toBe(1060);
  });

  it('2. 2 units with 2->10% tier gets 200 discount', () => {
    const res = calculateCart({
      lines: [{ variantId: 'v1', productId: 'p1', unitPrice: 1000, quantity: 2 }],
      tiers: globalTen,
      shippingFee: null,
      freeShippingThreshold: 0,
    });
    expect(res.subtotalOriginal).toBe(2000);
    expect(res.discountTotal).toBe(200);
    expect(res.subtotalAfterDiscount).toBe(1800);
    expect(res.totalCod).toBeNull();
  });

  it('3. 3 units applies highest tier only (no stacking)', () => {
    const tiers: PricingTier[] = [
      { productId: null, minQty: 2, type: 'percent', value: 10 },
      { productId: null, minQty: 3, type: 'percent', value: 15 },
    ];
    const res = calculateCart({
      lines: [{ variantId: 'v1', productId: 'p1', unitPrice: 1000, quantity: 3 }],
      tiers,
      shippingFee: 0,
      freeShippingThreshold: 0,
    });
    expect(res.subtotalOriginal).toBe(3000);
    expect(res.discountTotal).toBe(450);
    expect(res.subtotalAfterDiscount).toBe(2550);
  });

  it('4. fixed tier subtracts off whole group (not per unit)', () => {
    const tiers: PricingTier[] = [{ productId: null, minQty: 2, type: 'fixed', value: 100 }];
    const res = calculateCart({
      lines: [{ variantId: 'v1', productId: 'p1', unitPrice: 800, quantity: 2 }],
      tiers,
      shippingFee: 0,
      freeShippingThreshold: 0,
    });
    expect(res.subtotalOriginal).toBe(1600);
    expect(res.discountTotal).toBe(100);
    expect(res.subtotalAfterDiscount).toBe(1500);
  });

  it('5. fixed tier larger than group original is clamped', () => {
    const tiers: PricingTier[] = [{ productId: null, minQty: 2, type: 'fixed', value: 500 }];
    const res = calculateCart({
      lines: [{ variantId: 'v1', productId: 'p1', unitPrice: 50, quantity: 2 }],
      tiers,
      shippingFee: 50,
      freeShippingThreshold: 0,
    });
    expect(res.discountTotal).toBe(100);
    expect(res.subtotalAfterDiscount).toBe(0);
    expect(res.totalCod).toBe(50);
  });

  it('6. cross-variant grouping combines different sizes/colors of same product', () => {
    const res = calculateCart({
      lines: [
        { variantId: 'v-black-m', productId: 'p1', unitPrice: 1000, quantity: 1 },
        { variantId: 'v-beige-l', productId: 'p1', unitPrice: 1000, quantity: 1 },
      ],
      tiers: globalTen,
      shippingFee: 0,
      freeShippingThreshold: 0,
    });
    expect(res.discountTotal).toBe(200);
    expect(res.lines[0]?.lineDiscount).toBe(100);
    expect(res.lines[1]?.lineDiscount).toBe(100);
  });

  it('7. per-product tiers override global tiers', () => {
    const tiers: PricingTier[] = [
      { productId: null, minQty: 2, type: 'percent', value: 10 },
      { productId: 'p1', minQty: 2, type: 'percent', value: 20 },
    ];
    const res = calculateCart({
      lines: [{ variantId: 'v1', productId: 'p1', unitPrice: 1000, quantity: 2 }],
      tiers,
      shippingFee: 0,
      freeShippingThreshold: 0,
    });
    expect(res.discountTotal).toBe(400);
    expect(res.subtotalAfterDiscount).toBe(1600);
  });

  it('8. product with no own tiers inherits global tiers', () => {
    const tiers: PricingTier[] = [
      { productId: null, minQty: 2, type: 'percent', value: 10 },
      { productId: 'p-other', minQty: 2, type: 'percent', value: 25 },
    ];
    const res = calculateCart({
      lines: [{ variantId: 'v1', productId: 'p1', unitPrice: 1000, quantity: 2 }],
      tiers,
      shippingFee: 0,
      freeShippingThreshold: 0,
    });
    expect(res.discountTotal).toBe(200);
  });

  it('9. different products never mix in tier calculation', () => {
    const res = calculateCart({
      lines: [
        { variantId: 'v1', productId: 'p1', unitPrice: 1000, quantity: 1 },
        { variantId: 'v2', productId: 'p2', unitPrice: 1500, quantity: 1 },
      ],
      tiers: globalTen,
      shippingFee: 0,
      freeShippingThreshold: 0,
    });
    expect(res.discountTotal).toBe(0);
    expect(res.subtotalAfterDiscount).toBe(2500);
  });

  it('10. rounding remainder allocates cleanly so lines sum exactly to group discount', () => {
    const res = calculateCart({
      lines: [
        { variantId: 'v-a', productId: 'p1', unitPrice: 333, quantity: 1 },
        { variantId: 'v-b', productId: 'p1', unitPrice: 333, quantity: 1 },
        { variantId: 'v-c', productId: 'p1', unitPrice: 333, quantity: 1 },
      ],
      tiers: [{ productId: null, minQty: 2, type: 'percent', value: 10 }],
      shippingFee: 0,
      freeShippingThreshold: 0,
    });
    // groupOriginal = 999, 10% rounded = 100
    expect(res.discountTotal).toBe(100);
    const lineDiscSum = res.lines.reduce((acc, l) => acc + l.lineDiscount, 0);
    expect(lineDiscSum).toBe(100);
  });

  it('11. free shipping threshold zeroes shipping fee when subtotalAfterDiscount >= threshold', () => {
    const res = calculateCart({
      lines: [{ variantId: 'v1', productId: 'p1', unitPrice: 1500, quantity: 1 }],
      tiers: [],
      shippingFee: 75,
      freeShippingThreshold: 1500,
    });
    expect(res.isFreeShipping).toBe(true);
    expect(res.shippingFee).toBe(0);
    expect(res.totalCod).toBe(1500);
  });
});
