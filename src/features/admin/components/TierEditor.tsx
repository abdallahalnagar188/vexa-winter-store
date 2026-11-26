import { Plus, Trash2 } from 'lucide-react';
import type { DiscountType } from '@/shared/types/database';
import { Button } from '@/shared/components/ui/Button';

export interface EditableTier {
  min_qty: number;
  discount_type: DiscountType;
  value: number;
  is_active: boolean;
}

interface TierEditorProps {
  tiers: EditableTier[];
  onChange: (next: EditableTier[]) => void;
}

export function TierEditor({ tiers, onChange }: TierEditorProps) {
  const addRow = () => {
    const maxQty = tiers.reduce((m, t) => Math.max(m, t.min_qty), 1);
    onChange([
      ...tiers,
      { min_qty: maxQty + 1, discount_type: 'percent', value: 10, is_active: true },
    ]);
  };

  const updateRow = (idx: number, patch: Partial<EditableTier>) => {
    onChange(tiers.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = (idx: number) => {
    onChange(tiers.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {tiers.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-2 items-center gap-2 rounded-xl border border-[#132238]/15 bg-[#F4F2EC] p-3 sm:grid-cols-5"
        >
          <div>
            <label className="block text-[11px] font-bold">الحد الأدنى (قطعة)</label>
            <input
              type="number"
              min={2}
              value={row.min_qty}
              onChange={(e) =>
                updateRow(idx, { min_qty: Math.max(2, Number(e.target.value) || 2) })
              }
              className="mt-1 w-full rounded-lg border border-[#132238]/20 bg-white px-2.5 py-1.5 font-display text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold">النوع</label>
            <select
              value={row.discount_type}
              onChange={(e) =>
                updateRow(idx, { discount_type: e.target.value as DiscountType })
              }
              className="mt-1 w-full rounded-lg border border-[#132238]/20 bg-white px-2 py-1.5 text-sm font-bold"
            >
              <option value="percent">نسبة %</option>
              <option value="fixed">مبلغ ثابت (ج.م)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold">القيمة</label>
            <input
              type="number"
              min={1}
              max={row.discount_type === 'percent' ? 90 : undefined}
              value={row.value}
              onChange={(e) =>
                updateRow(idx, { value: Math.max(1, Number(e.target.value) || 1) })
              }
              className="mt-1 w-full rounded-lg border border-[#132238]/20 bg-white px-2.5 py-1.5 font-display text-sm font-bold"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={row.is_active}
              onChange={(e) => updateRow(idx, { is_active: e.target.checked })}
              className="h-4 w-4 accent-[#132238]"
            />
            مفعل
          </label>
          <button
            type="button"
            onClick={() => removeRow(idx)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-4 w-4" />
        <span>إضافة شريحة خصم</span>
      </Button>
    </div>
  );
}
