import { useTranslation } from 'react-i18next';
import type { Category } from '@/shared/types/domain';
import { useDir } from '@/shared/hooks/useDir';
import { cn } from '@/shared/components/ui/cn';

interface CategoryChipsProps {
  categories: Category[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}

export function CategoryChips({ categories, selectedSlug, onSelect }: CategoryChipsProps) {
  const { t } = useTranslation();
  const { lang } = useDir();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={cn(
          'min-h-10 rounded-full px-4 text-sm font-bold transition-colors',
          selectedSlug === 'all'
            ? 'bg-[#FFD60A] text-[#124E3B] shadow-sm'
            : 'border border-[#E8E3D5]/25 bg-[#0C382A] text-[#E8E3D5] hover:border-[#FFD60A]',
        )}
      >
        {t('home.all')}
      </button>
      {categories.map((cat) => {
        const active = selectedSlug === cat.slug;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.slug)}
            className={cn(
              'min-h-10 rounded-full px-4 text-sm font-bold transition-colors',
              active
                ? 'bg-[#FFD60A] text-[#124E3B] shadow-sm'
                : 'border border-[#E8E3D5]/25 bg-[#0C382A] text-[#E8E3D5] hover:border-[#FFD60A]',
            )}
          >
            {lang === 'ar' ? cat.name_ar : cat.name_en}
          </button>
        );
      })}
    </div>
  );
}
