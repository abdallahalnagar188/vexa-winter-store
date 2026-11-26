import { useTranslation } from 'react-i18next';

export function useDir() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'ar') as 'ar' | 'en';
  const dir = (lang === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr';
  return { lang, dir, isRtl: dir === 'rtl' };
}
