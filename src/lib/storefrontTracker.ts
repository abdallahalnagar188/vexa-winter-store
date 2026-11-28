import { isSupabaseConfigured, supabase } from './supabase';

const SESSION_KEY = 'athar-sid';
let fallbackSessionId: string | null = null;

export function getStorefrontSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 6) return existing;
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `sid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    if (!fallbackSessionId) {
      fallbackSessionId = `sid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
    return fallbackSessionId;
  }
}

export type StorefrontEventType = 'page_view' | 'product_view' | 'add_to_cart';

export function trackStorefrontEvent(
  eventType: StorefrontEventType,
  options?: { path?: string; productId?: string | null },
): void {
  if (!isSupabaseConfigured) return;

  const path =
    options?.path ??
    (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/');

  if (path.startsWith('/admin')) return;

  const sessionId = getStorefrontSessionId();
  void Promise.resolve(
    supabase.rpc('log_storefront_event', {
      p_session_id: sessionId,
      p_event_type: eventType,
      p_path: path.slice(0, 300),
      p_product_id: options?.productId ?? null,
    }),
  ).catch(() => {
    // Analytics must never interrupt storefront UX
  });
}
