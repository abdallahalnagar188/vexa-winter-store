import { MessageCircle } from 'lucide-react';
import { usePublicSettings } from '@/features/storefront/api/usePublicSettings';
import { useTranslation } from 'react-i18next';

export function WhatsAppButton() {
  const { data } = usePublicSettings();
  const { t } = useTranslation();
  const rawNumber = data?.whatsappNumber || (import.meta.env.VITE_WHATSAPP_NUMBER as string) || '';
  const digits = rawNumber.replace(/\D/g, '');

  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('footer.whatsapp')}
      className="fixed bottom-20 end-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFD60A] text-[#124E3B] shadow-lg transition-transform hover:scale-105 hover:bg-[#E6C000] md:bottom-6"
    >
      <MessageCircle className="h-6 w-6 fill-current" />
    </a>
  );
}
