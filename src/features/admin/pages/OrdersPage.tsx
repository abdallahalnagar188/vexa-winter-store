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
    return cols.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',');
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
        <h1 className="text-2xl font-extrabold text-[#124E3B]">إدارة الطلبات (تحديث مباشر)</h1>
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
              className={`min-h-10 rounded-xl px-3.5 text-xs font-extrabold transition-colors ${
                active
                  ? 'bg-[#124E3B] text-[#FFD60A]'
                  : 'bg-[#E8E3D5] text-[#124E3B] hover:bg-[#FFD60A]/40'
              }`}
            >
              {tab === 'all' ? 'الكل' : ORDER_STATUS_META[tab].labelAr} ({count})
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-[#E8E3D5] p-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الأوردر (WNT-...) أو الاسم أو الموبايل..."
          className="min-h-10 w-full max-w-md rounded-xl border border-[#124E3B]/20 bg-[#F2EFE6] px-3.5 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-[#E8E3D5] shadow-sm">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-[#124E3B]/15 text-xs font-extrabold">
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
          <tbody className="divide-y divide-[#124E3B]/10">
            {filtered.map((o) => (
              <tr
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className="cursor-pointer transition-colors hover:bg-[#F2EFE6]"
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
                <td colSpan={8} className="p-8 text-center text-sm text-[#124E3B]/65">
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
