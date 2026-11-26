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
        <h1 className="text-2xl font-extrabold text-[#124E3B]">المنتجات والمخزون</h1>
        <Link to="/admin/products/new">
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            <span>إضافة منتج جديد</span>
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#E8E3D5] p-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الرابط..."
          className="min-h-10 w-full max-w-sm rounded-xl border border-[#124E3B]/20 bg-[#F2EFE6] px-3 text-sm"
        />
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 accent-[#124E3B]"
          />
          عرض المنتجات المؤرشفة
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-[#E8E3D5] shadow-sm">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-[#124E3B]/15 text-xs font-extrabold">
            <tr>
              <th className="p-3">المنتج</th>
              <th className="p-3">القسم</th>
              <th className="p-3">السعر</th>
              <th className="p-3">إجمالي المخزون</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#124E3B]/10">
            {products.map((p) => {
              const totalStock = p.product_variants.reduce((acc, v) => acc + v.stock, 0);
              return (
                <tr key={p.id} className={p.is_archived ? 'opacity-60' : ''}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.product_images[0]?.url ?? ''}
                        alt=""
                        className="h-12 w-10 rounded-lg bg-[#D5CEBC] object-cover"
                      />
                      <div>
                        <p className="font-extrabold">{p.title_ar}</p>
                        <p className="font-display text-xs text-[#124E3B]/65">{p.slug}</p>
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
