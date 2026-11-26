import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Edit3, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminProducts,
  useDeleteUnusedProduct,
  useToggleArchiveProduct,
} from '@/features/admin/api/useAdminProducts';
import { supabase } from '@/lib/supabase';
import { formatEGP } from '@/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';

export function ProductsPage() {
  useDocumentTitle('المنتجات - الإدارة');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const productsQuery = useAdminProducts(showArchived);
  const toggleArchive = useToggleArchiveProduct();
  const deleteUnused = useDeleteUnusedProduct();

  const products = (productsQuery.data ?? []).filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title_ar.toLowerCase().includes(q) ||
      (p.title_en ?? '').toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  });

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void productsQuery.refetch();
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-[#132238]">المنتجات والمخزون</h1>
        <Link to="/admin/products/new">
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            <span>إضافة منتج جديد</span>
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-4 shadow-xs">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الرابط..."
          className="min-h-10 w-full max-w-sm rounded-xl border border-[#132238]/20 bg-[#F4F2EC] px-3 text-sm"
        />
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 accent-[#132238]"
          />
          عرض المنتجات المؤرشفة
        </label>
      </div>

      <div className="space-y-3 md:hidden">
        {products.map((p) => {
          const totalStock = p.product_variants.reduce((acc, v) => acc + v.stock, 0);
          return (
            <div
              key={p.id}
              className={`space-y-3 rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] p-4 shadow-xs ${
                p.is_archived ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.product_images[0]?.url ?? ''}
                  alt=""
                  className="h-16 w-12 shrink-0 rounded-xl bg-[#ECE9E0] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{p.title_ar}</p>
                  <p className="text-xs text-[#132238]/70">
                    {p.category?.name_ar ?? '—'} • المخزون: {totalStock}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-display text-sm font-extrabold">
                      {formatEGP(p.base_price, 'ar')}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(p.id, p.is_active)}
                    >
                      <Badge variant={p.is_active ? 'accent' : 'muted'}>
                        {p.is_active ? 'نشط' : 'مخفي'}
                      </Badge>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-[#132238]/10 pt-2.5">
                <Link to={`/admin/products/${p.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>تعديل</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void toggleArchive.mutateAsync({ id: p.id, is_archived: !p.is_archived })
                  }
                >
                  {p.is_archived ? (
                    <RotateCcw className="h-3.5 w-3.5" />
                  ) : (
                    <Archive className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(p.id, p.title_ar)}
                  className="text-rose-700 hover:bg-rose-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-[#132238]/12 bg-[#FFFFFF] shadow-xs md:block">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-[#132238]/12 bg-[#ECE9E0] text-xs font-extrabold">
            <tr>
              <th className="p-3">المنتج</th>
              <th className="p-3">القسم</th>
              <th className="p-3">السعر</th>
              <th className="p-3">إجمالي المخزون</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#132238]/10">
            {products.map((p) => {
              const totalStock = p.product_variants.reduce((acc, v) => acc + v.stock, 0);
              return (
                <tr key={p.id} className={p.is_archived ? 'opacity-60' : ''}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.product_images[0]?.url ?? ''}
                        alt=""
                        className="h-12 w-10 rounded-lg bg-[#ECE9E0] object-cover"
                      />
                      <div>
                        <p className="font-extrabold">{p.title_ar}</p>
                        <p className="font-display text-xs text-[#132238]/65">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs font-bold">{p.category?.name_ar ?? '—'}</td>
                  <td className="p-3 font-display font-extrabold">{formatEGP(p.base_price, 'ar')}</td>
                  <td className="p-3 font-display font-bold">{totalStock}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(p.id, p.is_active)}
                    >
                      <Badge variant={p.is_active ? 'accent' : 'muted'}>
                        {p.is_active ? 'نشط' : 'مخفي'}
                      </Badge>
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/admin/products/${p.id}`}>
                        <Button variant="secondary" size="sm">
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>تعديل</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void toggleArchive.mutateAsync({
                            id: p.id,
                            is_archived: !p.is_archived,
                          })
                        }
                      >
                        {p.is_archived ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(p.id, p.title_ar)}
                        className="text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
