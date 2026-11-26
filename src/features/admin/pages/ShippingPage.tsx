import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminShipping, useSaveGovernorates } from '@/features/admin/api/useAdminShipping';
import { useAdminSettings, useSaveSetting } from '@/features/admin/api/useAdminSettings';
import type { GovernorateShipping } from '@/shared/types/domain';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Button } from '@/shared/components/ui/Button';

export function ShippingPage() {
  useDocumentTitle('شحن المحافظات - الإدارة');
  const shippingQuery = useAdminShipping();
  const settingsQuery = useAdminSettings();
  const saveGovernorates = useSaveGovernorates();
  const saveSetting = useSaveSetting();

  const [rows, setRows] = useState<GovernorateShipping[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [bulkFee, setBulkFee] = useState('');
  const [freeThreshold, setFreeThreshold] = useState(0);

  useEffect(() => {
    if (shippingQuery.data) {
      setRows(shippingQuery.data);
      setDirtyIds(new Set());
    }
  }, [shippingQuery.data]);

  useEffect(() => {
    if (settingsQuery.data) {
      setFreeThreshold(settingsQuery.data.free_shipping_threshold);
    }
  }, [settingsQuery.data]);

  const updateRow = (id: number, patch: Partial<GovernorateShipping>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirtyIds((prev) => new Set(prev).add(id));
  };

  const applyBulk = () => {
    const val = Number(bulkFee);
    if (Number.isNaN(val) || val < 0) return;
    setRows((prev) => prev.map((r) => ({ ...r, fee: Math.round(val) })));
    setDirtyIds(new Set(rows.map((r) => r.id)));
  };

  const handleSave = async () => {
    try {
      await saveGovernorates.mutateAsync(rows);
      await saveSetting.mutateAsync({
        key: 'free_shipping_threshold',
        value: freeThreshold,
        isPublic: true,
      });
      setDirtyIds(new Set());
      toast.success('تم حفظ أسعار الشحن لجميع المحافظات');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-[#124E3B]">أسعار شحن المحافظات (27 محافظة)</h1>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saveGovernorates.isPending || saveSetting.isPending}
        >
          <Save className="h-4 w-4" />
          <span>حفظ التعديلات</span>
        </Button>
      </div>

      <div className="grid gap-4 rounded-2xl bg-[#E8E3D5] p-4 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-bold">تعيين سعر موحد لكل المحافظات</label>
            <input
              type="number"
              min={0}
              value={bulkFee}
              onChange={(e) => setBulkFee(e.target.value)}
              placeholder="مثال: 75"
              className="mt-1 min-h-10 w-full rounded-xl border border-[#124E3B]/20 bg-[#F2EFE6] px-3 font-display text-sm"
            />
          </div>
          <Button type="button" variant="secondary" onClick={applyBulk}>
            تطبيق للكل
          </Button>
        </div>

        <div>
          <label className="block text-xs font-bold">
            الحد الأدنى للشحن المجاني (0 = معطل)
          </label>
          <input
            type="number"
            min={0}
            value={freeThreshold}
            onChange={(e) => setFreeThreshold(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1 min-h-10 w-full rounded-xl border border-[#124E3B]/20 bg-[#F2EFE6] px-3 font-display text-sm font-bold"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-[#E8E3D5] shadow-sm">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-[#124E3B]/15 text-xs font-extrabold">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">المحافظة (عربي)</th>
              <th className="p-3">المحافظة (إنجليزي)</th>
              <th className="p-3">سعر الشحن (ج.م)</th>
              <th className="p-3">متاح</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#124E3B]/10">
            {rows.map((gov) => (
              <tr key={gov.id} className={dirtyIds.has(gov.id) ? 'bg-[#FFD60A]/25' : ''}>
                <td className="p-3 font-display text-xs">{gov.id}</td>
                <td className="p-3 font-bold">{gov.name_ar}</td>
                <td className="p-3 font-display text-xs">{gov.name_en}</td>
                <td className="p-3">
                  <input
                    type="number"
                    min={0}
                    value={gov.fee}
                    onChange={(e) =>
                      updateRow(gov.id, { fee: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-24 rounded-lg border border-[#124E3B]/20 bg-[#F2EFE6] px-2.5 py-1.5 font-display text-sm font-bold"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={gov.is_active}
                    onChange={(e) => updateRow(gov.id, { is_active: e.target.checked })}
                    className="h-4 w-4 accent-[#124E3B]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
