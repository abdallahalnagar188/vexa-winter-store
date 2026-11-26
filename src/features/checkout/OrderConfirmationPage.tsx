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
  useDocumentTitle(t('confirmation.title'));

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

  return (
    <PageTransition className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl bg-[#E8E3D5] p-6 text-center text-[#124E3B] shadow-2xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#124E3B] text-[#FFD60A]">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">{t('confirmation.title')}</h1>
        <p className="mt-2 text-sm text-[#124E3B]/75">{t('confirmation.subtitle')}</p>

        <div className="mt-6 rounded-2xl border border-[#124E3B]/20 bg-[#F2EFE6] p-4">
          <p className="text-xs font-bold text-[#124E3B]/70">{t('confirmation.refLabel')}</p>
          <div className="mt-1 flex items-center justify-center gap-3">
            <span className="font-display text-2xl font-black tracking-wider">{ref}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-lg bg-[#FFD60A] px-2.5 py-1 text-xs font-extrabold text-[#124E3B]"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? t('confirmation.copied') : t('confirmation.copyRef')}</span>
            </button>
          </div>
          {state?.total_cod !== undefined && (
            <p className="mt-3 border-t border-[#124E3B]/15 pt-3 text-sm font-bold">
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
          <Link to="/track">
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
