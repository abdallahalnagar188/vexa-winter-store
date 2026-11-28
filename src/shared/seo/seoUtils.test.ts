import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SITE_URL,
  buildCanonicalUrl,
  buildHomeJsonLd,
  buildProductJsonLd,
  getSiteUrl,
  shouldNoIndex,
} from './seoUtils';

describe('seoUtils', () => {
  it('falls back to DEFAULT_SITE_URL when configured URL is placeholder or empty', () => {
    expect(getSiteUrl('')).toBe(DEFAULT_SITE_URL);
    expect(getSiteUrl('https://your-store.vercel.app')).toBe(DEFAULT_SITE_URL);
    expect(getSiteUrl('https://vexa-custom.com/')).toBe('https://vexa-custom.com');
  });

  it('strips noisy shop filter params from canonical URL while preserving category', () => {
    expect(buildCanonicalUrl('/shop', '?category=hoodies&q=heavy&size=L&color=Navy&inStock=true')).toBe(
      `${DEFAULT_SITE_URL}/shop?category=hoodies`,
    );
    expect(buildCanonicalUrl('/shop', '?category=all&q=cotton&size=M')).toBe(
      `${DEFAULT_SITE_URL}/shop`,
    );
    expect(buildCanonicalUrl('/shop', '?q=cotton')).toBe(`${DEFAULT_SITE_URL}/shop`);
    expect(buildCanonicalUrl('/', '?utm_source=ig')).toBe(`${DEFAULT_SITE_URL}/`);
    expect(buildCanonicalUrl('/product/heavy-hoodie/', '')).toBe(
      `${DEFAULT_SITE_URL}/product/heavy-hoodie`,
    );
  });

  it('marks admin, cart, checkout, order confirmation, and tracking as noindex', () => {
    expect(shouldNoIndex('/')).toBe(false);
    expect(shouldNoIndex('/shop')).toBe(false);
    expect(shouldNoIndex('/product/heavy-hoodie')).toBe(false);

    expect(shouldNoIndex('/admin')).toBe(true);
    expect(shouldNoIndex('/admin/login')).toBe(true);
    expect(shouldNoIndex('/admin/orders')).toBe(true);
    expect(shouldNoIndex('/cart')).toBe(true);
    expect(shouldNoIndex('/checkout')).toBe(true);
    expect(shouldNoIndex('/order/WNT-482913')).toBe(true);
    expect(shouldNoIndex('/track')).toBe(true);
    expect(shouldNoIndex('/unknown', true)).toBe(true);
  });

  it('builds Organization and WebSite JSON-LD schemas for HomePage', () => {
    const schemas = buildHomeJsonLd('https://vexa-winter-store.vercel.app');
    expect(schemas).toHaveLength(2);
    expect(schemas[0]).toMatchObject({
      '@type': 'Organization',
      name: 'VEXA',
      areaServed: 'EG',
    });
    expect(schemas[1]).toMatchObject({
      '@type': 'WebSite',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://vexa-winter-store.vercel.app/shop?q={search_term_string}',
      },
    });
  });

  it('builds Product and BreadcrumbList JSON-LD schemas with EGP currency and availability', () => {
    const inStockSchemas = buildProductJsonLd({
      siteUrl: 'https://vexa-winter-store.vercel.app',
      slug: 'oversized-heavyweight-hoodie',
      name: 'Oversized Heavyweight Hoodie',
      description: '480gsm Egyptian cotton hoodie',
      images: ['https://cdn.example.com/hoodie.webp'],
      sku: 'HD-BLK-L',
      priceEgp: 450,
      inStock: true,
      homeLabel: 'Home',
      categoryName: 'Hoodies',
      categorySlug: 'hoodies',
    });

    expect(inStockSchemas).toHaveLength(2);
    expect(inStockSchemas[0]).toMatchObject({
      '@type': 'Product',
      name: 'Oversized Heavyweight Hoodie',
      sku: 'HD-BLK-L',
      brand: { '@type': 'Brand', name: 'VEXA' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'EGP',
        price: 450,
        availability: 'https://schema.org/InStock',
        url: 'https://vexa-winter-store.vercel.app/product/oversized-heavyweight-hoodie',
      },
    });
    expect(inStockSchemas[1]).toMatchObject({
      '@type': 'BreadcrumbList',
    });

    const outOfStockSchemas = buildProductJsonLd({
      siteUrl: 'https://vexa-winter-store.vercel.app',
      slug: 'sold-out-jacket',
      name: 'Sold Out Jacket',
      description: 'Winter jacket',
      images: [],
      sku: 'JK-01',
      priceEgp: 990,
      inStock: false,
      homeLabel: 'Home',
    });
    expect(outOfStockSchemas[0]).toMatchObject({
      image: ['https://vexa-winter-store.vercel.app/og-image.png'],
      offers: {
        availability: 'https://schema.org/OutOfStock',
      },
    });
  });
});
