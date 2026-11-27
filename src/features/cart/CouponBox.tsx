import { useState, type FormEvent } from 'react';
import { Tag, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatEGP } from '@/lib/format';
import { useDir } from '@/shared/hooks/useDir';
import { useCartStore } from './cartStore';
import { Button } from '@/shared/components/ui/Button';
import type { DiscountType } from '@/shared/types/database';

interface ValidateCouponResponse {
  valid: boolean;
  code?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  discount_amount?: number;
  min_order_amount?: number;
  error_code?: string | null;
}

interface CouponBoxProps {
  subtotalAfterBundle: number;
}

export function CouponBox({ subtotalAfterBundle }: CouponBoxProps) {
  const { t } = useTranslation();
  const { lang } = useDir();
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);

  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = codeInput.trim().toUpperCase();
    if (!cleaned) {
      setErrorMsg(t('cart.couponErrors.COUPON_EMPTY'));
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: cleaned,
        p_subtotal: Math.max(0, Math.round(subtotalAfterBundle)),
      });
      if (error) throw error;

      const res = data as unknown as ValidateCouponResponse;
      if (!res?.valid || !res.code || !res.discount_type || !res.discount_value) {
        const errCode = res?.error_code ?? 'COUPON_INVALID';
        if (errCode === 'COUPON_MIN_ORDER' && typeof res?.min_order_amount === 'number') {
          setErrorMsg(
            t('cart.couponErrors.COUPON_MIN_ORDER', {
              amount: formatEGP(res.min_order_amount, lang),
            }),
          );
        } else {
          setErrorMsg(t(`cart.couponErrors.${errCode}`, t('cart.couponErrors.COUPON_INVALID')));
        }
        return;
      }

      setCoupon({
        code: res.code,
        discountType: res.discount_type,
        discountValue: res.discount_value,
        minOrderAmount: res.min_order_amount ?? 0,
      });
      setCodeInput('');
      toast.success(t('cart.couponApplied', { code: res.code }));
    } catch {
      setErrorMsg(t('cart.couponErrors.COUPON_INVALID'));
    } finally {
      setLoading(false);
    }
  };

  const belowMin =
    coupon && coupon.minOrderAmount > 0 && subtotalAfterBundle < coupon.minOrderAmount;

  return (
    <div className="mb-3 space-y-2 border-b border-[#132238]/12 pb-3">
      {coupon ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] px-3 py-2 text-xs">
            <div className="flex items-center gap-2 font-extrabold text-[#132238]">
              <Tag className="h-3.5 w-3.5 text-[#FF6B1A]" />
              <span className="font-mono tracking-wider" dir="ltr">
                {coupon.code}
              </span>
              <span className="text-[#1F7A4D]">
                (
                {coupon.discountType === 'percent'
                  ? `-${coupon.discountValue}%`
                  : `-${formatEGP(coupon.discountValue, lang)}`}
                )
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearCoupon();
                setErrorMsg(null);
              }}
              aria-label={t('cart.couponRemove')}
              className="inline-flex cursor-pointer items-center gap-1 rounded-[2px] px-1.5 py-0.5 text-[11px] font-bold text-[#B42318] hover:bg-[#B42318]/10"
            >
              <X className="h-3 w-3" />
              <span>{t('cart.couponRemove')}</span>
            </button>
          </div>
          {belowMin && (
            <p className="text-[11px] font-bold text-amber-800">
              {t('cart.couponErrors.COUPON_MIN_ORDER', {
                amount: formatEGP(coupon.minOrderAmount, lang),
              })}
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => void handleApply(e)} className="flex items-stretch gap-2">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value.toUpperCase());
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder={t('cart.couponPlaceholder')}
            aria-label={t('cart.couponLabel')}
            dir="ltr"
            className="min-h-10 min-w-0 flex-1 rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] px-3 font-mono text-xs font-bold uppercase text-[#132238] placeholder:font-sans placeholder:normal-case placeholder:text-[#132238]/45 focus:border-[#132238] focus:outline-none"
          />
          <Button type="submit" variant="secondary" size="sm" loading={loading} className="min-h-10 px-4">
            {t('cart.couponApply')}
          </Button>
        </form>
      )}
      {errorMsg && <p className="text-xs font-bold text-rose-700">{errorMsg}</p>}
    </div>
  );
}
