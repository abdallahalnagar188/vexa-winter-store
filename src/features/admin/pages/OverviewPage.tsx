import { Link } from 'react-router-dom';
import { AlertTriangle, Banknote, Package, ShoppingCart } from 'lucide-react';
import { useAdminOrders } from '@/features/admin/api/useAdminOrders';
import { useAdminProducts } from '@/features/admin/api/useAdminProducts';
import { useAdminSettings } from '@/features/admin/api/useAdminSettings';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { formatDate, formatEGP } from '@/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Skeleton } from '@/shared/components/ui/Skeleton';

export function OverviewPage() {
  useDocumentTitle('نظرة عامة - الإدارة');
  const ordersQuery = useAdminOrders('all');
  const productsQuery = useAdminProducts(false);
  const settingsQuery = useAdminSettings();

  const orders = ordersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const lowThreshold = settingsQuery.data?.low_stock_threshold ?? 3;

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const todaysOrders = orders.filter((o) => o.created_at.slice(0, 10) === todayStr);
  const todaysRevenue = todaysOrders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'returned')
    .reduce((acc, o) => acc + o.total_cod, 0);
  const weekOrdersCount = orders.filter((o) => new Date(o.created_at).getTime() >= weekAgo).length;

  const lowStockVariants = products.flatMap((p) =>
    p.product_variants
      .filter((v) => v.is_active && v.stock <= lowThreshold)
      .map((v) => ({ product: p, variant: v })),
  );

  if (ordersQuery.isLoading || productsQuery.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#132238]">نظرة عامة</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-[#132238] p-5 text-[#F4F2EC] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FF6B1A]">طلبات جديدة تحتاج تأكيد</span>
            <ShoppingCart className="h-5 w-5 text-[#FF6B1A]" />
          </div>
          <p className="mt-3 font-display text-3xl font-black">{newOrdersCount}</p>
        </div>

        <div className="rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-5 text-[#132238] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">طلبات اليوم</span>
            <Package className="h-5 w-5" />
          </div>
          <p className="mt-3 font-display text-3xl font-black">{todaysOrders.length}</p>
        </div>

        <div className="rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-5 text-[#132238] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">مبيعات اليوم (كاش)</span>
            <Banknote className="h-5 w-5" />
          </div>
          <p className="mt-3 font-display text-2xl font-black">{formatEGP(todaysRevenue, 'ar')}</p>
        </div>

        <div className="rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-5 text-[#132238] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">طلبات آخر 7 أيام</span>
            <ShoppingCart className="h-5 w-5" />
          </div>
          <p className="mt-3 font-display text-3xl font-black">{weekOrdersCount}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold">أحدث 10 طلبات</h2>
            <Link to="/admin/orders" className="text-xs font-bold text-[#FF6B1A] underline">
              عرض الكل
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-[#132238]/12 text-xs font-extrabold">
                  <th className="py-2">المرجع</th>
                  <th className="py-2">العميل</th>
                  <th className="py-2">المحافظة</th>
                  <th className="py-2">الإجمالي</th>
                  <th className="py-2">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132238]/10">
                {orders.slice(0, 10).map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5 font-display font-bold">{o.order_ref}</td>
                    <td className="py-2.5">{o.customer_name}</td>
                    <td className="py-2.5 text-xs">{o.governorate_name}</td>
                    <td className="py-2.5 font-display font-bold">{formatEGP(o.total_cod, 'ar')}</td>
                    <td className="py-2.5">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-[#132238]/65">
                      لا توجد طلبات حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs lg:col-span-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#FF6B1A]" />
            <h2 className="text-base font-extrabold">تنبيهات المخزون المنخفض (≤ {lowThreshold})</h2>
          </div>
          <div className="space-y-2.5">
            {lowStockVariants.slice(0, 12).map(({ product, variant }) => (
              <Link
                key={variant.id}
                to={`/admin/products/${product.id}`}
                className="flex items-center justify-between rounded-xl bg-[#ECE9E0] px-3 py-2 text-xs font-bold hover:bg-[#FF6B1A]/15"
              >
                <span>
                  {product.title_ar} ({variant.size} / {variant.color_name})
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-display ${
                    variant.stock === 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {variant.stock === 0 ? 'نفد' : variant.stock}
                </span>
              </Link>
            ))}
            {lowStockVariants.length === 0 && (
              <p className="text-xs text-[#132238]/70">كل المقاسات متوفرة بمخزون جيد.</p>
            )}
          </div>
          <p className="mt-4 text-[11px] text-[#132238]/60">
            آخر تحديث: {formatDate(new Date().toISOString(), 'ar')}
          </p>
        </div>
      </div>
    </div>
  );
}
