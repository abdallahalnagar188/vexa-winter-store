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
          'min-h-10 cursor-pointer rounded-full px-4 text-sm font-bold transition-all',
          selectedSlug === 'all'
            ? 'bg-[#F47B20] text-white shadow-sm'
            : 'border border-[#3E452B]/25 bg-[#EAE6D7] text-[#3E452B] hover:border-[#3E452B]',
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
              'min-h-10 cursor-pointer rounded-full px-4 text-sm font-bold transition-all',
              active
                ? 'bg-[#F47B20] text-white shadow-sm'
                : 'border border-[#3E452B]/25 bg-[#EAE6D7] text-[#3E452B] hover:border-[#3E452B]',
            )}
          >
            {lang === 'ar' ? cat.name_ar : cat.name_en}
          </button>
        );
      })}
    </div>
  );
}
