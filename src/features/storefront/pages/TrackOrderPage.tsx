import { useState, type FormEvent } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { normalizeEgPhone } from '@/shared/validation/phone';
import type { TrackedOrder } from '@/shared/types/domain';
import { ORDER_STATUS_META } from '@/shared/constants/orderStatus';
import { TRACKING_STEPS } from '@/shared/constants/transitions';
import { formatDate, formatEGP } from '@/lib/format';
import { useDir } from '@/shared/hooks/useDir';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/components/ui/cn';

export function TrackOrderPage() {
  const { t } = useTranslation();
  const { lang } = useDir();
  useDocumentTitle(t('track.title'));

  const [refInput, setRefInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const { data, error } = await supabase.rpc('track_order', {
        p_ref: refInput.trim(),
        p_phone: normalizeEgPhone(phoneInput),
      });
      if (error || !data) {
        setNotFound(true);
      } else {
        setOrder(data as unknown as TrackedOrder);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const activeIdx = order ? TRACKING_STEPS.indexOf(order.status) : -1;

  return (
    <PageTransition className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-[#132238]/12 bg-[#FFFFFF] p-6 text-[#132238] shadow-xl sm:p-8">
        <h1 className="text-2xl font-black">{t('track.title')}</h1>
        <p className="mt-1 text-sm text-[#132238]/75">{t('track.subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input
            label={t('confirmation.refLabel')}
            placeholder={t('track.refPlaceholder')}
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            dir="ltr"
            required
          />
          <Input
            label={t('checkout.phone')}
            placeholder={t('track.phonePlaceholder')}
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            inputMode="tel"
            dir="ltr"
            required
          />
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              <Search className="h-4 w-4" />
              <span>{t('track.submit')}</span>
            </Button>
          </div>
        </form>

        {notFound && (
          <p className="mt-5 rounded-xl bg-rose-100 p-3 text-center text-sm font-bold text-rose-800">
            {t('track.notFound')}
          </p>
        )}

        {order && (
          <div className="mt-6 space-y-5 border-t border-[#132238]/12 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display text-lg font-extrabold">{order.order_ref}</p>
                <p className="text-xs text-[#132238]/70">
                  {formatDate(order.created_at, lang)} • {order.governorate}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-extrabold',
                  ORDER_STATUS_META[order.status].badgeClass,
                )}
              >
                {lang === 'ar'
                  ? ORDER_STATUS_META[order.status].labelAr
                  : ORDER_STATUS_META[order.status].labelEn}
              </span>
            </div>

            {order.status !== 'cancelled' && order.status !== 'returned' && (
              <div className="grid grid-cols-4 gap-2">
                {TRACKING_STEPS.map((step, idx) => {
                  const done = activeIdx >= idx;
                  return (
                    <div key={step} className="flex flex-col items-center gap-1.5 text-center">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border-2',
                          done
                            ? 'border-[#FF6B1A] bg-[#FF6B1A] text-white'
                            : 'border-[#132238]/20 bg-[#ECE9E0] text-[#132238]/40',
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold">
                        {lang === 'ar'
                          ? ORDER_STATUS_META[step].labelAr
                          : ORDER_STATUS_META[step].labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 rounded-2xl bg-[#ECE9E0] p-4">
              <p className="text-xs font-extrabold">{t('track.items')}</p>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {item.quantity} × {item.title} ({item.size} / {item.color})
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-[#132238]/15 pt-2 font-extrabold">
                <span>{t('checkout.totalCod')}</span>
                <span className="font-display">{formatEGP(order.total_cod, lang)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
