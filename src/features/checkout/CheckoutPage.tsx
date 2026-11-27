import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { checkoutSchema, type CheckoutFormValues } from '@/shared/validation/checkoutSchema';
import { useCartStore } from '@/features/cart/cartStore';
import { useCartPricing } from '@/features/cart/useCartPricing';
import { useShippingRates } from './api/useShippingRates';
import { useCreateOrder } from './api/useCreateOrder';
import { GovernorateSelect } from './GovernorateSelect';
import { OrderSummary } from './OrderSummary';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useDir } from '@/shared/hooks/useDir';
import { formatEGP } from '@/lib/format';
import { trackPixelEvent } from '@/lib/analytics';

const DRAFT_KEY = 'vexa-checkout-draft:v1';

function loadDraft(): Partial<CheckoutFormValues> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<CheckoutFormValues>) : {};
  } catch {
    return {};
  }
}

export function CheckoutPage() {
  const { t } = useTranslation();
  const { lang } = useDir();
  useDocumentTitle(t('checkout.title'));
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);
  const clearCart = useCartStore((s) => s.clear);
  const syncStock = useCartStore((s) => s.syncStock);

  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const shippingQuery = useShippingRates();
  const createOrder = useCreateOrder();

  const draft = loadDraft();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: draft.customer_name ?? '',
      phone: draft.phone ?? '',
      phone_secondary: draft.phone_secondary ?? '',
      governorate_id: draft.governorate_id ?? 0,
      city_area: draft.city_area ?? '',
      address_details: draft.address_details ?? '',
      notes: draft.notes ?? '',
      website: '',
    },
  });

  const watched = watch();
  const selectedGov = (shippingQuery.data ?? []).find((g) => g.id === watched.governorate_id) ?? null;
  const rawShippingFee = selectedGov ? selectedGov.fee : null;
  const { priced, freeShippingThreshold } = useCartPricing(rawShippingFee);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(watched));
    } catch {
      // ignore storage quota
    }
  }, [watched]);

  useEffect(() => {
    if (items.length > 0) {
      trackPixelEvent('InitiateCheckout', { num_items: items.length, currency: 'EGP' });
    }
  }, [items.length]);

  if (items.length === 0 && !submittedSuccess) {
    return <Navigate to="/cart" replace />;
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    if (values.website && values.website.trim().length > 0) {
      setSubmittedSuccess(true);
      clearCart();
      navigate('/order/WNT-000000', { state: { total_cod: priced.totalCod ?? 0 }, replace: true });
      return;
    }

    try {
      const res = await createOrder.mutateAsync({
        customer_name: values.customer_name,
        phone: values.phone,
        phone_secondary: values.phone_secondary || null,
        governorate_id: values.governorate_id,
        city_area: values.city_area,
        address_details: values.address_details,
        notes: values.notes || null,
        coupon_code: coupon?.code ?? null,
        idempotency_key: idempotencyKey,
        items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      });

      setSubmittedSuccess(true);
      sessionStorage.removeItem(DRAFT_KEY);
      clearCart();
      trackPixelEvent('Purchase', { value: res.total_cod, currency: 'EGP' });
      navigate(`/order/${res.order_ref}`, {
        state: { total_cod: res.total_cod },
        replace: true,
      });
    } catch (err) {
      const supaErr = err as { message?: string; details?: string };
      const msg = supaErr.message ?? '';

      if (msg.includes('STOCK_UNAVAILABLE') && supaErr.details) {
        try {
          const bad = JSON.parse(supaErr.details) as { variant_id: string; available: number }[];
          const stockMap: Record<string, number> = {};
          for (const entry of bad) stockMap[entry.variant_id] = entry.available;
          syncStock(stockMap);
        } catch {
          // ignore parse failure
        }
        toast.error(t('checkout.errors.stock'));
      } else if (msg.includes('RATE_LIMITED')) {
        toast.error(t('checkout.errors.rate_limited'));
      } else if (msg.includes('COUPON_')) {
        clearCoupon();
        toast.error(t('cart.couponErrors.COUPON_INVALID'));
      } else if (msg.includes('INVALID_PHONE')) {
        toast.error(t('checkout.errors.invalid_phone'));
      } else if (msg.includes('INVALID_GOVERNORATE')) {
        toast.error(t('checkout.errors.gov_required'));
      } else {
        toast.error(t('checkout.errors.generic'));
      }
    }
  };

  const translateErr = (key?: string) => (key ? t(`checkout.errors.${key}`) : undefined);

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pb-12">
      <h1 className="text-2xl font-black text-[#132238] sm:text-3xl">{t('checkout.title')}</h1>
      <p className="mt-1 text-sm text-[#132238]/75">{t('checkout.subtitle')}</p>

      <div className="mt-5 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-sm border border-[#132238]/12 bg-[#FFFFFF] px-4 py-3 text-sm font-extrabold text-[#132238]"
        >
          <span>{t('checkout.summary')}</span>
          <span className="flex items-center gap-2 font-display">
            {priced.totalCod !== null
              ? formatEGP(priced.totalCod, lang)
              : formatEGP(priced.subtotalAfterDiscount, lang)}
            {mobileSummaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {mobileSummaryOpen && (
          <div className="mt-2">
            <OrderSummary
              items={items}
              priced={priced}
              freeShippingThreshold={freeShippingThreshold}
              rawShippingFee={rawShippingFee}
            />
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <form
          id="checkout-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-sm border border-[#132238]/12 bg-[#FFFFFF] p-5 text-[#132238] shadow-xl sm:p-7 lg:col-span-7"
        >
          <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register('website')} />

          <Input
            label={t('checkout.fullName')}
            {...register('customer_name')}
            error={translateErr(errors.customer_name?.message)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('checkout.phone')}
              inputMode="tel"
              dir="ltr"
              placeholder="01012345678"
              {...register('phone')}
              error={translateErr(errors.phone?.message)}
            />
            <Input
              label={t('checkout.phoneSecondary')}
              inputMode="tel"
              dir="ltr"
              placeholder="01112345678"
              {...register('phone_secondary')}
              error={translateErr(errors.phone_secondary?.message)}
            />
          </div>

          <GovernorateSelect
            governorates={shippingQuery.data ?? []}
            value={watched.governorate_id || null}
            onChange={(gov) => setValue('governorate_id', gov.id, { shouldValidate: true })}
            error={translateErr(errors.governorate_id?.message)}
          />

          <Input
            label={t('checkout.cityArea')}
            {...register('city_area')}
            error={translateErr(errors.city_area?.message)}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="address_details" className="text-sm font-bold text-[#132238]">
              {t('checkout.address')}
            </label>
            <textarea
              id="address_details"
              rows={3}
              {...register('address_details')}
              className="w-full rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] p-3 text-sm text-[#132238] focus:border-[#132238] focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]/50"
            />
            {errors.address_details?.message && (
              <p className="text-xs font-semibold text-rose-700">
                {translateErr(errors.address_details.message)}
              </p>
            )}
          </div>

          <Input label={t('checkout.notes')} {...register('notes')} />

          <div className="rounded-sm border border-[#132238]/15 bg-[#ECE9E0] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#132238] text-[#FF6B1A]">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold">{t('checkout.codLabel')}</p>
                <p className="text-xs text-[#132238]/75">{t('checkout.codSub')}</p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={createOrder.isPending}
            className="hidden w-full lg:inline-flex"
          >
            <ShieldCheck className="h-5 w-5" />
            <span>{t('checkout.confirmOrder')}</span>
          </Button>
        </form>

        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-24">
            <OrderSummary
              items={items}
              priced={priced}
              freeShippingThreshold={freeShippingThreshold}
              rawShippingFee={rawShippingFee}
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#132238]/15 bg-[#FFFFFF]/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-[#132238]/70">{t('checkout.totalCod')}</p>
            <p className="font-display text-base font-extrabold text-[#132238] tabular-nums">
              {priced.totalCod !== null
                ? formatEGP(priced.totalCod, lang)
                : formatEGP(priced.subtotalAfterDiscount, lang)}
            </p>
          </div>
          <Button
            type="submit"
            form="checkout-form"
            variant="primary"
            size="md"
            loading={createOrder.isPending}
          >
            {t('checkout.confirmOrder')}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
