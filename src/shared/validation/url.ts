/**
 * Validates navigation/CTA URLs to allow only safe internal paths (`/path`)
 * or `https://` URLs. Blocks `javascript:`, `data:`, `vbscript:`, `http:`, and `//`.
 */
export function isSafeUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeSafeUrl(raw: string | null | undefined, fallback = '/shop'): string {
  return isSafeUrl(raw) ? raw!.trim() : fallback;
}

export function sanitizeAdminRedirect(raw: unknown, fallback = '/admin'): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (/^\/admin(\/|$)/.test(trimmed) && !trimmed.startsWith('//')) {
    return trimmed;
  }
  return fallback;
}
