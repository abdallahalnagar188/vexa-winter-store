import type { OrderStatus } from '@/shared/types/database';
import type { OrderRecord } from '@/shared/types/domain';

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { labelAr: string; labelEn: string; badgeClass: string }
> = {
  new: {
    labelAr: 'طلب جديد',
    labelEn: 'New',
    badgeClass: 'bg-[#FFD60A] text-[#124E3B] border-[#E6C000]',
  },
  confirmed: {
    labelAr: 'تم التأكيد',
    labelEn: 'Confirmed',
    badgeClass: 'bg-[#124E3B] text-[#E8E3D5] border-[#1B664F]',
  },
  sent_to_shipping: {
    labelAr: 'مع شركة الشحن',
    labelEn: 'Shipped',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  delivered: {
    labelAr: 'تم التسليم',
    labelEn: 'Delivered',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  cancelled: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  returned: {
    labelAr: 'مرتجع',
    labelEn: 'Returned',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
};

export const DEFAULT_COURIER_TEMPLATE = `الاسم: {name}
الموبايل: {phone}{phone2_line}
المحافظة: {governorate}
العنوان: {city_area} - {address}
القطع:
{items}
الإجمالي (كاش): {total} ج.م
رقم الأوردر: {ref}{notes_line}`;

export function buildCourierMessage(order: OrderRecord, template?: string): string {
  const tpl = template && template.trim().length > 0 ? template : DEFAULT_COURIER_TEMPLATE;
  const itemsText = (order.order_items ?? [])
    .map((item) => `${item.quantity} × ${item.product_title} (${item.size} / ${item.color})`)
    .join('\n');

  const phone2Line = order.phone_secondary ? `\nموبايل تاني: ${order.phone_secondary}` : '';
  const notesLine = order.notes ? `\nملاحظات: ${order.notes}` : '';

  return tpl
    .replaceAll('{name}', order.customer_name)
    .replaceAll('{phone}', order.phone)
    .replaceAll('{phone2_line}', phone2Line)
    .replaceAll('{governorate}', order.governorate_name)
    .replaceAll('{city_area}', order.city_area)
    .replaceAll('{address}', order.address_details)
    .replaceAll('{items}', itemsText)
    .replaceAll('{total}', String(order.total_cod))
    .replaceAll('{ref}', order.order_ref)
    .replaceAll('{notes_line}', notesLine);
}
