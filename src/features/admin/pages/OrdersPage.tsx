import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Download, Plus, Printer } from 'lucide-react';
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
      <span className="mt-1 inline-flex items-center gap-1 rounded-[2px] border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-950">
        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-700" />
        <span>
          تنبيه: {stat.returned_count} مرتجع / {stat.cancelled_count} ملغي
        </span>
      </span>
    );
  }
  if (stat.delivered_count >= 2 && stat.returned_count === 0) {
    return (
      <span className="mt-1 inline-flex items-center gap-1 rounded-[2px] border border-[#1F7A4D]/30 bg-[#1F7A4D]/10 px-1.5 py-0.5 text-[10px] font-extrabold text-[#1F7A4D]">
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-[#132238]">إدارة الطلبات (تحديث مباشر)</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setManualOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>إضافة أوردر يدوي</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportCsv(filtered)}>
            <Download className="h-4 w-4" />
            <span>تصدير CSV (Excel)</span>
          </Button>
        </div>
      </div>

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
              className={`min-h-10 cursor-pointer rounded-[2px] px-3.5 text-xs font-extrabold transition-colors ${
                active
                  ? 'bg-[#FF6B1A] text-white shadow-xs'
                  : 'border border-[#132238]/12 bg-[#FFFFFF] text-[#132238] hover:bg-[#132238] hover:text-[#F4F2EC]'
              }`}
            >
              {tab === 'all' ? 'الكل' : ORDER_STATUS_META[tab].labelAr} ({count})
            </button>
          );
        })}
      </div>

      <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 shadow-xs">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الأوردر (WNT-...) أو الاسم أو الموبايل..."
          className="min-h-10 w-full max-w-md rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] px-3.5 text-sm"
        />
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((o) => (
          <div
            key={o.id}
            onClick={() => setSelectedOrderId(o.id)}
            className="cursor-pointer space-y-2.5 rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-black">{o.order_ref}</span>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-sm font-bold">{o.customer_name}</div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#132238]/75">
              <div>
                <span className="block font-display" dir="ltr">
                  {o.phone}
                </span>
                <CustomerRiskBadge stat={riskMap[o.phone]} />
              </div>
              <span>{o.governorate_name}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#132238]/10 pt-2.5">
              <span className="font-display text-base font-black">
                {formatEGP(o.total_cod, 'ar')}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="طباعة البوليصة"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrintOrderId(o.id);
                  }}
                >
                  <Printer className="h-3.5 w-3.5" />
                </Button>
                <CopyForCourierButton
                  order={o}
                  template={settingsQuery.data?.courier_template}
                />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-sm bg-[#FFFFFF] p-6 text-center text-sm text-[#132238]/70">
            لا توجد طلبات مطابقة للبحث
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-sm border border-[#132238]/12 bg-[#FFFFFF] shadow-xs md:block">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-[#132238]/12 bg-[#ECE9E0] text-xs font-extrabold">
            <tr>
              <th className="p-3">المرجع</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">العميل</th>
              <th className="p-3">الموبايل والموثوقية</th>
              <th className="p-3">المحافظة</th>
              <th className="p-3">الإجمالي</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#132238]/10">
            {filtered.map((o) => (
              <tr
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className="cursor-pointer transition-colors hover:bg-[#F4F2EC]"
              >
                <td className="p-3 font-display font-extrabold">{o.order_ref}</td>
                <td className="p-3 text-xs">{formatDate(o.created_at, 'ar')}</td>
                <td className="p-3 font-bold">{o.customer_name}</td>
                <td className="p-3 text-xs">
                  <span className="block font-display" dir="ltr">
                    {o.phone}
                  </span>
                  <CustomerRiskBadge stat={riskMap[o.phone]} />
                </td>
                <td className="p-3 text-xs">{o.governorate_name}</td>
                <td className="p-3 font-display font-extrabold">{formatEGP(o.total_cod, 'ar')}</td>
                <td className="p-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title="طباعة البوليصة"
                      aria-label="طباعة البوليصة"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrintOrderId(o.id);
                      }}
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    <CopyForCourierButton
                      order={o}
                      template={settingsQuery.data?.courier_template}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm text-[#132238]/65">
                  لا توجد طلبات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
