import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Eye,
  MapPin,
  Package,
  Plus,
  Printer,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useDashboardAnalytics,
  type DateRangePreset,
} from '@/features/admin/api/useAdminAnalytics';
import { useAdminOrders, useCustomerRiskStats } from '@/features/admin/api/useAdminOrders';
import { useAdminProducts } from '@/features/admin/api/useAdminProducts';
import { useAdminSettings } from '@/features/admin/api/useAdminSettings';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { CopyForCourierButton } from '@/features/admin/components/CopyForCourierButton';
import { ManualOrderDrawer } from '@/features/admin/components/ManualOrderDrawer';
import { WaybillPrintModal } from '@/features/admin/components/WaybillPrintModal';
import { SalesTrendChart } from '@/features/admin/components/SalesTrendChart';
import { OrderDetailDrawer } from '@/features/admin/pages/OrderDetailDrawer';
import { formatDate, formatEGP } from '@/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/components/ui/cn';

const RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'اليوم' },
  { value: '7d', label: 'آخر 7 أيام' },
  { value: '30d', label: 'آخر 30 يوم' },
  { value: 'month', label: 'هذا الشهر' },
];

export function OverviewPage() {
  useDocumentTitle('مركز القيادة - الإدارة');
  const navigate = useNavigate();

  const [range, setRange] = useState<DateRangePreset>('7d');
  const [productTab, setProductTab] = useState<'sold' | 'viewed'>('sold');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);

  const analyticsQuery = useDashboardAnalytics(range);
  const ordersQuery = useAdminOrders('all');
  const productsQuery = useAdminProducts(false);
  const settingsQuery = useAdminSettings();

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const lowThreshold = settingsQuery.data?.low_stock_threshold ?? 3;
  const analytics = analyticsQuery.data;

  const recentOrders = useMemo(() => orders.slice(0, 10), [orders]);
  const phonesList = useMemo(() => recentOrders.map((o) => o.phone), [recentOrders]);
  const riskQuery = useCustomerRiskStats(phonesList);
  const riskMap = riskQuery.data ?? {};

  const lowStockVariants = useMemo(
    () =>
      products.flatMap((p) =>
        p.product_variants
          .filter((v) => v.is_active && v.stock <= lowThreshold)
          .map((v) => ({ product: p, variant: v })),
      ),
    [products, lowThreshold],
  );

  const liveNewOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'new').length,
    [orders],
  );

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;
  const printOrder = orders.find((o) => o.id === printOrderId) ?? null;

  const pipeline = analytics?.pipeline;
  const maxGovOrders = Math.max(
    1,
    ...(analytics?.top_governorates.map((g) => g.orders_count) ?? [1]),
  );

  return (
    <div className="space-y-6">
      {/* Header Controls: Title + Date Range Filter + Quick Actions */}
      <div className="flex flex-col gap-4 border-b border-[#132238]/12 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#132238]">مركز قيادة المتجر (COD Command Center)</h1>
          <p className="mt-0.5 text-xs font-semibold text-[#132238]/70">
            متابعة التحصيل النقدي، مسار الطلبات، الزيارات ومعدل التحويل لحظياً
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Segmented Bar */}
          <div className="flex rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] p-0.5 text-xs font-extrabold">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className={cn(
                  'cursor-pointer rounded-[2px] px-3 py-1.5 transition-colors',
                  range === opt.value
                    ? 'bg-[#132238] text-[#F4F2EC]'
                    : 'text-[#132238] hover:bg-[#132238]/5',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" size="sm" onClick={() => setManualOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>أوردر يدوي</span>
        </Button>
        <Link to="/admin/products/new">
          <Button type="button" variant="secondary" size="sm">
            <Plus className="h-4 w-4" />
            <span>منتج جديد</span>
          </Button>
        </Link>
        <Link to="/admin/orders?status=new">
          <Button type="button" variant="outline" size="sm">
            <ShoppingCart className="h-3.5 w-3.5 text-[#FF6B1A]" />
            <span>طلبات تحتاج تأكيد ({liveNewOrdersCount})</span>
          </Button>
        </Link>
        <Link to="/admin/discounts">
          <Button type="button" variant="outline" size="sm">
            <span>أكواد الخصم</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* 6 COD Financial & Conversion KPI Cards */}
      {analyticsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. Pending New Orders Alert Card */}
          <Link
            to="/admin/orders?status=new"
            className="flex flex-col justify-between rounded-sm bg-[#132238] p-4 text-[#F4F2EC] shadow-md transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#FF6B1A]">تحتاج تأكيد الآن</span>
              <ShoppingCart className="h-4 w-4 shrink-0 text-[#FF6B1A]" />
            </div>
            <div className="mt-3">
              <p className="font-display text-3xl font-black">{liveNewOrdersCount}</p>
              <p className="mt-1 text-[11px] text-[#F4F2EC]/70">
                في الفترة: {analytics?.pipeline.new ?? 0} طلب جديد
              </p>
            </div>
          </Link>

          {/* 2. Collected COD Revenue (Delivered) */}
          <div className="flex flex-col justify-between rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 text-[#132238] shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#132238]/75">المبيعات المحصّلة</span>
              <Banknote className="h-4 w-4 shrink-0 text-[#1F7A4D]" />
            </div>
            <div className="mt-3">
              <p className="font-display text-xl font-black text-[#1F7A4D]">
                {formatEGP(analytics?.delivered_revenue ?? 0, 'ar')}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#132238]/65">
                {analytics?.pipeline.delivered ?? 0} طلب مسلّم فعلياً
              </p>
            </div>
          </div>

          {/* 3. Pending Cash with Couriers */}
          <div className="flex flex-col justify-between rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 text-[#132238] shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#132238]/75">مبالغ مع الشحن</span>
              <Truck className="h-4 w-4 shrink-0 text-[#FF6B1A]" />
            </div>
            <div className="mt-3">
              <p className="font-display text-xl font-black">
                {formatEGP(analytics?.shipping_pending_cod ?? 0, 'ar')}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#132238]/65">
                {analytics?.pipeline.sent_to_shipping ?? 0} شحنة قيد التحصيل
              </p>
            </div>
          </div>

          {/* 4. Delivery vs Return Rate */}
          <div className="flex flex-col justify-between rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 text-[#132238] shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#132238]/75">التسليم vs المرتجع</span>
              <TrendingUp className="h-4 w-4 shrink-0 text-[#132238]" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2 font-display">
                <span className="text-xl font-black text-[#1F7A4D]">
                  {analytics?.delivery_rate_pct ?? 0}%
                </span>
                <span className="text-xs font-bold text-[#132238]/40">/</span>
                <span className="text-sm font-black text-rose-700">
                  {analytics?.return_rate_pct ?? 0}%
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#132238]/65">
                مرتجع: {analytics?.pipeline.returned ?? 0} · ملغي: {analytics?.pipeline.cancelled ?? 0}
              </p>
            </div>
          </div>

          {/* 5. Average Order Value (AOV) */}
          <div className="flex flex-col justify-between rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 text-[#132238] shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#132238]/75">متوسط قيمة الأوردر</span>
              <Package className="h-4 w-4 shrink-0 text-[#132238]" />
            </div>
            <div className="mt-3">
              <p className="font-display text-xl font-black">
                {formatEGP(analytics?.aov ?? 0, 'ar')}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#132238]/65">
                من {analytics?.valid_orders_count ?? 0} طلب نشط/مكتمل
              </p>
            </div>
          </div>

          {/* 6. Visits & Conversion Rate */}
          <div className="flex flex-col justify-between rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 text-[#132238] shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#132238]/75">الزيارات والتحويل</span>
              <Users className="h-4 w-4 shrink-0 text-[#FF6B1A]" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2 font-display">
                <span className="text-xl font-black">{analytics?.unique_visits ?? 0}</span>
                <span className="rounded-[2px] border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 text-[11px] font-black text-orange-600">
                  {analytics?.conversion_rate_pct ?? 0}% تحويل
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#132238]/65">
                {analytics?.product_views ?? 0} مشاهدة · {analytics?.add_to_cart_count ?? 0} للسلة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive 5-Stage Order Pipeline Strip */}
      <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black text-[#132238]">مسار الطلبات (Order Pipeline)</h2>
          <span className="text-[11px] font-semibold text-[#132238]/60">
            اضغط على أي مرحلة لعرض طلباتها مباشرة
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {[
            {
              status: 'new',
              label: 'جديد',
              count: pipeline?.new ?? 0,
              accent: 'border-[#FF6B1A]/40 bg-[#FF6B1A]/10 text-[#132238]',
            },
            {
              status: 'confirmed',
              label: 'تم التأكيد',
              count: pipeline?.confirmed ?? 0,
              accent: 'border-[#132238]/20 bg-[#F4F2EC] text-[#132238]',
            },
            {
              status: 'sent_to_shipping',
              label: 'مع الشحن',
              count: pipeline?.sent_to_shipping ?? 0,
              accent: 'border-sky-300 bg-sky-50 text-sky-950',
            },
            {
              status: 'delivered',
              label: 'تم التسليم',
              count: pipeline?.delivered ?? 0,
              accent: 'border-[#1F7A4D]/30 bg-[#1F7A4D]/10 text-[#1F7A4D]',
            },
            {
              status: 'returned',
              label: 'مرتجع / ملغي',
              count: (pipeline?.returned ?? 0) + (pipeline?.cancelled ?? 0),
              sub: `${pipeline?.returned ?? 0} مرتجع · ${pipeline?.cancelled ?? 0} ملغي`,
              accent: 'border-rose-300 bg-rose-50 text-rose-900',
            },
          ].map((stage) => (
            <button
              key={stage.status}
              type="button"
              onClick={() => navigate(`/admin/orders?status=${stage.status}`)}
              className={cn(
                'flex cursor-pointer flex-col items-start justify-between rounded-[2px] border p-3 text-start transition-transform hover:-translate-y-0.5',
                stage.accent,
              )}
            >
              <span className="text-xs font-extrabold">{stage.label}</span>
              <span className="mt-1 font-display text-2xl font-black">{stage.count}</span>
              {stage.sub && <span className="mt-0.5 text-[10px] font-bold opacity-80">{stage.sub}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Sales & Orders Chart + Top Insights Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Daily Revenue & Orders Chart */}
        <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#132238]">تطور المبيعات والطلبات اليومي</h2>
            <span className="font-display text-xs font-bold text-[#132238]/65">
              {analytics?.orders_count ?? 0} طلب إجمالي
            </span>
          </div>
          {analyticsQuery.isLoading ? (
            <Skeleton className="h-56 w-full rounded-[2px]" />
          ) : (
            <SalesTrendChart series={analytics?.series ?? []} />
          )}
        </div>

        {/* Top Insights Column: Top Selling/Viewed Products + Top Governorates */}
        <div className="space-y-6 lg:col-span-5">
          {/* Top Products (Selling & Viewed Tabs) */}
          <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black text-[#132238]">أفضل المنتجات في الفترة</h2>
              <div className="flex rounded-[2px] border border-[#132238]/15 bg-[#F4F2EC] p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setProductTab('sold')}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1 rounded-[2px] px-2 py-1',
                    productTab === 'sold' ? 'bg-[#132238] text-white' : 'text-[#132238]',
                  )}
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>الأكثر مبيعاً</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductTab('viewed')}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1 rounded-[2px] px-2 py-1',
                    productTab === 'viewed' ? 'bg-[#FF6B1A] text-white' : 'text-[#132238]',
                  )}
                >
                  <Eye className="h-3 w-3" />
                  <span>الأكثر مشاهدة</span>
                </button>
              </div>
            </div>

            {productTab === 'sold' ? (
              <div className="space-y-2">
                {(analytics?.top_selling_products ?? []).map((item, i) => (
                  <div
                    key={`${item.product_id ?? i}-${item.size}`}
                    className="flex items-center justify-between gap-2 rounded-[2px] bg-[#F4F2EC]/80 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold text-[#132238]">{item.title_ar}</p>
                      <span className="font-display text-[11px] font-bold text-[#132238]/65">
                        مقاس {item.size} · {formatEGP(item.revenue, 'ar')}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-[2px] bg-[#132238] px-2 py-0.5 font-display text-xs font-black text-[#F4F2EC]">
                      {item.units_sold} قطعة
                    </span>
                  </div>
                ))}
                {(analytics?.top_selling_products.length ?? 0) === 0 && (
                  <p className="py-4 text-center text-xs text-[#132238]/60">
                    لا توجد مبيعات مسجلة في هذه الفترة.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {(analytics?.top_viewed_products ?? []).map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between gap-2 rounded-[2px] bg-[#F4F2EC]/80 px-3 py-2 text-xs"
                  >
                    <p className="min-w-0 flex-1 truncate font-extrabold text-[#132238]">
                      {item.title_ar}
                    </p>
                    <span className="shrink-0 rounded-[2px] border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 font-display text-xs font-black text-orange-600">
                      {item.views} مشاهدة
                    </span>
                  </div>
                ))}
                {(analytics?.top_viewed_products.length ?? 0) === 0 && (
                  <p className="py-4 text-center text-xs text-[#132238]/60">
                    لا توجد مشاهدات مسجلة بعد.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Top 5 Governorates */}
          <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#FF6B1A]" />
              <h2 className="text-sm font-black text-[#132238]">أعلى المحافظات طلباً</h2>
            </div>
            <div className="space-y-2.5">
              {(analytics?.top_governorates ?? []).map((gov) => {
                const pct = Math.round((gov.orders_count / maxGovOrders) * 100);
                return (
                  <div key={gov.governorate_name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>{gov.governorate_name}</span>
                      <span className="font-display text-[#132238]/80">
                        {gov.orders_count} طلب ({formatEGP(gov.revenue, 'ar')})
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#ECE9E0]">
                      <div
                        className="h-full bg-[#FF6B1A]"
                        style={{ width: `${Math.max(6, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(analytics?.top_governorates.length ?? 0) === 0 && (
                <p className="py-3 text-center text-xs text-[#132238]/60">
                  لا توجد طلبات في هذه الفترة.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent 10 Orders (Interactive) + Low Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold">أحدث 10 طلبات (اضغط لفتح التفاصيل)</h2>
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
                  <th className="py-2 text-end">إجراء سريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132238]/10">
                {recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className="cursor-pointer transition-colors hover:bg-[#F4F2EC]"
                  >
                    <td className="py-2.5 font-display font-bold">{o.order_ref}</td>
                    <td className="py-2.5 font-semibold">{o.customer_name}</td>
                    <td className="py-2.5 text-xs">{o.governorate_name}</td>
                    <td className="py-2.5 font-display font-bold">{formatEGP(o.total_cod, 'ar')}</td>
                    <td className="py-2.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1">
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
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-[#132238]/65">
                      لا توجد طلبات حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-5 shadow-xs lg:col-span-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#FF6B1A]" />
            <h2 className="text-base font-extrabold">تنبيهات المخزون المنخفض (≤ {lowThreshold})</h2>
          </div>
          <div className="space-y-2.5">
            {lowStockVariants.slice(0, 12).map(({ product, variant }) => (
              <Link
                key={variant.id}
                to={`/admin/products/${product.id}`}
                className="flex items-center justify-between rounded-[2px] bg-[#ECE9E0] px-3 py-2 text-xs font-bold hover:bg-[#FF6B1A]/15"
              >
                <span>
                  {product.title_ar} ({variant.size} / {variant.color_name})
                </span>
                <span
                  className={`rounded-[2px] px-2 py-0.5 font-display ${
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

      {/* Drawers & Print Modal accessible directly from Overview */}
      <OrderDetailDrawer
        order={selectedOrder}
        allOrders={orders}
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
