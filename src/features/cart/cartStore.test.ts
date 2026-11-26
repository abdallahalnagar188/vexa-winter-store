import { beforeEach, describe, expect, it } from 'vitest';
import { buildCartItemKey, useCartStore } from './cartStore';
import { calculateCart } from '@/shared/pricing/calculateCart';
import type { PricingTier } from '@/shared/pricing/tiers';

describe('cartStore multi-color and multi-size line items', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('normalizes casing and whitespace in buildCartItemKey', () => {
    const k1 = buildCartItemKey('prod-1', ' White ', ' m ');
    const k2 = buildCartItemKey('prod-1', 'white', 'M');
    expect(k1).toBe('prod-1::white::m');
    expect(k1).toBe(k2);
  });

  it('keeps different colors/sizes of the same product as separate line items and aggregates tier discounts', () => {
    const store = useCartStore.getState();

    // 1. Add White + M (qty 1)
    store.add(
      {
        variantId: 'var-white-m',
        productId: 'hoodie-1',
        quantity: 1,
        snapshot: {
          titleAr: 'هودي اوفر سايز',
          titleEn: 'Oversized Hoodie',
          size: 'M',
          colorName: 'White',
          colorHex: '#FFFFFF',
          imageUrl: 'https://example.com/white.jpg',
          slug: 'oversized-hoodie',
        },
      },
      5,
    );

    // 2. Add Black + XL (qty 1) of the SAME product
    store.add(
      {
        variantId: 'var-black-xl',
        productId: 'hoodie-1',
        quantity: 1,
        snapshot: {
          titleAr: 'هودي اوفر سايز',
          titleEn: 'Oversized Hoodie',
          size: 'XL',
          colorName: 'Black',
          colorHex: '#111111',
          imageUrl: 'https://example.com/black.jpg',
          slug: 'oversized-hoodie',
        },
      },
      5,
    );

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0]?.cartItemKey).toBe('hoodie-1::white::m');
    expect(items[1]?.cartItemKey).toBe('hoodie-1::black::xl');

    // Tier discount should sum across both color/size lines (qty 1 + 1 = 2 -> 10% off)
    const tiers: PricingTier[] = [{ productId: null, minQty: 2, type: 'percent', value: 10 }];
    const priced = calculateCart({
      lines: items.map((i) => ({
        lineKey: i.cartItemKey,
        variantId: i.variantId,
        productId: i.productId,
        unitPrice: 470,
        quantity: i.quantity,
      })),
      tiers,
      shippingFee: 60,
      freeShippingThreshold: 0,
    });

    expect(priced.subtotalOriginal).toBe(940);
    expect(priced.discountTotal).toBe(94);
    expect(priced.subtotalAfterDiscount).toBe(846);
    expect(priced.totalCod).toBe(906);
  });

  it('increments existing line quantity cleanly when adding identical (productId, color, size)', () => {
    const store = useCartStore.getState();

    store.add(
      {
        variantId: 'var-white-m',
        productId: 'hoodie-1',
        quantity: 1,
        snapshot: {
          titleAr: 'هودي',
          titleEn: 'Hoodie',
          size: 'M',
          colorName: 'White',
          colorHex: '#FFFFFF',
          imageUrl: null,
          slug: 'hoodie',
        },
      },
      4,
    );

    store.add(
      {
        variantId: 'var-white-m',
        productId: 'hoodie-1',
        quantity: 2,
        snapshot: {
          titleAr: 'هودي',
          titleEn: 'Hoodie',
          size: ' m ',
          colorName: ' white ',
          colorHex: '#FFFFFF',
          imageUrl: null,
          slug: 'hoodie',
        },
      },
      4,
    );

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(3);
  });

  it('supports changing color/size inside cart and merges if target (color, size) already exists', () => {
    const store = useCartStore.getState();

    store.add(
      {
        variantId: 'var-white-m',
        productId: 'hoodie-1',
        quantity: 1,
        snapshot: {
          titleAr: 'هودي',
          titleEn: 'Hoodie',
          size: 'M',
          colorName: 'White',
          colorHex: '#FFFFFF',
          imageUrl: null,
          slug: 'hoodie',
        },
      },
      5,
    );
    store.add(
      {
        variantId: 'var-black-xl',
        productId: 'hoodie-1',
        quantity: 2,
        snapshot: {
          titleAr: 'هودي',
          titleEn: 'Hoodie',
          size: 'XL',
          colorName: 'Black',
          colorHex: '#000000',
          imageUrl: null,
          slug: 'hoodie',
        },
      },
      5,
    );

    // Change White M -> Black XL; should merge into qty 3
    useCartStore.getState().changeVariant(
      'hoodie-1::white::m',
      {
        variantId: 'var-black-xl',
        snapshot: {
          titleAr: 'هودي',
          titleEn: 'Hoodie',
          size: 'XL',
          colorName: 'Black',
          colorHex: '#000000',
          imageUrl: null,
          slug: 'hoodie',
        },
      },
      5,
    );

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.cartItemKey).toBe('hoodie-1::black::xl');
    expect(items[0]?.quantity).toBe(3);
  });
});
