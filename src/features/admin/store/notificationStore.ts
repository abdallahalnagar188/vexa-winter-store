import { create } from 'zustand';
import {
  getStoredDesktopNotif,
  getStoredSoundMuted,
  saveStoredDesktopNotif,
  saveStoredSoundMuted,
} from '@/features/admin/utils/orderSound';
import type { OrderRecord } from '@/shared/types/domain';

export interface OrderNotificationItem {
  id: string;
  orderId: string;
  orderRef: string;
  customerName: string;
  governorateName: string;
  totalCod: number;
  createdAt: string;
  read: boolean;
}

const READ_IDS_KEY = 'vexa-admin-read-notifs';

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>): void {
  try {
    const trimmed = Array.from(ids).slice(-100);
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

interface AdminNotificationState {
  notifications: OrderNotificationItem[];
  soundMuted: boolean;
  desktopNotifEnabled: boolean;
  pushLiveOrder: (order: {
    id: string;
    order_ref: string;
    customer_name: string;
    governorate_name: string;
    total_cod: number;
    created_at: string;
  }) => void;
  seedFromOrders: (orders: OrderRecord[]) => void;
  markRead: (orderId: string) => void;
  markAllRead: () => void;
  toggleSoundMuted: () => boolean;
  setDesktopNotifEnabled: (enabled: boolean) => void;
}

export const useAdminNotificationStore = create<AdminNotificationState>((set, get) => ({
  notifications: [],
  soundMuted: getStoredSoundMuted(),
  desktopNotifEnabled: getStoredDesktopNotif(),

  pushLiveOrder: (order) =>
    set((state) => {
      if (state.notifications.some((n) => n.orderId === order.id)) return state;
      const item: OrderNotificationItem = {
        id: `live-${order.id}`,
        orderId: order.id,
        orderRef: order.order_ref,
        customerName: order.customer_name,
        governorateName: order.governorate_name,
        totalCod: order.total_cod,
        createdAt: order.created_at || new Date().toISOString(),
        read: false,
      };
      return {
        notifications: [item, ...state.notifications].slice(0, 30),
      };
    }),

  seedFromOrders: (orders) =>
    set((state) => {
      const readIds = loadReadIds();
      const existingByOrder = new Map(state.notifications.map((n) => [n.orderId, n]));
      const recentNew = orders
        .filter((o) => o.status === 'new')
        .slice(0, 15)
        .map((o) => {
          const prev = existingByOrder.get(o.id);
          return (
            prev ?? {
              id: `seed-${o.id}`,
              orderId: o.id,
              orderRef: o.order_ref,
              customerName: o.customer_name,
              governorateName: o.governorate_name,
              totalCod: o.total_cod,
              createdAt: o.created_at,
              read: readIds.has(o.id),
            }
          );
        });

      // Keep any live items that haven't appeared in `orders` query yet
      const seededIds = new Set(recentNew.map((n) => n.orderId));
      const extraLive = state.notifications.filter((n) => !seededIds.has(n.orderId));
      const merged = [...extraLive, ...recentNew]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30);

      return { notifications: merged };
    }),

  markRead: (orderId) =>
    set((state) => {
      const readIds = loadReadIds();
      readIds.add(orderId);
      saveReadIds(readIds);
      return {
        notifications: state.notifications.map((n) =>
          n.orderId === orderId ? { ...n, read: true } : n,
        ),
      };
    }),

  markAllRead: () =>
    set((state) => {
      const readIds = loadReadIds();
      for (const n of state.notifications) readIds.add(n.orderId);
      saveReadIds(readIds);
      return {
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    }),

  toggleSoundMuted: () => {
    const next = !get().soundMuted;
    saveStoredSoundMuted(next);
    set({ soundMuted: next });
    return next;
  },

  setDesktopNotifEnabled: (enabled) => {
    saveStoredDesktopNotif(enabled);
    set({ desktopNotifEnabled: enabled });
  },
}));
