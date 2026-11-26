import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import type { OrderStatus } from '@/shared/types/database';
import type { OrderRecord } from '@/shared/types/domain';
import { useAdminOrders } from '@/features/admin/api/useAdminOrders';
import { useAdminSettings } from '@/features/admin/api/useAdminSettings';
import { ORDER_STATUS_META } from '@/shared/constants/orderStatus';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { CopyForCourierButton } from '@/features/admin/components/CopyForCourierButton';
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
  const headers = ['Ref', 'Date', 'Customer', 'Phone', 'Governorate', 'Address', 'Items', 'Total COD', 'Status'];
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

export function OrdersPage() {
  useDocumentTitle('الطلبات - الإدارة');
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const ordersQuery = useAdminOrders('all');
  const settingsQuery = useAdminSettings();
  const allOrders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-[#132238]">إدارة الطلبات (تحديث مباشر)</h1>
        <Button variant="secondary" size="sm" onClick={() => exportCsv(filtered)}>
          <Download className="h-4 w-4" />
          <span>تصدير CSV (Excel)</span>
        </Button>
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
              className={`min-h-10 cursor-pointer rounded-xl px-3.5 text-xs font-extrabold transition-colors ${
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

      <div className="rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-4 shadow-xs">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الأوردر (WNT-...) أو الاسم أو الموبايل..."
          className="min-h-10 w-full max-w-md rounded-xl border border-[#132238]/20 bg-[#F4F2EC] px-3.5 text-sm"
        />
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((o) => (
          <div
            key={o.id}
            onClick={() => setSelectedOrderId(o.id)}
            className="cursor-pointer space-y-2.5 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-4 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-black">{o.order_ref}</span>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-sm font-bold">{o.customer_name}</div>
            <div className="flex items-center justify-between text-xs text-[#132238]/75">
              <span className="font-display" dir="ltr">
                {o.phone}
              </span>
              <span>{o.governorate_name}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#132238]/10 pt-2.5">
              <span className="font-display text-base font-black">
                {formatEGP(o.total_cod, 'ar')}
              </span>
              <CopyForCourierButton
                order={o}
                template={settingsQuery.data?.courier_template}
              />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-[#FFFFFF] p-6 text-center text-sm text-[#132238]/70">
            لا توجد طلبات مطابقة للبحث
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] shadow-xs md:block">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-[#132238]/12 bg-[#ECE9E0] text-xs font-extrabold">
            <tr>
              <th className="p-3">المرجع</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">العميل</th>
              <th className="p-3">الموبايل</th>
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
                <td className="p-3 font-display text-xs" dir="ltr">
                  {o.phone}
                </td>
                <td className="p-3 text-xs">{o.governorate_name}</td>
                <td className="p-3 font-display font-extrabold">{formatEGP(o.total_cod, 'ar')}</td>
                <td className="p-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="p-3">
                  <CopyForCourierButton
                    order={o}
                    template={settingsQuery.data?.courier_template}
                  />
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
        courierTemplate={settingsQuery.data?.courier_template}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
