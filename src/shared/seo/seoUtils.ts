export const DEFAULT_SITE_URL = 'https://vexa-winter-store.vercel.app';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png';

const NOINDEX_PREFIXES = ['/admin', '/cart', '/checkout', '/order', '/track'];

const PLACEHOLDER_URL_RE = /your-store\.vercel\.app|example\.com/i;

export function getSiteUrl(configuredUrl?: string): string {
  const raw = (configuredUrl ?? import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '');
  if (!raw || PLACEHOLDER_URL_RE.test(raw)) {
    return DEFAULT_SITE_URL;
  }
  return raw;
}

export function shouldNoIndex(pathname: string, explicitNoIndex?: boolean): boolean {
  if (explicitNoIndex) return true;
  return NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Produces clean canonical URLs:
 * - Strips noisy catalog query parameters (`?q=`, `?size=`, `?color=`, `?inStock=`, `?sort=`)
 * - Preserves `?category=<slug>` on `/shop` only when a specific category is active
 */
export function buildCanonicalUrl(
  pathname: string,
  search = '',
  siteUrl = getSiteUrl(),
): string {
  const base = siteUrl.replace(/\/+$/, '');
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (normalizedPath === '/shop' && search) {
    const params = new URLSearchParams(search);
    const category = params.get('category')?.trim();
    if (category && category !== 'all') {
      return `${base}/shop?category=${encodeURIComponent(category)}`;
    }
  }

  return normalizedPath === '/' ? `${base}/` : `${base}${normalizedPath}`;
}

export function buildHomeJsonLd(siteUrl = getSiteUrl()): Record<string, unknown>[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'VEXA',
      alternateName: 'VEXA Winter Store',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/og-image.png`,
      areaServed: 'EG',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'VEXA Winter Store',
      url: `${siteUrl}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export interface ProductJsonLdInput {
  siteUrl?: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  sku: string;
  priceEgp: number;
  inStock: boolean;
  homeLabel: string;
  categoryName?: string | null;
  categorySlug?: string | null;
}

export function buildProductJsonLd(input: ProductJsonLdInput): Record<string, unknown>[] {
  const siteUrl = (input.siteUrl ?? getSiteUrl()).replace(/\/+$/, '');
  const canonicalUrl = `${siteUrl}/product/${encodeURIComponent(input.slug)}`;
  const validImages = input.images.filter((url) => url.trim().length > 0);
  const imageList =
    validImages.length > 0 ? validImages : [`${siteUrl}${DEFAULT_OG_IMAGE_PATH}`];

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: imageList,
    sku: input.sku,
    brand: {
      '@type': 'Brand',
      name: 'VEXA',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EGP',
      price: input.priceEgp,
      availability: input.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    },
  };

  const breadcrumbItems: Array<Record<string, unknown>> = [
    {
      '@type': 'ListItem',
      position: 1,
      name: input.homeLabel,
      item: `${siteUrl}/`,
    },
  ];

  if (input.categoryName && input.categorySlug) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: input.categoryName,
      item: `${siteUrl}/shop?category=${encodeURIComponent(input.categorySlug)}`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: input.name,
      item: canonicalUrl,
    });
  } else {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: input.name,
      item: canonicalUrl,
    });
  }

  const breadcrumbSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return [productSchema, breadcrumbSchema];
}
