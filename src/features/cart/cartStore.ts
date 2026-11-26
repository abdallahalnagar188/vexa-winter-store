import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartSnapshot } from '@/shared/types/domain';

interface CartState {
  items: CartItem[];
  drawerOpen: boolean;
  add: (item: { variantId: string; productId: string; quantity: number; snapshot: CartSnapshot }, maxStock?: number) => void;
  setQuantity: (variantId: string, quantity: number, maxStock?: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  syncStock: (stockByVariant: Record<string, number>) => { adjusted: boolean };
}

const MAX_PER_VARIANT = 10;

function sanitizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is CartItem => {
    if (!entry || typeof entry !== 'object') return false;
    const candidate = entry as Partial<CartItem>;
    return (
      typeof candidate.variantId === 'string' &&
      typeof candidate.productId === 'string' &&
      typeof candidate.quantity === 'number' &&
      candidate.quantity > 0 &&
      Boolean(candidate.snapshot && typeof candidate.snapshot.titleAr === 'string')
    );
  });
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,

      add: (incoming, maxStock) => {
        const cap = maxStock !== undefined ? Math.min(MAX_PER_VARIANT, maxStock) : MAX_PER_VARIANT;
        if (cap <= 0) return;

        set((state) => {
          const idx = state.items.findIndex((i) => i.variantId === incoming.variantId);
          if (idx >= 0) {
            const updated = [...state.items];
            const existing = updated[idx]!;
            updated[idx] = {
              ...existing,
              quantity: Math.min(cap, existing.quantity + incoming.quantity),
              snapshot: incoming.snapshot,
            };
            return { items: updated };
          }
          return {
            items: [
              ...state.items,
              {
                variantId: incoming.variantId,
                productId: incoming.productId,
                quantity: Math.min(cap, Math.max(1, incoming.quantity)),
                snapshot: incoming.snapshot,
              },
            ],
          };
        });
      },

      setQuantity: (variantId, quantity, maxStock) => {
        const cap = maxStock !== undefined ? Math.min(MAX_PER_VARIANT, maxStock) : MAX_PER_VARIANT;
        if (quantity <= 0) {
          get().remove(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.min(cap, Math.max(1, quantity)) }
              : item,
          ),
        }));
      },

      remove: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),

      clear: () => set({ items: [] }),

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),

      syncStock: (stockByVariant) => {
        let adjusted = false;
        const next: CartItem[] = [];
        for (const item of get().items) {
          const avail = stockByVariant[item.variantId];
          if (avail === undefined) {
            next.push(item);
            continue;
          }
          if (avail <= 0) {
            adjusted = true;
            continue;
          }
          const capped = Math.min(item.quantity, Math.min(MAX_PER_VARIANT, avail));
          if (capped !== item.quantity) adjusted = true;
          next.push({ ...item, quantity: capped });
        }
        if (adjusted) set({ items: next });
        return { adjusted };
      },
    }),
    {
      name: 'vexa-cart:v1',
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => {
        const record = (persisted ?? {}) as { items?: unknown };
        return {
          ...current,
          items: sanitizeItems(record.items),
        };
      },
    },
  ),
);
