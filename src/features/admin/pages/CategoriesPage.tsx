import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Eye,
  EyeOff,
  FolderTree,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminCategoriesWithCounts,
  useCreateCategory,
  useReorderCategories,
  useSafeDeleteCategory,
  useUpdateCategory,
  type CategoryWithCount,
} from '@/features/admin/api/useAdminCategories';
import { slugify } from '@/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/components/ui/cn';

interface CategoryFormState {
  id: string | null;
  name_ar: string;
  name_en: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  show_in_header: boolean;
}

const EMPTY_FORM: CategoryFormState = {
  id: null,
  name_ar: '',
  name_en: '',
  slug: '',
  sort_order: 1,
  is_active: true,
  show_in_header: true,
};

export function CategoriesPage() {
  useDocumentTitle('الأقسام - الإدارة');
  const categoriesQuery = useAdminCategoriesWithCounts();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const reorderCategories = useReorderCategories();
  const safeDeleteCategory = useSafeDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('unlink');

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const activeCount = useMemo(() => categories.filter((c) => c.is_active).length, [categories]);
  const headerCount = useMemo(
    () => categories.filter((c) => c.is_active && c.show_in_header).length,
    [categories],
  );

  const openCreateModal = () => {
    const nextSort =
      categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1;
    setForm({ ...EMPTY_FORM, sort_order: nextSort });
    setSlugTouched(false);
    setFormOpen(true);
  };

  const openEditModal = (cat: CategoryWithCount) => {
    setForm({
      id: cat.id,
      name_ar: cat.name_ar,
      name_en: cat.name_en,
      slug: cat.slug,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      show_in_header: cat.show_in_header ?? true,
    });
    setSlugTouched(true);
    setFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameAr = form.name_ar.trim();
    const nameEn = form.name_en.trim();
    const finalSlug = slugify(form.slug.trim() || nameEn);

    if (!nameAr || !nameEn) {
      toast.error('يرجى إدخال اسم القسم بالعربية والإنجليزية');
      return;
    }
    if (!finalSlug) {
      toast.error('يرجى إدخال رابط (Slug) صالح بالإنجليزية مثل hoodies');
      return;
    }

    try {
      if (form.id) {
        await updateCategory.mutateAsync({
          id: form.id,
          name_ar: nameAr,
          name_en: nameEn,
          slug: finalSlug,
          sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
          is_active: form.is_active,
          show_in_header: form.show_in_header,
        });
        toast.success('تم تحديث القسم بنجاح');
      } else {
        await createCategory.mutateAsync({
          name_ar: nameAr,
          name_en: nameEn,
          slug: finalSlug,
          sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
          is_active: form.is_active,
          show_in_header: form.show_in_header,
        });
        toast.success('تم إضافة القسم الجديد بنجاح');
      }
      setFormOpen(false);
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('duplicate key') || msg.includes('23505')) {
        toast.error('الرابط (Slug) مستخدم بالفعل لقسم آخر، يرجى تغييره');
      } else {
        toast.error(msg || 'تعذر حفظ القسم');
      }
    }
  };

  const handleToggleField = async (
    cat: CategoryWithCount,
    field: 'is_active' | 'show_in_header',
  ) => {
    try {
      const nextVal = !(cat[field] ?? true);
      await updateCategory.mutateAsync({
        id: cat.id,
        [field]: nextVal,
      });
      toast.success(
        field === 'is_active'
          ? nextVal
            ? 'تم تفعيل القسم في المتجر'
            : 'تم إخفاء القسم من المتجر'
          : nextVal
            ? 'تم إظهار القسم في الهيدر'
            : 'تم إخفاء القسم من الهيدر',
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const current = categories[index];
    const target = categories[targetIdx];
    if (!current || !target) return;

    // Swap sort orders deterministically (or normalize sequential order if equal)
    const pairs =
      current.sort_order !== target.sort_order
        ? [
            { id: current.id, sort_order: target.sort_order },
            { id: target.id, sort_order: current.sort_order },
          ]
        : categories.map((c, idx) => {
            if (idx === index) return { id: c.id, sort_order: targetIdx + 1 };
            if (idx === targetIdx) return { id: c.id, sort_order: index + 1 };
            return { id: c.id, sort_order: idx + 1 };
          });

    try {
      await reorderCategories.mutateAsync(pairs);
      toast.success('تم تحديث ترتيب الأقسام');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const openDeleteModal = (cat: CategoryWithCount) => {
    const fallbackOther = categories.find((c) => c.id !== cat.id);
    setReassignTarget(fallbackOther ? fallbackOther.id : 'unlink');
    setDeleteTarget(cat);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const reassignCategoryId =
        deleteTarget.product_count > 0
          ? reassignTarget === 'unlink'
            ? null
            : reassignTarget
          : undefined;

      await safeDeleteCategory.mutateAsync({
        categoryId: deleteTarget.id,
        reassignCategoryId,
      });
      toast.success('تم حذف القسم بنجاح');
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as Error).message || 'تعذر حذف القسم');
    }
  };

  const otherCategoriesForReassign = useMemo(
    () => (deleteTarget ? categories.filter((c) => c.id !== deleteTarget.id) : []),
    [categories, deleteTarget],
  );

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#132238]">إدارة الأقسام</h1>
          <p className="mt-0.5 text-xs text-[#132238]/70">
            تحكم في أقسام المتجر، ترتيب ظهورها، وظهورها في الهيدر وشريط التصفية ({categories.length}{' '}
            إجمالي · {activeCount} نشط · {headerCount} في الهيدر)
          </p>
        </div>
        <Button type="button" variant="primary" className="rounded-[2px]" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          <span>إضافة قسم جديد</span>
        </Button>
      </div>

      {/* Loading State */}
      {categoriesQuery.isLoading ? (
        <div className="space-y-3 rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-[2px]" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-12 text-center">
          <FolderTree className="h-10 w-10 text-[#132238]/30" />
          <p className="text-sm font-bold text-[#132238]">لا توجد أقسام مضافة حتى الآن</p>
          <Button type="button" variant="primary" className="rounded-[2px]" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            <span>إضافة أول قسم</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-sm border border-[#132238]/12 bg-[#FFFFFF] shadow-xs md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right text-sm">
                <thead className="border-b border-[#132238]/12 bg-[#F4F2EC]/80 text-xs font-extrabold text-[#132238]">
                  <tr>
                    <th className="px-4 py-3">الترتيب</th>
                    <th className="px-4 py-3">الاسم بالعربية</th>
                    <th className="px-4 py-3">الاسم بالإنجليزية</th>
                    <th className="px-4 py-3">الرابط (Slug)</th>
                    <th className="px-4 py-3">المنتجات</th>
                    <th className="px-4 py-3">في الهيدر</th>
                    <th className="px-4 py-3">الحالة</th>
                    <th className="px-4 py-3 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132238]/10">
                  {categories.map((cat, idx) => (
                    <tr key={cat.id} className="transition hover:bg-[#F4F2EC]/40">
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-[2px] border border-[#132238]/15 bg-[#F4F2EC] px-1.5 font-display text-xs font-bold text-[#132238]">
                            {cat.sort_order}
                          </span>
                          <button
                            type="button"
                            disabled={idx === 0 || reorderCategories.isPending}
                            onClick={() => void handleMove(idx, -1)}
                            aria-label="تحريك لأعلى"
                            className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-[#132238]/15 text-[#132238] hover:bg-[#132238]/5 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === categories.length - 1 || reorderCategories.isPending}
                            onClick={() => void handleMove(idx, 1)}
                            aria-label="تحريك لأسفل"
                            className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-[#132238]/15 text-[#132238] hover:bg-[#132238]/5 disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#132238]">{cat.name_ar}</td>
                      <td className="px-4 py-3 font-display text-xs font-semibold text-[#132238]/80" dir="ltr">
                        {cat.name_en}
                      </td>
                      <td className="px-4 py-3">
                        <code
                          dir="ltr"
                          className="rounded-[2px] border border-[#132238]/15 bg-[#F4F2EC] px-2 py-0.5 font-mono text-xs text-[#132238]"
                        >
                          {cat.slug}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/products"
                          className="inline-flex items-center gap-1 rounded-[2px] border border-[#132238]/15 bg-[#F4F2EC]/70 px-2 py-0.5 font-display text-xs font-bold text-[#132238] hover:border-[#FF6B1A] hover:text-[#FF6B1A]"
                        >
                          {cat.product_count} منتج
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={updateCategory.isPending}
                          onClick={() => void handleToggleField(cat, 'show_in_header')}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 text-xs font-bold transition',
                            cat.show_in_header !== false
                              ? 'border-[#132238] bg-[#132238] text-[#F4F2EC]'
                              : 'border-[#132238]/20 bg-[#F4F2EC] text-[#132238]/60 hover:border-[#132238]/40',
                          )}
                        >
                          {cat.show_in_header !== false ? (
                            <>
                              <Eye className="h-3.5 w-3.5 text-[#FF6B1A]" />
                              <span>ظاهر</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={updateCategory.isPending}
                          onClick={() => void handleToggleField(cat, 'is_active')}
                          className={cn(
                            'inline-flex items-center rounded-[2px] border px-2.5 py-1 text-xs font-bold transition',
                            cat.is_active
                              ? 'border-[#1F7A4D]/30 bg-[#1F7A4D]/10 text-[#1F7A4D]'
                              : 'border-[#B42318]/25 bg-[#B42318]/10 text-[#B42318]',
                          )}
                        >
                          {cat.is_active ? 'نشط' : 'معطل'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            aria-label="تعديل القسم"
                            className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#132238]/15 text-[#132238] hover:border-[#132238] hover:bg-[#132238]/5"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(cat)}
                            aria-label="حذف القسم"
                            className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#B42318]/25 text-[#B42318] hover:bg-[#B42318]/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="space-y-3 rounded-sm border border-[#132238]/15 bg-[#FFFFFF] p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-[#132238]">{cat.name_ar}</h3>
                    <p className="font-display text-xs font-semibold text-[#132238]/70" dir="ltr">
                      {cat.name_en} · <code>{cat.slug}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0 || reorderCategories.isPending}
                      onClick={() => void handleMove(idx, -1)}
                      aria-label="تحريك لأعلى"
                      className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#132238]/15 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === categories.length - 1 || reorderCategories.isPending}
                      onClick={() => void handleMove(idx, 1)}
                      aria-label="تحريك لأسفل"
                      className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#132238]/15 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-[2px] border border-[#132238]/15 bg-[#F4F2EC] px-2 py-1 font-bold">
                    {cat.product_count} منتج
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleToggleField(cat, 'show_in_header')}
                    className={cn(
                      'rounded-[2px] border px-2 py-1 font-bold',
                      cat.show_in_header !== false
                        ? 'border-[#132238] bg-[#132238] text-[#F4F2EC]'
                        : 'border-[#132238]/20 bg-[#F4F2EC] text-[#132238]/60',
                    )}
                  >
                    الهيدر: {cat.show_in_header !== false ? 'ظاهر' : 'مخفي'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleField(cat, 'is_active')}
                    className={cn(
                      'rounded-[2px] border px-2 py-1 font-bold',
                      cat.is_active
                        ? 'border-[#1F7A4D]/30 bg-[#1F7A4D]/10 text-[#1F7A4D]'
                        : 'border-[#B42318]/25 bg-[#B42318]/10 text-[#B42318]',
                    )}
                  >
                    {cat.is_active ? 'نشط' : 'معطل'}
                  </button>
                </div>

                <div className="flex items-center gap-2 border-t border-[#132238]/10 pt-2.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="flex-1 rounded-[2px]"
                    onClick={() => openEditModal(cat)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>تعديل</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    className="rounded-[2px]"
                    onClick={() => openDeleteModal(cat)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>حذف</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create / Edit Category Dialog */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? 'تعديل القسم' : 'إضافة قسم جديد'}
      >
        <form onSubmit={(e) => void handleSaveForm(e)} className="space-y-4">
          <Input
            label="الاسم بالعربية"
            required
            placeholder="مثال: هوديز شتوي"
            value={form.name_ar}
            onChange={(e) => setForm((prev) => ({ ...prev, name_ar: e.target.value }))}
          />

          <Input
            label="الاسم بالإنجليزية"
            required
            dir="ltr"
            placeholder="e.g. Winter Hoodies"
            value={form.name_en}
            onChange={(e) => {
              const nextEn = e.target.value;
              setForm((prev) => ({
                ...prev,
                name_en: nextEn,
                slug: slugTouched ? prev.slug : slugify(nextEn),
              }));
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="الرابط (Slug)"
              required
              dir="ltr"
              placeholder="winter-hoodies"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
            />
            <Input
              label="ترتيب الظهور"
              type="number"
              min={0}
              dir="ltr"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))
              }
            />
          </div>

          <div className="grid gap-2.5 rounded-[2px] border border-[#132238]/12 bg-[#F4F2EC]/60 p-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-[#132238]">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded-[2px] accent-[#FF6B1A]"
              />
              <span>قسم نشط (يظهر في المتجر والبحث والتصفية)</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-[#132238]">
              <input
                type="checkbox"
                checked={form.show_in_header}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, show_in_header: e.target.checked }))
                }
                className="h-4 w-4 rounded-[2px] accent-[#FF6B1A]"
              />
              <span>إظهار في قائمة الهيدر الرئيسية</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-[2px]"
              onClick={() => setFormOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-[2px]"
              loading={createCategory.isPending || updateCategory.isPending}
            >
              {form.id ? 'حفظ التعديلات' : 'إضافة القسم'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Safe Delete Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="تأكيد حذف القسم"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="rounded-[2px] border border-[#132238]/15 bg-[#F4F2EC]/70 p-3.5 text-sm">
              <p className="font-bold text-[#132238]">
                هل أنت متأكد من حذف قسم:{' '}
                <span className="text-[#FF6B1A]">{deleteTarget.name_ar}</span>؟
              </p>
              <p className="mt-1 text-xs text-[#132238]/70">
                ملاحظة: قد تستخدم بطاقات الصفحة الرئيسية هذا الرابط ({deleteTarget.slug})، ويمكنك
                تحديثها من إدارة الرئيسية لاحقاً.
              </p>
            </div>

            {deleteTarget.product_count > 0 && (
              <div className="space-y-3 rounded-[2px] border border-[#FF6B1A]/40 bg-[#FF6B1A]/10 p-3.5">
                <div className="flex items-start gap-2 text-xs font-bold text-[#132238]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B1A]" />
                  <span>
                    يوجد حالياً <strong>{deleteTarget.product_count}</strong> منتج مرتبط بهذا القسم.
                    اختر وجهة المنتجات قبل إتمام الحذف:
                  </span>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#132238]">
                    نقل المنتجات إلى:
                  </label>
                  <select
                    value={reassignTarget}
                    onChange={(e) => setReassignTarget(e.target.value)}
                    className="min-h-10 w-full rounded-[2px] border border-[#132238]/25 bg-[#FFFFFF] px-3 text-sm font-semibold text-[#132238]"
                  >
                    {otherCategoriesForReassign.map((c) => (
                      <option key={c.id} value={c.id}>
                        نقل إلى: {c.name_ar} ({c.name_en})
                      </option>
                    ))}
                    <option value="unlink">بدون قسم (إزالة ربط القسم فقط)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-[2px]"
                onClick={() => setDeleteTarget(null)}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                variant="danger"
                className="rounded-[2px]"
                loading={safeDeleteCategory.isPending}
                onClick={() => void handleConfirmDelete()}
              >
                {deleteTarget.product_count > 0 ? 'نقل المنتجات وحذف القسم' : 'تأكيد الحذف'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
