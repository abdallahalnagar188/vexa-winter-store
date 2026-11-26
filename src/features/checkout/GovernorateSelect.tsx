import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GovernorateShipping } from '@/shared/types/domain';
import { formatEGP } from '@/lib/format';
import { useDir } from '@/shared/hooks/useDir';
import { cn } from '@/shared/components/ui/cn';

interface GovernorateSelectProps {
  governorates: GovernorateShipping[];
  value: number | null;
  onChange: (gov: GovernorateShipping) => void;
  error?: string;
}

export function GovernorateSelect({
  governorates,
  value,
  onChange,
  error,
}: GovernorateSelectProps) {
  const { t } = useTranslation();
  const { lang } = useDir();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = governorates.find((g) => g.id === value) ?? null;
  const filtered = governorates.filter((g) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return g.name_ar.toLowerCase().includes(q) || g.name_en.toLowerCase().includes(q);
  });

  return (
    <div className="relative flex flex-col gap-1.5">
      <label className="text-sm font-bold text-[#132238]">{t('checkout.governorate')}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl border bg-[#FFFFFF] px-3.5 py-2.5 text-sm font-semibold text-[#132238]',
          error ? 'border-rose-600' : 'border-[#132238]/20',
        )}
      >
        <span>
          {selected
            ? `${lang === 'ar' ? selected.name_ar : selected.name_en} (${formatEGP(selected.fee, lang)})`
            : t('checkout.selectGovernorate')}
        </span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>

      {open && (
        <div className="absolute top-full z-30 mt-1 w-full rounded-2xl border border-[#132238]/20 bg-[#FFFFFF] p-2 shadow-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن المحافظة...' : 'Search governorate...'}
            className="mb-2 min-h-10 w-full rounded-xl border border-[#132238]/20 bg-[#F4F2EC] px-3 text-sm text-[#132238] focus:outline-none"
          />
          <div className="max-h-60 overflow-y-auto">
            {filtered.map((gov) => (
              <button
                key={gov.id}
                type="button"
                onClick={() => {
                  onChange(gov);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-[#132238] hover:text-[#F4F2EC]',
                  gov.id === value && 'bg-[#FF6B1A] font-extrabold text-white',
                )}
              >
                <span>{lang === 'ar' ? gov.name_ar : gov.name_en}</span>
                <span className="font-display text-xs">{formatEGP(gov.fee, lang)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  );
}
