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
      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#E8E3D5]/25 bg-[#0C382A] px-3 text-xs font-bold text-[#E8E3D5] transition-colors hover:border-[#FFD60A] hover:text-[#FFD60A]"
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  );
}
