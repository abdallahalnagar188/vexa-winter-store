import type { OrderStatus } from '@/shared/types/database';

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['sent_to_shipping', 'cancelled'],
  sent_to_shipping: ['delivered', 'returned', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const TRACKING_STEPS: OrderStatus[] = [
  'new',
  'confirmed',
  'sent_to_shipping',
  'delivered',
];
