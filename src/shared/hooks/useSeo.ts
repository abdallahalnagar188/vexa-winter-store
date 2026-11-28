import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_OG_IMAGE_PATH,
  buildCanonicalUrl,
  getSiteUrl,
  shouldNoIndex,
} from '@/shared/seo/seoUtils';

export interface UseSeoOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string | null;
  ogType?: 'website' | 'product';
  noIndex?: boolean;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function useSeo({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = 'website',
  noIndex,
}: UseSeoOptions): void {
  const { pathname, search } = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const siteName = import.meta.env.VITE_SITE_NAME || 'VEXA';
    const siteUrl = getSiteUrl();
    const isAr = (i18n.language || 'ar').startsWith('ar');
    const resolvedTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
    const resolvedDesc =
      description?.trim() ||
      (isAr
        ? 'VEXA Winter Store — أزياء شتوية عصرية بخامات قطنية ثقيلة 480gsm في مصر. خصومات كميات تلقائية حتى 15% والدفع كاش عند الاستلام.'
        : 'VEXA Winter Store — Heavyweight 480gsm Egyptian winter streetwear. Automatic multi-piece discounts up to 15% with Cash on Delivery across Egypt.');

    const canonicalUrl = buildCanonicalUrl(
      canonicalPath ?? pathname,
      canonicalPath ? '' : search,
      siteUrl,
    );
    const robotsValue = shouldNoIndex(pathname, noIndex) ? 'noindex, nofollow' : 'index, follow';
    const resolvedImage = ogImage?.trim() || `${siteUrl}${DEFAULT_OG_IMAGE_PATH}`;

    document.title = resolvedTitle;
    upsertCanonical(canonicalUrl);

    upsertMeta('name', 'description', resolvedDesc);
    upsertMeta('name', 'robots', robotsValue);

    upsertMeta('property', 'og:title', resolvedTitle);
    upsertMeta('property', 'og:description', resolvedDesc);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', resolvedImage);
    upsertMeta('property', 'og:locale', isAr ? 'ar_EG' : 'en_US');

    upsertMeta('name', 'twitter:title', resolvedTitle);
    upsertMeta('name', 'twitter:description', resolvedDesc);
    upsertMeta('name', 'twitter:image', resolvedImage);
  }, [title, description, canonicalPath, pathname, search, ogImage, ogType, noIndex, i18n.language]);
}
