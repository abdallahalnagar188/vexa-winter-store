import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { Button } from '@/shared/components/ui/Button';
import { usePublicSettings } from '@/features/storefront/api/usePublicSettings';
import { formatEGP } from '@/lib/format';
import { useDir } from '@/shared/hooks/useDir';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export function OrderConfirmationPage() {
  const { ref } = useParams();
  const { state } = useLocation() as { state?: { total_cod?: number } };
  const { t } = useTranslation();
  const { lang } = useDir();
  useDocumentTitle(t('confirmation.title'), { noIndex: true });

  const [copied, setCopied] = useState(false);
  const { data: settings } = usePublicSettings();
  const digits = (settings?.whatsappNumber || '').replace(/\D/g, '');

  const handleCopy = async () => {
    if (!ref) return;
    await navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(`تأكيد طلب رقم: ${ref ?? ''}`)}`
    : null;

  const trackUrl = ref ? `/track?ref=${encodeURIComponent(ref)}` : '/track';

  return (
    <PageTransition className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-6 text-center text-[#132238] shadow-2xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2px] bg-[#132238] text-[#FF6B1A]">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <h1 className="mt-5 text-2xl font-black sm:text-3xl">{t('confirmation.title')}</h1>
        <p className="mt-2 text-sm text-[#132238]/75">{t('confirmation.subtitle')}</p>

        <div className="mt-6 rounded-sm border border-[#132238]/15 bg-[#ECE9E0] p-4">
          <p className="text-xs font-bold text-[#132238]/70">{t('confirmation.refLabel')}</p>
          <div className="mt-1 flex items-center justify-center gap-3">
            <span className="font-display text-2xl font-black tracking-wider">{ref}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex cursor-pointer items-center gap-1 rounded-[2px] bg-[#FF6B1A] px-2.5 py-1 text-xs font-extrabold text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? t('confirmation.copied') : t('confirmation.copyRef')}</span>
            </button>
          </div>
          {state?.total_cod !== undefined && (
            <p className="mt-3 border-t border-[#132238]/15 pt-3 text-sm font-bold">
              {t('confirmation.totalCod')}:{' '}
              <span className="font-display text-lg font-black">
                {formatEGP(state.total_cod, lang)}
              </span>
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="lg" className="w-full">
                <MessageCircle className="h-5 w-5" />
                <span>{t('confirmation.whatsappBtn')}</span>
              </Button>
            </a>
          )}
          <Link to={trackUrl}>
            <Button variant="secondary" size="lg" className="w-full">
              {t('confirmation.trackBtn')}
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" size="md" className="w-full">
              {t('confirmation.continueBtn')}
            </Button>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
