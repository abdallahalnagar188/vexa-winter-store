import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

const STORAGE_KEY = 'vexa-lang';
const defaultLang = (import.meta.env.VITE_DEFAULT_LANG as string) === 'en' ? 'en' : 'ar';

function getInitialLang(): 'ar' | 'en' {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  }
  return defaultLang;
}

export function syncHtmlDirection(lang: 'ar' | 'en'): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }
}

const initialLang = getInitialLang();
syncHtmlDirection(initialLang);

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  syncHtmlDirection(lng.startsWith('en') ? 'en' : 'ar');
});

export default i18n;
