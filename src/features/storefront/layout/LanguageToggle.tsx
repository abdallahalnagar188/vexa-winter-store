import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDir } from '@/shared/hooks/useDir';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const { lang } = useDir();

  const toggle = () => {
    void i18n.changeLanguage(lang === 'ar' ? 'en' : 'ar');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle language"
      className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#F4F2EC]/25 bg-[#1C314E] px-3 text-xs font-bold text-[#F4F2EC] transition-colors hover:border-[#FF6B1A] hover:text-[#FF6B1A]"
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  );
}
