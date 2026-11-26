declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

export function trackPixelEvent(
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase',
  params?: Record<string, unknown>,
): void {
  if (!PIXEL_ID || typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return;
  }
  window.fbq('track', eventName, params);
}
