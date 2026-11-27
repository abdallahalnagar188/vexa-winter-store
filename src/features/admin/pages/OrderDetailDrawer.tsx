import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, MessageCircle, Phone, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderStatus } from '@/shared/types/database';
import type { CustomerRiskStat, OrderRecord } from '@/shared/types/domain';
import { ALLOWED_STATUS_TRANSITIONS } from '@/shared/constants/transitions';
import { ORDER_STATUS_META } from '@/shared/constants/orderStatus';
import { formatDate, formatEGP } from '@/lib/format';
import { useUpdateOrderNotes, useUpdateOrderStatus } from '@/features/admin/api/useAdminOrders';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { CopyForCourierButton } from '@/features/admin/components/CopyForCourierButton';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Button } from '@/shared/components/ui/Button';

interface OrderDetailDrawerProps {
  order: OrderRecord | null;
  allOrders: OrderRecord[];
  riskStat?: CustomerRiskStat;
  courierTemplate?: string;
  onPrintWaybill?: (order: OrderRecord) => void;
  onClose: () => void;
}

export function OrderDetailDrawer({
  order,
  allOrders,
  riskStat,
  courierTemplate,
  onPrintWaybill,
  onClose,
}: OrderDetailDrawerProps) {
  const [internalNotes, setInternalNotes] = useState('');
  const [restock, setRestock] = useState(true);
  const updateStatus = useUpdateOrderStatus();
  const updateNotes = useUpdateOrderNotes();

  useEffect(() => {
    if (order) {
      setInternalNotes(order.internal_notes ?? '');
      setRestock(true);
    }
  }, [order]);

  if (!order) return null;

  const returnedCount =
    riskStat?.returned_count ??
    allOrders.filter((o) => o.phone === order.phone && o.status === 'returned').length;
  const cancelledCount =
    riskStat?.cancelled_count ??
    allOrders.filter((o) => o.phone === order.phone && o.status === 'cancelled').length;
  const deliveredCount =
    riskStat?.delivered_count ??
    allOrders.filter((o) => o.phone === order.phone && o.status === 'delivered').length;
  const showRiskWarning = returnedCount >= 1 || cancelledCount >= 2;
  const showRepeatTrusted = !showRiskWarning && deliveredCount >= 2 && returnedCount === 0;

  const nextStatuses = ALLOWED_STATUS_TRANSITIONS[order.status];

  const handleTransition = async (next: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        newStatus: next,
        restock: next === 'cancelled' || next === 'returned' ? restock : false,
      });
      toast.success(`تم تحديث الحالة إلى: ${ORDER_STATUS_META[next].labelAr}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleNotesBlur = () => {
    if ((order.internal_notes ?? '') === internalNotes) return;
    void updateNotes.mutateAsync({ orderId: order.id, internalNotes });
  };

  return (
    <Drawer open={Boolean(order)} onClose={onClose} ariaLabel={order.order_ref}>
      <div className="flex items-center justify-between border-b border-[#132238]/12 bg-[#FFFFFF] px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-extrabold">{order.order_ref}</h2>
          <p className="text-xs text-[#132238]/70">{formatDate(order.created_at, 'ar')}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[2px] hover:bg-[#132238]/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
        {showRiskWarning && (
          <div className="flex items-center gap-2 rounded-[2px] border border-amber-400 bg-amber-100 p-3 text-xs font-extrabold text-amber-950">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-800" />
            <span>
              تنبيه: هذا الرقم لديه {returnedCount} مرتجع / {cancelledCount} ملغي سابقاً (إجمالي{' '}
              {riskStat?.total_orders ?? returnedCount + cancelledCount + deliveredCount} طلبات).
            </span>
          </div>
        )}
        {showRepeatTrusted && (
          <div className="flex items-center gap-2 rounded-[2px] border border-[#1F7A4D]/35 bg-[#1F7A4D]/10 p-3 text-xs font-extrabold text-[#1F7A4D]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>عميل متكرر موثوق ({deliveredCount} طلبات ناجحة بدون أي مرتجعات)</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CopyForCourierButton order={order} template={courierTemplate} size="md" />
            {onPrintWaybill && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => onPrintWaybill(order)}
              >
                <Printer className="h-4 w-4" />
                <span>طباعة البوليصة</span>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <a href={`tel:${order.phone}`}>
              <Button variant="secondary" size="sm">
                <Phone className="h-3.5 w-3.5" />
                <span>اتصال</span>
              </Button>
            </a>
            <a
              href={`https://wa.me/2${order.phone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>واتساب</span>
              </Button>
            </a>
          </div>
        </div>

        <div className="space-y-1.5 rounded-sm border border-[#132238]/10 bg-[#FFFFFF] p-4">
          <p className="font-extrabold">{order.customer_name}</p>
          <p className="font-display text-xs">{order.phone}</p>
          {order.phone_secondary && <p className="font-display text-xs">{order.phone_secondary}</p>}
          <p className="pt-1 text-xs font-bold">
            {order.governorate_name} — {order.city_area}
          </p>
          <p className="text-xs text-[#132238]/80">{order.address_details}</p>
          {order.notes && <p className="text-xs text-amber-900">ملاحظة العميل: {order.notes}</p>}
        </div>

        <div className="space-y-2 rounded-sm border border-[#132238]/10 bg-[#FFFFFF] p-4">
          <p className="font-extrabold">القطع المطلوبة</p>
          {(order.order_items ?? []).map((item) => (
            <div key={item.id} className="flex justify-between gap-2 text-xs">
              <span>
                {item.quantity} × {item.product_title} ({item.size} / {item.color})
              </span>
              <span className="font-display font-bold">{formatEGP(item.line_total, 'ar')}</span>
            </div>
          ))}
          <div className="space-y-1 border-t border-[#132238]/12 pt-2 text-xs">
            <div className="flex justify-between">
              <span>قبل الخصم:</span>
              <span className="font-display">{formatEGP(order.subtotal_original, 'ar')}</span>
            </div>
            {order.discount_total > 0 && (
              <div className="flex justify-between text-[#FF6B1A]">
                <span>خصم الكميات:</span>
                <span className="font-display">-{formatEGP(order.discount_total, 'ar')}</span>
              </div>
            )}
            {(order.coupon_discount ?? 0) > 0 && (
              <div className="flex justify-between text-[#1F7A4D]">
                <span>كوبون ({order.coupon_code}):</span>
                <span className="font-display">-{formatEGP(order.coupon_discount ?? 0, 'ar')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>الشحن:</span>
              <span className="font-display">{formatEGP(order.shipping_fee, 'ar')}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-extrabold">
              <span>الإجمالي كاش:</span>
              <span className="font-display">{formatEGP(order.total_cod, 'ar')}</span>
            </div>
          </div>
        </div>

        {nextStatuses.length > 0 && (
          <div className="space-y-3 rounded-sm border border-[#132238]/10 bg-[#FFFFFF] p-4">
            <p className="font-extrabold">تغيير حالة الطلب</p>
            {(nextStatuses.includes('cancelled') || nextStatuses.includes('returned')) && (
              <label className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={restock}
                  onChange={(e) => setRestock(e.target.checked)}
                  className="h-4 w-4 accent-[#132238]"
                />
                إرجاع القطع إلى المخزون عند الإلغاء أو الاسترجاع
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((st) => (
                <Button
                  key={st}
                  variant={st === 'cancelled' || st === 'returned' ? 'danger' : 'secondary'}
                  size="sm"
                  loading={updateStatus.isPending}
                  onClick={() => void handleTransition(st)}
                >
                  {ORDER_STATUS_META[st].labelAr}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-extrabold">ملاحظات داخلية (حفظ تلقائي)</label>
          <textarea
            rows={2}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            onBlur={handleNotesBlur}
            className="w-full rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] p-2.5 text-xs"
          />
        </div>

        {(order.order_status_history?.length ?? 0) > 0 && (
          <div className="space-y-1.5 text-xs">
            <p className="font-extrabold">سجل الحالات</p>
            {order.order_status_history?.map((h) => (
              <div key={h.id} className="flex justify-between text-[#132238]/75">
                <span>
                  {h.from_status ? `${h.from_status} → ` : ''}
                  {h.to_status}
                </span>
                <span className="font-display">{formatDate(h.created_at, 'ar')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
