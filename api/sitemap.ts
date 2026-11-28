interface SitemapProduct {
  slug: string;
  updated_at?: string | null;
}

interface SitemapCategory {
  slug: string;
}

const DEFAULT_SITE_URL = 'https://vexa-winter-store.vercel.app';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveSiteUrl(): string {
  const configured = (process.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '');
  if (configured && !/your-store\.vercel\.app|example\.com/i.test(configured)) {
    return configured;
  }
  return DEFAULT_SITE_URL;
}

function buildUrlEntry(params: {
  loc: string;
  lastmod?: string | null;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}): string {
  const lastmodTag = params.lastmod
    ? `\n    <lastmod>${escapeXml(params.lastmod.slice(0, 10))}</lastmod>`
    : '';
  return [
    '  <url>',
    `    <loc>${escapeXml(params.loc)}</loc>${lastmodTag}`,
    `    <changefreq>${params.changefreq}</changefreq>`,
    `    <priority>${params.priority}</priority>`,
    '  </url>',
  ].join('\n');
}

export async function GET(): Promise<Response> {
  const siteUrl = resolveSiteUrl();
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(
    /\/+$/,
    '',
  );
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  let products: SitemapProduct[] = [];
  let categories: SitemapCategory[] = [];

  if (supabaseUrl && supabaseKey) {
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: 'application/json',
    };

    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/products?select=slug,updated_at&is_active=eq.true&is_archived=eq.false&order=updated_at.desc`,
          { headers },
        ),
        fetch(
          `${supabaseUrl}/rest/v1/categories?select=slug&is_active=eq.true&order=sort_order.asc`,
          { headers },
        ),
      ]);

      if (productsRes.ok) {
        const rows = (await productsRes.json()) as unknown;
        if (Array.isArray(rows)) {
          products = rows.filter(
            (r): r is SitemapProduct =>
              Boolean(r) && typeof (r as SitemapProduct).slug === 'string',
          );
        }
      } else {
        console.error('Sitemap products fetch failed:', productsRes.status);
      }

      if (categoriesRes.ok) {
        const rows = (await categoriesRes.json()) as unknown;
        if (Array.isArray(rows)) {
          categories = rows.filter(
            (r): r is SitemapCategory =>
              Boolean(r) && typeof (r as SitemapCategory).slug === 'string',
          );
        }
      } else {
        console.error('Sitemap categories fetch failed:', categoriesRes.status);
      }
    } catch (err) {
      console.error('Sitemap generation Supabase query error:', err);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const entries: string[] = [
    buildUrlEntry({
      loc: `${siteUrl}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0',
    }),
    buildUrlEntry({
      loc: `${siteUrl}/shop`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.9',
    }),
    ...categories.map((cat) =>
      buildUrlEntry({
        loc: `${siteUrl}/shop?category=${encodeURIComponent(cat.slug)}`,
        changefreq: 'weekly',
        priority: '0.8',
      }),
    ),
    ...products.map((prod) =>
      buildUrlEntry({
        loc: `${siteUrl}/product/${encodeURIComponent(prod.slug)}`,
        lastmod: prod.updated_at || today,
        changefreq: 'weekly',
        priority: '0.9',
      }),
    ),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
