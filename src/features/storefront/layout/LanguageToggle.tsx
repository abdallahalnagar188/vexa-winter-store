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
      className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#C5BFA8]/30 bg-[#2F3520] px-3 text-xs font-bold text-[#EAE6D7] transition-colors hover:border-[#F47B20] hover:text-[#F47B20]"
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  );
}
