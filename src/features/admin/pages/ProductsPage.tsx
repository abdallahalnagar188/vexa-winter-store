import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  Edit3,
  ExternalLink,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminProducts,
  useDeleteUnusedProduct,
  useToggleArchiveProduct,
} from '@/features/admin/api/useAdminProducts';
import { useAdminSettings } from '@/features/admin/api/useAdminSettings';
import { useCategories } from '@/features/storefront/api/useCategories';
import { supabase } from '@/lib/supabase';
import { formatEGP } from '@/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/components/ui/cn';

export function ProductsPage() {
  useDocumentTitle('المنتجات - الإدارة');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showArchived, setShowArchived] = useState(false);

  const productsQuery = useAdminProducts(showArchived);
  const categoriesQuery = useCategories();
  const settingsQuery = useAdminSettings();
  const toggleArchive = useToggleArchiveProduct();
  const deleteUnused = useDeleteUnusedProduct();

  const lowThreshold = settingsQuery.data?.low_stock_threshold ?? 3;
  const categories = categoriesQuery.data ?? [];

  const products = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (productsQuery.data ?? []).filter((p) => {
      if (selectedCategory !== 'all' && p.category?.slug !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        p.title_ar.toLowerCase().includes(q) ||
        (p.title_en ?? '').toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    });
  }, [productsQuery.data, search, selectedCategory]);

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(current ? 'تم إخفاء المنتج من المتجر' : 'تم تفعيل المنتج في المتجر');
    void productsQuery.refetch();
  };

  const handleToggleArchive = async (id: string, currentArchived: boolean) => {
    try {
      await toggleArchive.mutateAsync({ id, is_archived: !currentArchived });
      toast.success(currentArchived ? 'تمت استعادة المنتج من الأرشيف' : 'تمت أرشفة المنتج');
    } catch (err) {
      toast.error((err as Error).message || 'تعذر تحديث حالة الأرشفة');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`حذف "${title}" نهائياً؟ (يعمل فقط إذا لم يكن له طلبات سابقة)`)) return;
    try {
      await deleteUnused.mutateAsync(id);
      toast.success('تم حذف المنتج بنجاح');
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('HAS_ORDERS')) {
        toast.error('هذا المنتج مرتبط بطلبات سابقة. يمكنك أرشفته بدلاً من حذفه.');
      } else {
        toast.error(msg || 'تعذر حذف المنتج');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#132238]">المنتجات والمخزون</h1>
          <p className="mt-0.5 text-xs font-semibold text-[#132238]/65">
            إدارة الكتالوج، الأسعار، الكميات المتاحة، وحالة الظهور ({products.length} منتج)
          </p>
        </div>
        <Link to="/admin/products/new">
          <Button variant="primary" className="rounded-[2px]">
            <Plus className="h-4 w-4" />
            <span>إضافة منتج جديد</span>
          </Button>
        </Link>
      </div>

      {/* Single-Row Sharp Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs min-w-[200px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الرابط..."
              aria-label="بحث في المنتجات"
              className="h-10 w-full rounded-[2px] border border-slate-200 bg-[#F4F2EC]/50 pe-3 ps-9 text-sm font-medium text-[#0D1526] placeholder:text-slate-400 focus:border-[#0D1526] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="تصفية حسب القسم"
            className="h-10 rounded-[2px] border border-slate-200 bg-white px-3 text-xs font-bold text-[#0D1526] focus:border-[#0D1526] focus:outline-none"
          >
            <option value="all">كل الأقسام</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name_ar}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-[2px] border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-[#0D1526]">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 accent-[#0D1526]"
          />
          <span>عرض المنتجات المؤرشفة</span>
        </label>
      </div>

      {/* Loading / Empty */}
      {productsQuery.isLoading ? (
        <div className="space-y-3 rounded-sm border border-slate-200/80 bg-white p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[2px]" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-slate-200/80 bg-white p-12 text-center">
          <Package className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-[#0D1526]">لا توجد منتجات مطابقة للبحث</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (< md) */}
          <div className="space-y-3 md:hidden">
            {products.map((p) => {
              const totalStock = p.product_variants.reduce((acc, v) => acc + v.stock, 0);
              const isOut = totalStock === 0;
              const isLow = !isOut && totalStock <= lowThreshold;
              const activeBadge = p.is_active && !p.is_archived;

              return (
                <div
                  key={p.id}
                  className={cn(
                    'space-y-3 rounded-sm border border-slate-200/80 bg-white p-4 shadow-xs',
                    p.is_archived && 'opacity-70',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={p.product_images[0]?.url ?? ''}
                      alt={p.title_ar}
                      className="h-14 w-12 shrink-0 rounded-[2px] border border-slate-200 bg-[#F4F2EC] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-extrabold text-[#0D1526]">{p.title_ar}</p>
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(p.id, p.is_active)}
                          className={cn(
                            'shrink-0 cursor-pointer rounded-[2px] border px-2 py-0.5 text-[11px] font-semibold',
                            activeBadge
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-600',
                          )}
                        >
                          {p.is_archived ? 'مؤرشف' : p.is_active ? 'نشط' : 'مخفي'}
                        </button>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400" dir="ltr">
                        {p.slug}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-[2px] bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {p.category?.name_ar ?? 'بدون قسم'}
                        </span>
                        <span className="font-display font-bold tabular-nums text-[#0D1526]">
                          {formatEGP(p.base_price, 'ar')}
                        </span>
                        <span
                          className={cn(
                            'rounded-[2px] px-2 py-0.5 font-display font-semibold tabular-nums',
                            isOut
                              ? 'border border-red-200 bg-red-50 text-red-700'
                              : isLow
                                ? 'border border-amber-200 bg-amber-50 text-amber-800'
                                : 'text-slate-600',
                          )}
                        >
                          {totalStock} قطعة
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
                    <Link
                      to={`/admin/products/${p.id}`}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[2px] bg-[#0D1526] px-3 text-xs font-medium text-white transition-colors hover:bg-[#1E293B]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>تعديل</span>
                    </Link>

                    <a
                      href={`/product/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="عرض في المتجر"
                      aria-label="عرض في المتجر"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-400 hover:text-[#0D1526]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => void handleToggleArchive(p.id, p.is_archived)}
                      title={p.is_archived ? 'استعادة من الأرشيف' : 'أرشفة المنتج'}
                      aria-label={p.is_archived ? 'استعادة من الأرشيف' : 'أرشفة المنتج'}
                      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-slate-200 bg-white text-slate-600 transition-colors hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-600"
                    >
                      {p.is_archived ? (
                        <RotateCcw className="h-3.5 w-3.5" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(p.id, p.title_ar)}
                      title="حذف نهائياً"
                      aria-label="حذف نهائياً"
                      className="ms-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-red-200 bg-white text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden overflow-x-auto rounded-sm border border-slate-200/80 bg-white shadow-xs md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-extrabold text-[#0D1526]">
                <tr>
                  <th className="px-4 py-3.5 text-start">المنتج</th>
                  <th className="px-4 py-3.5 text-start">القسم</th>
                  <th className="px-4 py-3.5 text-start">السعر</th>
                  <th className="px-4 py-3.5 text-center">إجمالي المخزون</th>
                  <th className="px-4 py-3.5 text-center">الحالة</th>
                  <th className="px-4 py-3.5 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const totalStock = p.product_variants.reduce((acc, v) => acc + v.stock, 0);
                  const isOut = totalStock === 0;
                  const isLow = !isOut && totalStock <= lowThreshold;
                  const activeBadge = p.is_active && !p.is_archived;

                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'transition-colors hover:bg-slate-50/80',
                        p.is_archived && 'opacity-65',
                      )}
                    >
                      {/* Product (text-start) */}
                      <td className="px-4 py-4 text-start">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.product_images[0]?.url ?? ''}
                            alt={p.title_ar}
                            className="h-12 w-12 shrink-0 rounded-[2px] border border-slate-200 bg-[#F4F2EC] object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#0D1526]">{p.title_ar}</p>
                            <p className="truncate font-mono text-xs text-slate-400" dir="ltr">
                              {p.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category (text-start) */}
                      <td className="px-4 py-4 text-start">
                        <span className="inline-block rounded-[2px] bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {p.category?.name_ar ?? 'بدون قسم'}
                        </span>
                      </td>

                      {/* Price (text-start) */}
                      <td className="px-4 py-4 text-start font-display font-bold tabular-nums whitespace-nowrap text-[#0D1526]">
                        {formatEGP(p.base_price, 'ar')}
                      </td>

                      {/* Total Stock (text-center) */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={cn(
                            'inline-block rounded-[2px] px-2.5 py-0.5 font-display text-xs font-semibold tabular-nums whitespace-nowrap',
                            isOut
                              ? 'border border-red-200 bg-red-50 text-red-700'
                              : isLow
                                ? 'border border-amber-200 bg-amber-50 text-amber-800'
                                : 'text-[#0D1526]',
                          )}
                        >
                          {totalStock} قطعة
                        </span>
                      </td>

                      {/* Status (text-center) */}
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(p.id, p.is_active)}
                          title="تبديل الظهور في المتجر"
                          className={cn(
                            'inline-flex cursor-pointer items-center rounded-[2px] border px-2.5 py-0.5 text-xs font-semibold transition-colors',
                            activeBadge
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200',
                          )}
                        >
                          {p.is_archived ? 'مؤرشف' : p.is_active ? 'نشط' : 'مخفي'}
                        </button>
                      </td>

                      {/* Actions (text-end) */}
                      <td className="px-4 py-4 text-end">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            to={`/admin/products/${p.id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-[2px] bg-[#0D1526] px-3 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-[#1E293B]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>تعديل</span>
                          </Link>

                          <a
                            href={`/product/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="عرض في المتجر"
                            aria-label="عرض في المتجر"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-400 hover:text-[#0D1526]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => void handleToggleArchive(p.id, p.is_archived)}
                            title={p.is_archived ? 'استعادة من الأرشيف' : 'أرشفة المنتج'}
                            aria-label={p.is_archived ? 'استعادة من الأرشيف' : 'أرشفة المنتج'}
                            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-slate-200 bg-white text-slate-600 transition-colors hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-600"
                          >
                            {p.is_archived ? (
                              <RotateCcw className="h-3.5 w-3.5" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(p.id, p.title_ar)}
                            title="حذف نهائياً"
                            aria-label="حذف نهائياً"
                            className="ms-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-red-200 bg-white text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
