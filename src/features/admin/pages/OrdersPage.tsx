import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  Plus,
  Printer,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import type { OrderStatus } from '@/shared/types/database';
import type { CustomerRiskStat, OrderRecord } from '@/shared/types/domain';
import { useAdminOrders, useCustomerRiskStats } from '@/features/admin/api/useAdminOrders';
import { useAdminSettings } from '@/features/admin/api/useAdminSettings';
import { ORDER_STATUS_META } from '@/shared/constants/orderStatus';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { CopyForCourierButton } from '@/features/admin/components/CopyForCourierButton';
import { ManualOrderDrawer } from '@/features/admin/components/ManualOrderDrawer';
import { WaybillPrintModal } from '@/features/admin/components/WaybillPrintModal';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { formatDate, formatEGP } from '@/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/components/ui/cn';

const TABS: (OrderStatus | 'all')[] = [
  'all',
  'new',
  'confirmed',
  'sent_to_shipping',
  'delivered',
  'cancelled',
  'returned',
];

function sanitizeCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

function exportCsv(orders: OrderRecord[]) {
  const headers = [
    'Ref',
    'Date',
    'Customer',
    'Phone',
    'Governorate',
    'Address',
    'Items',
    'Coupon',
    'Total COD',
    'Status',
  ];
  const lines = orders.map((o) => {
    const itemsStr = (o.order_items ?? [])
      .map((i) => `${i.quantity}x ${i.product_title} (${i.size}/${i.color})`)
      .join(' | ');
    const cols = [
      o.order_ref,
      o.created_at,
      o.customer_name,
      o.phone,
      o.governorate_name,
      `${o.city_area} - ${o.address_details}`,
      itemsStr,
      o.coupon_code ?? '',
      String(o.total_cod),
      o.status,
    ];
    return cols.map(sanitizeCsvCell).join(',');
  });
  const csv = '\uFEFF' + [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vexa-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function CustomerRiskBadge({ stat }: { stat?: CustomerRiskStat }) {
  if (!stat) return null;
  if (stat.returned_count >= 1 || stat.cancelled_count >= 2) {
    return (
      <span className="mt-1 inline-flex items-center gap-1 rounded-[2px] border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-700" />
        <span>
          تنبيه: {stat.returned_count} مرتجع / {stat.cancelled_count} ملغي
        </span>
      </span>
    );
  }
  if (stat.delivered_count >= 2 && stat.returned_count === 0) {
    return (
      <span className="mt-1 inline-flex items-center gap-1 rounded-[2px] border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        <span>عميل متكرر ({stat.delivered_count} ناجح)</span>
      </span>
    );
  }
  return null;
}

export function OrdersPage() {
  useDocumentTitle('الطلبات - الإدارة');
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get('status') as OrderStatus | 'all' | null;
  const urlRef = searchParams.get('ref');
  const urlCreate = searchParams.get('create');

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>(
    urlStatus && TABS.includes(urlStatus) ? urlStatus : 'all',
  );
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(urlCreate === '1');
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);

  const ordersQuery = useAdminOrders('all');
  const settingsQuery = useAdminSettings();
  const allOrders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  useEffect(() => {
    if (urlStatus && TABS.includes(urlStatus)) {
      setActiveTab(urlStatus);
    }
  }, [urlStatus]);

  useEffect(() => {
    if (urlCreate === '1') {
      setManualOpen(true);
    }
  }, [urlCreate]);

  useEffect(() => {
    if (!urlRef || allOrders.length === 0) return;
    const match = allOrders.find((o) => o.order_ref.toUpperCase() === urlRef.toUpperCase());
    if (match) {
      setSelectedOrderId(match.id);
      const next = new URLSearchParams(searchParams);
      next.delete('ref');
      setSearchParams(next, { replace: true });
    }
  }, [urlRef, allOrders, searchParams, setSearchParams]);

  const phonesList = useMemo(() => allOrders.map((o) => o.phone), [allOrders]);
  const riskQuery = useCustomerRiskStats(phonesList);
  const riskMap = riskQuery.data ?? {};

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allOrders.filter((o) => {
      if (activeTab !== 'all' && o.status !== activeTab) return false;
      if (!q) return true;
      return (
        o.order_ref.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q)
      );
    });
  }, [allOrders, activeTab, search]);

  const selectedOrder = allOrders.find((o) => o.id === selectedOrderId) ?? null;
  const printOrder = allOrders.find((o) => o.id === printOrderId) ?? null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#132238]">إدارة الطلبات</h1>
          <p className="mt-0.5 text-xs font-semibold text-[#132238]/65">
            تحديث لحظي للطلبات، متابعة حالة التحصيل، وبوالص الشحن ({filtered.length} طلب)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setManualOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>إضافة أوردر يدوي</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportCsv(filtered)}>
            <Download className="h-4 w-4" />
            <span>تصدير CSV</span>
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count =
            tab === 'all' ? allOrders.length : allOrders.filter((o) => o.status === tab).length;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'h-9 cursor-pointer rounded-[2px] border px-3 text-xs font-bold transition-colors',
                active
                  ? 'border-[#0D1526] bg-[#0D1526] text-white'
                  : 'border-slate-200 bg-white text-[#0D1526] hover:border-slate-400 hover:bg-slate-50',
              )}
            >
              {tab === 'all' ? 'الكل' : ORDER_STATUS_META[tab].labelAr} ({count})
            </button>
          );
        })}
      </div>

      {/* Single-Row Sharp Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="relative w-full max-w-md min-w-[220px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث برقم الأوردر (WNT-...) أو الاسم أو الموبايل..."
            aria-label="بحث في الطلبات"
            className="h-10 w-full rounded-[2px] border border-slate-200 bg-[#F4F2EC]/50 pe-3 ps-9 text-sm font-medium text-[#0D1526] placeholder:text-slate-400 focus:border-[#0D1526] focus:bg-white focus:outline-none"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          عرض {filtered.length} من أصل {allOrders.length}
        </span>
      </div>

      {ordersQuery.isLoading ? (
        <div className="space-y-3 rounded-sm border border-slate-200/80 bg-white p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[2px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-slate-200/80 bg-white p-12 text-center">
          <ShoppingBag className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-[#0D1526]">لا توجد طلبات مطابقة للبحث</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (< md) */}
          <div className="space-y-3 md:hidden">
            {filtered.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className="cursor-pointer space-y-3 rounded-sm border border-slate-200/80 bg-white p-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-black text-[#0D1526]">
                    {o.order_ref}
                  </span>
                  <StatusBadge status={o.status} />
                </div>

                <div>
                  <p className="text-sm font-bold text-[#0D1526]">{o.customer_name}</p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div>
                      <span className="block font-display" dir="ltr">
                        {o.phone}
                      </span>
                      <CustomerRiskBadge stat={riskMap[o.phone]} />
                    </div>
                    <span className="rounded-[2px] bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                      {o.governorate_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-display text-sm font-bold tabular-nums text-[#0D1526]">
                    {formatEGP(o.total_cod, 'ar')}
                  </span>

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderId(o.id);
                      }}
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[2px] bg-[#0D1526] px-3 text-xs font-medium text-white transition-colors hover:bg-[#1E293B]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>التفاصيل</span>
                    </button>

                    <button
                      type="button"
                      title="طباعة البوليصة"
                      aria-label="طباعة البوليصة"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrintOrderId(o.id);
                      }}
                      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-400 hover:text-[#0D1526]"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>

                    <CopyForCourierButton
                      order={o}
                      template={settingsQuery.data?.courier_template}
                      iconOnly
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden overflow-x-auto rounded-sm border border-slate-200/80 bg-white shadow-xs md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-extrabold text-[#0D1526]">
                <tr>
                  <th className="px-4 py-3.5 text-start">المرجع</th>
                  <th className="px-4 py-3.5 text-start">التاريخ</th>
                  <th className="px-4 py-3.5 text-start">العميل والموبايل</th>
                  <th className="px-4 py-3.5 text-start">المحافظة</th>
                  <th className="px-4 py-3.5 text-start">الإجمالي</th>
                  <th className="px-4 py-3.5 text-center">الحالة</th>
                  <th className="px-4 py-3.5 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-4 text-start font-display font-bold whitespace-nowrap text-[#0D1526]">
                      {o.order_ref}
                    </td>

                    <td className="px-4 py-4 text-start text-xs whitespace-nowrap text-slate-600">
                      {formatDate(o.created_at, 'ar')}
                    </td>

                    <td className="px-4 py-4 text-start">
                      <p className="font-bold text-[#0D1526]">{o.customer_name}</p>
                      <p className="font-display text-xs text-slate-500" dir="ltr">
                        {o.phone}
                      </p>
                      <CustomerRiskBadge stat={riskMap[o.phone]} />
                    </td>

                    <td className="px-4 py-4 text-start">
                      <span className="inline-block rounded-[2px] bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {o.governorate_name}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-start font-display font-bold tabular-nums whitespace-nowrap text-[#0D1526]">
                      {formatEGP(o.total_cod, 'ar')}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <StatusBadge status={o.status} />
                    </td>

                    <td className="px-4 py-4 text-end">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(o.id);
                          }}
                          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[2px] bg-[#0D1526] px-3 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-[#1E293B]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>التفاصيل</span>
                        </button>

                        <button
                          type="button"
                          title="طباعة البوليصة"
                          aria-label="طباعة البوليصة"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintOrderId(o.id);
                          }}
                          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-400 hover:text-[#0D1526]"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>

                        <CopyForCourierButton
                          order={o}
                          template={settingsQuery.data?.courier_template}
                          iconOnly
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <OrderDetailDrawer
        order={selectedOrder}
        allOrders={allOrders}
        riskStat={selectedOrder ? riskMap[selectedOrder.phone] : undefined}
        courierTemplate={settingsQuery.data?.courier_template}
        onPrintWaybill={(ord) => setPrintOrderId(ord.id)}
        onClose={() => setSelectedOrderId(null)}
      />

      <ManualOrderDrawer
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onCreated={(orderId, orderRef) => {
          setSelectedOrderId(orderId);
          toast.success(`تم إنشاء الأوردر ${orderRef} بنجاح`, {
            action: {
              label: 'طباعة البوليصة',
              onClick: () => setPrintOrderId(orderId),
            },
          });
        }}
      />

      <WaybillPrintModal
        order={printOrder}
        whatsappNumber={settingsQuery.data?.whatsapp_number}
        onClose={() => setPrintOrderId(null)}
      />
    </div>
  );
}
