import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

export interface EditableVariant {
  id?: string;
  size: string;
  color_name: string;
  color_hex: string;
  sku: string;
  stock: number;
  is_active: boolean;
}

interface VariantMatrixEditorProps {
  variants: EditableVariant[];
  onChange: (next: EditableVariant[]) => void;
}

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL'];

export function VariantMatrixEditor({ variants, onChange }: VariantMatrixEditorProps) {
  const [sizeInput, setSizeInput] = useState('S, M, L, XL');
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#124E3B');

  const generateColorVariants = () => {
    const cleanColor = colorName.trim();
    if (!cleanColor) return;
    const sizes = sizeInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const list = sizes.length > 0 ? sizes : DEFAULT_SIZES;

    const existingKeys = new Set(variants.map((v) => `${v.size}::${v.color_name}`));
    const additions: EditableVariant[] = [];
    for (const size of list) {
      const key = `${size}::${cleanColor}`;
      if (!existingKeys.has(key)) {
        additions.push({
          size,
          color_name: cleanColor,
          color_hex: colorHex,
          sku: '',
          stock: 10,
          is_active: true,
        });
      }
    }
    onChange([...variants, ...additions]);
    setColorName('');
  };

  const updateRow = (idx: number, patch: Partial<EditableVariant>) => {
    onChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  const removeRow = (idx: number) => {
    onChange(variants.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-[#124E3B]/15 bg-[#F2EFE6] p-4 sm:grid-cols-4">
        <input
          type="text"
          value={sizeInput}
          onChange={(e) => setSizeInput(e.target.value)}
          placeholder="S, M, L, XL"
          dir="ltr"
          className="min-h-10 rounded-xl border border-[#124E3B]/20 bg-white px-3 text-sm"
        />
        <input
          type="text"
          value={colorName}
          onChange={(e) => setColorName(e.target.value)}
          placeholder="اسم اللون (مثال: أسود)"
          className="min-h-10 rounded-xl border border-[#124E3B]/20 bg-white px-3 text-sm"
        />
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded-lg border border-[#124E3B]/20 bg-white p-1"
          />
          <span className="font-display text-xs">{colorHex}</span>
        </div>
        <Button type="button" variant="secondary" onClick={generateColorVariants}>
          <Plus className="h-4 w-4" />
          <span>إضافة مقاسات اللون</span>
        </Button>
      </div>

      {variants.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[#124E3B]/15 bg-[#F2EFE6]">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-[#124E3B]/15 text-xs font-extrabold">
              <tr>
                <th className="p-3">المقاس</th>
                <th className="p-3">اللون</th>
                <th className="p-3">SKU</th>
                <th className="p-3">المخزون</th>
                <th className="p-3">متاح</th>
                <th className="p-3">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#124E3B]/10">
              {variants.map((v, idx) => (
                <tr key={v.id ?? `${v.size}-${v.color_name}-${idx}`}>
                  <td className="p-2.5 font-display font-bold">{v.size}</td>
                  <td className="p-2.5">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: v.color_hex }}
                      />
                      {v.color_name}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={v.sku}
                      dir="ltr"
                      onChange={(e) => updateRow(idx, { sku: e.target.value })}
                      className="w-24 rounded-lg border border-[#124E3B]/20 bg-white px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) =>
                        updateRow(idx, { stock: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="w-20 rounded-lg border border-[#124E3B]/20 bg-white px-2 py-1 font-display text-sm font-bold"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="checkbox"
                      checked={v.is_active}
                      onChange={(e) => updateRow(idx, { is_active: e.target.checked })}
                      className="h-4 w-4 accent-[#124E3B]"
                    />
                  </td>
                  <td className="p-2.5">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="rounded p-1.5 text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
