import { useState } from 'react';
import { Edit2, Plus, Tag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from '@/features/admin/api/useAdminCoupons';
import { formatDate, formatEGP } from '@/lib/format';
import type { DiscountType } from '@/shared/types/database';
import type { Coupon } from '@/shared/types/domain';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/components/ui/cn';

interface CouponFormState {
  id: string | null;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
}

const EMPTY_COUPON: CouponFormState = {
  id: null,
  code: '',
  discount_type: 'percent',
  discount_value: 10,
  min_order_amount: 0,
  max_uses: '',
  expires_at: '',
  is_active: true,
};

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function CouponsManager() {
  const couponsQuery = useAdminCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CouponFormState>(EMPTY_COUPON);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const coupons = couponsQuery.data ?? [];

  const openCreate = () => {
    setForm(EMPTY_COUPON);
    setFormOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setForm({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount,
      max_uses: c.max_uses !== null ? String(c.max_uses) : '',
      expires_at: toLocalDatetimeValue(c.expires_at),
      is_active: c.is_active,
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = form.code.trim().toUpperCase().replace(/\s+/g, '');
    if (cleanCode.length < 2 || cleanCode.length > 40) {
      toast.error('يجب أن يكون كود الخصم بين 2 و 40 حرفاً بدون مسافات');
      return;
    }
    if (form.discount_value <= 0) {
      toast.error('قيمة الخصم يجب أن تكون أكبر من 0');
      return;
    }
    if (form.discount_type === 'percent' && form.discount_value > 90) {
      toast.error('الخصم بالنسبة المئوية لا يتجاوز 90%');
      return;
    }

    const parsedMaxUses =
      form.max_uses.trim() === '' ? null : Math.max(1, Math.floor(Number(form.max_uses) || 0));
    const parsedExpiry = form.expires_at ? new Date(form.expires_at).toISOString() : null;

    const payload = {
      code: cleanCode,
      discount_type: form.discount_type,
      discount_value: Math.round(form.discount_value),
      min_order_amount: Math.max(0, Math.round(form.min_order_amount || 0)),
      max_uses: parsedMaxUses,
      expires_at: parsedExpiry,
      is_active: form.is_active,
    };

    try {
      if (form.id) {
        await updateCoupon.mutateAsync({ id: form.id, ...payload });
        toast.success('تم تحديث الكوبون بنجاح');
      } else {
        await createCoupon.mutateAsync(payload);
        toast.success('تم إضافة الكوبون بنجاح');
      }
      setFormOpen(false);
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('duplicate key') || msg.includes('23505')) {
        toast.error('هذا الكود موجود بالفعل، يرجى اختيار كود آخر');
      } else {
        toast.error(msg || 'تعذر حفظ الكوبون');
      }
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      await updateCoupon.mutateAsync({ id: c.id, is_active: !c.is_active });
      toast.success(c.is_active ? 'تم إيقاف الكوبون' : 'تم تفعيل الكوبون');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCoupon.mutateAsync(deleteTarget.id);
      toast.success('تم حذف الكوبون');
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const isExpired = (c: Coupon) =>
    Boolean(c.expires_at && new Date(c.expires_at).getTime() <= Date.now());
  const isExhausted = (c: Coupon) =>
    Boolean(c.max_uses !== null && c.used_count >= c.max_uses);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-[#132238]">أكواد الخصم الترويجية (Promo Codes)</h2>
          <p className="text-xs text-[#132238]/70">
            تُطبق الكوبونات بعد خصم الكميات التلقائي وقبل حساب الشحن المجاني.
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span>إضافة كود خصم</span>
        </Button>
      </div>

      {couponsQuery.isLoading ? (
        <div className="space-y-2 rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-[2px]" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-10 text-center">
          <Tag className="h-9 w-9 text-[#132238]/30" />
          <p className="text-sm font-bold text-[#132238]">لا توجد أكواد خصم مضافة حتى الآن</p>
          <Button type="button" variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span>إنشاء أول كود خصم</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-sm border border-[#132238]/12 bg-[#FFFFFF] shadow-xs md:block">
            <table className="w-full border-collapse text-start text-sm">
              <thead className="border-b border-[#132238]/12 bg-[#ECE9E0] text-xs font-extrabold">
                <tr>
                  <th className="p-3">الكود</th>
                  <th className="p-3">قيمة الخصم</th>
                  <th className="p-3">الحد الأدنى</th>
                  <th className="p-3">الاستخدام</th>
                  <th className="p-3">تاريخ الانتهاء</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132238]/10">
                {coupons.map((c) => {
                  const expired = isExpired(c);
                  const exhausted = isExhausted(c);
                  return (
                    <tr key={c.id} className="hover:bg-[#F4F2EC]/50">
                      <td className="p-3">
                        <code
                          dir="ltr"
                          className="rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] px-2.5 py-1 font-mono text-xs font-black tracking-wider text-[#132238]"
                        >
                          {c.code}
                        </code>
                      </td>
                      <td className="p-3 font-display font-extrabold text-[#FF6B1A]">
                        {c.discount_type === 'percent'
                          ? `${c.discount_value}%`
                          : formatEGP(c.discount_value, 'ar')}
                      </td>
                      <td className="p-3 font-display text-xs font-bold">
                        {c.min_order_amount > 0 ? formatEGP(c.min_order_amount, 'ar') : 'بدون حد'}
                      </td>
                      <td className="p-3 font-display text-xs font-bold" dir="ltr">
                        {c.used_count} / {c.max_uses ?? '∞'}
                      </td>
                      <td className="p-3 text-xs">
                        {c.expires_at ? (
                          <span className={expired ? 'font-bold text-rose-700' : ''}>
                            {formatDate(c.expires_at, 'ar')}
                          </span>
                        ) : (
                          'مفتوح'
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => void handleToggle(c)}
                          className={cn(
                            'cursor-pointer rounded-[2px] border px-2.5 py-1 text-xs font-bold',
                            !c.is_active || expired || exhausted
                              ? 'border-rose-300 bg-rose-50 text-rose-800'
                              : 'border-[#1F7A4D]/30 bg-[#1F7A4D]/10 text-[#1F7A4D]',
                          )}
                        >
                          {!c.is_active
                            ? 'معطل'
                            : expired
                              ? 'منتهي'
                              : exhausted
                                ? 'مكتمل'
                                : 'نشط'}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            aria-label="تعديل"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[2px] border border-[#132238]/15 hover:bg-[#132238]/5"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            aria-label="حذف"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[2px] border border-rose-300 text-rose-700 hover:bg-rose-50"
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

          <div className="space-y-3 md:hidden">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="space-y-2.5 rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <code
                    dir="ltr"
                    className="rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] px-2.5 py-1 font-mono text-xs font-black text-[#132238]"
                  >
                    {c.code}
                  </code>
                  <span className="font-display text-sm font-black text-[#FF6B1A]">
                    {c.discount_type === 'percent'
                      ? `${c.discount_value}%`
                      : formatEGP(c.discount_value, 'ar')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-[#132238]/80">
                  <span>الاستخدام: {c.used_count} / {c.max_uses ?? '∞'}</span>
                  <span>
                    الحد الأدنى: {c.min_order_amount > 0 ? formatEGP(c.min_order_amount, 'ar') : '0'}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => openEdit(c)}
                  >
                    تعديل
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleToggle(c)}
                  >
                    {c.is_active ? 'تعطيل' : 'تفعيل'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteTarget(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Input
            label="كود الخصم"
            required
            dir="ltr"
            placeholder="WINTER15"
            value={form.code}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[#132238]">نوع الخصم</label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, discount_type: e.target.value as DiscountType }))
                }
                className="min-h-11 rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] px-3 text-sm font-bold text-[#132238]"
              >
                <option value="percent">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ج.م)</option>
              </select>
            </div>

            <Input
              label={form.discount_type === 'percent' ? 'النسبة (%)' : 'قيمة الخصم (ج.م)'}
              type="number"
              min={1}
              max={form.discount_type === 'percent' ? 90 : undefined}
              required
              dir="ltr"
              value={form.discount_value}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, discount_value: Number(e.target.value) || 0 }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="الحد الأدنى للطلب (ج.م)"
              type="number"
              min={0}
              dir="ltr"
              value={form.min_order_amount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, min_order_amount: Number(e.target.value) || 0 }))
              }
            />
            <Input
              label="الحد الأقصى للاستخدام (اختياري)"
              type="number"
              min={1}
              dir="ltr"
              placeholder="مفتوح"
              value={form.max_uses}
              onChange={(e) => setForm((prev) => ({ ...prev, max_uses: e.target.value }))}
            />
          </div>

          <Input
            label="تاريخ الانتهاء (اختياري)"
            type="datetime-local"
            dir="ltr"
            value={form.expires_at}
            onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))}
          />

          <label className="flex cursor-pointer items-center gap-2.5 rounded-[2px] border border-[#132238]/15 bg-[#F4F2EC]/70 p-3 text-sm font-bold text-[#132238]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 accent-[#FF6B1A]"
            />
            <span>الكوبون نشط وقابل للاستخدام الآن</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createCoupon.isPending || updateCoupon.isPending}
            >
              {form.id ? 'حفظ التعديلات' : 'إنشاء الكوبون'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="تأكيد حذف الكوبون"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-[#132238]">
              هل تريد حذف كود الخصم{' '}
              <code className="font-mono text-[#FF6B1A]" dir="ltr">
                {deleteTarget.code}
              </code>
              ؟
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
                إلغاء
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={deleteCoupon.isPending}
                onClick={() => void handleConfirmDelete()}
              >
                حذف نهائياً
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
