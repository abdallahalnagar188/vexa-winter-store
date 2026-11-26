import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartSnapshot } from '@/shared/types/domain';

function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function buildCartItemKey(productId: string, colorName: string, size: string): string {
  return `${productId.trim()}::${normalizeKeyPart(colorName)}::${normalizeKeyPart(size)}`;
}

interface CartState {
  items: CartItem[];
  drawerOpen: boolean;
  add: (
    item: { variantId: string; productId: string; quantity: number; snapshot: CartSnapshot },
    maxStock?: number,
  ) => void;
  setQuantity: (cartItemKey: string, quantity: number, maxStock?: number) => void;
  changeVariant: (
    currentKey: string,
    next: { variantId: string; snapshot: CartSnapshot },
    maxStock?: number,
  ) => void;
  remove: (cartItemKey: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  syncStock: (stockByVariant: Record<string, number>) => { adjusted: boolean };
}

const MAX_PER_VARIANT = 10;

function sanitizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const deduped = new Map<string, CartItem>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Partial<CartItem>;
    if (
      typeof candidate.variantId !== 'string' ||
      typeof candidate.productId !== 'string' ||
      typeof candidate.quantity !== 'number' ||
      !Number.isFinite(candidate.quantity) ||
      candidate.quantity <= 0 ||
      !candidate.snapshot ||
      typeof candidate.snapshot.titleAr !== 'string' ||
      typeof candidate.snapshot.colorName !== 'string' ||
      typeof candidate.snapshot.size !== 'string'
    ) {
      continue;
    }

    const cartItemKey = buildCartItemKey(
      candidate.productId,
      candidate.snapshot.colorName,
      candidate.snapshot.size,
    );

    const existing = deduped.get(cartItemKey);
    if (existing) {
      deduped.set(cartItemKey, {
        ...existing,
        quantity: Math.min(MAX_PER_VARIANT, existing.quantity + Math.floor(candidate.quantity)),
      });
    } else {
      deduped.set(cartItemKey, {
        cartItemKey,
        variantId: candidate.variantId,
        productId: candidate.productId,
        quantity: Math.min(MAX_PER_VARIANT, Math.max(1, Math.floor(candidate.quantity))),
        snapshot: candidate.snapshot,
      });
    }
  }
  return Array.from(deduped.values());
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,

      add: (incoming, maxStock) => {
        const cap = maxStock !== undefined ? Math.min(MAX_PER_VARIANT, maxStock) : MAX_PER_VARIANT;
        if (cap <= 0) return;

        const cartItemKey = buildCartItemKey(
          incoming.productId,
          incoming.snapshot.colorName,
          incoming.snapshot.size,
        );
        const safeQty = Number.isFinite(incoming.quantity) ? Math.max(1, Math.floor(incoming.quantity)) : 1;

        set((state) => {
          const idx = state.items.findIndex((i) => i.cartItemKey === cartItemKey);
          if (idx >= 0) {
            const updated = [...state.items];
            const existing = updated[idx]!;
            updated[idx] = {
              ...existing,
              variantId: incoming.variantId,
              quantity: Math.min(cap, existing.quantity + safeQty),
              snapshot: incoming.snapshot,
            };
            return { items: updated };
          }
          return {
            items: [
              ...state.items,
              {
                cartItemKey,
                variantId: incoming.variantId,
                productId: incoming.productId,
                quantity: Math.min(cap, safeQty),
                snapshot: incoming.snapshot,
              },
            ],
          };
        });
      },

      setQuantity: (cartItemKey, quantity, maxStock) => {
        const cap = maxStock !== undefined ? Math.min(MAX_PER_VARIANT, maxStock) : MAX_PER_VARIANT;
        if (quantity <= 0) {
          get().remove(cartItemKey);
          return;
        }
        const safeQty = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemKey === cartItemKey || item.variantId === cartItemKey
              ? { ...item, quantity: Math.min(cap, safeQty) }
              : item,
          ),
        }));
      },

      changeVariant: (currentKey, next, maxStock) => {
        const cap = maxStock !== undefined ? Math.min(MAX_PER_VARIANT, maxStock) : MAX_PER_VARIANT;
        if (cap <= 0) return;

        set((state) => {
          const currentIdx = state.items.findIndex(
            (i) => i.cartItemKey === currentKey || i.variantId === currentKey,
          );
          if (currentIdx < 0) return state;

          const currentItem = state.items[currentIdx]!;
          const nextKey = buildCartItemKey(
            currentItem.productId,
            next.snapshot.colorName,
            next.snapshot.size,
          );

          const existingTargetIdx = state.items.findIndex(
            (i, idx) => idx !== currentIdx && i.cartItemKey === nextKey,
          );

          if (existingTargetIdx >= 0) {
            const target = state.items[existingTargetIdx]!;
            const mergedQty = Math.min(cap, target.quantity + currentItem.quantity);
            const nextItems = state.items
              .map((item, idx) =>
                idx === existingTargetIdx
                  ? {
                      ...target,
                      variantId: next.variantId,
                      quantity: mergedQty,
                      snapshot: next.snapshot,
                    }
                  : item,
              )
              .filter((_, idx) => idx !== currentIdx);
            return { items: nextItems };
          }

          const nextItems = [...state.items];
          nextItems[currentIdx] = {
            ...currentItem,
            cartItemKey: nextKey,
            variantId: next.variantId,
            quantity: Math.min(cap, currentItem.quantity),
            snapshot: next.snapshot,
          };
          return { items: nextItems };
        });
      },

      remove: (cartItemKey) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.cartItemKey !== cartItemKey && item.variantId !== cartItemKey,
          ),
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
