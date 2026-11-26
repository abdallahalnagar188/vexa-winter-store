import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { checkoutSchema, type CheckoutFormValues } from '@/shared/validation/checkoutSchema';
import { useAdminProducts } from '@/features/admin/api/useAdminProducts';
import { useAdminShipping } from '@/features/admin/api/useAdminShipping';
import { useAdminTiers } from '@/features/admin/api/useAdminTiers';
import { useAdminSettings } from '@/features/admin/api/useAdminSettings';
import { useCreateManualOrder } from '@/features/admin/api/useAdminOrders';
import { buildCartItemKey } from '@/features/cart/cartStore';
import { calculateCart } from '@/shared/pricing/calculateCart';
import { formatEGP } from '@/lib/format';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

interface ManualOrderLine {
  lineKey: string;
  variantId: string;
  productId: string;
  titleAr: string;
  colorName: string;
  size: string;
  unitPrice: number;
  maxStock: number;
  quantity: number;
}

interface ManualOrderDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: (orderId: string, orderRef: string) => void;
}

export function ManualOrderDrawer({ open, onClose, onCreated }: ManualOrderDrawerProps) {
  const productsQuery = useAdminProducts(false);
  const shippingQuery = useAdminShipping();
  const tiersQuery = useAdminTiers();
  const settingsQuery = useAdminSettings();
  const createManualOrder = useCreateManualOrder();

  const [initialStatus, setInitialStatus] = useState<'confirmed' | 'new'>('confirmed');
  const [overrideShipping, setOverrideShipping] = useState(false);
  const [customShippingFee, setCustomShippingFee] = useState(0);

  // Item builder state
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [pickQty, setPickQty] = useState(1);
  const [lines, setLines] = useState<ManualOrderLine[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: '',
      phone: '',
      phone_secondary: '',
      governorate_id: 1,
      city_area: '',
      address_details: '',
      notes: '',
      website: '',
    },
  });

  const activeProducts = useMemo(
    () => (productsQuery.data ?? []).filter((p) => p.is_active && !p.is_archived),
    [productsQuery.data],
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter(
      (p) =>
        p.title_ar.toLowerCase().includes(q) ||
        (p.title_en ?? '').toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q),
    );
  }, [activeProducts, productSearch]);

  const currentProduct = useMemo(
    () => activeProducts.find((p) => p.id === selectedProductId) ?? filteredProducts[0] ?? null,
    [activeProducts, filteredProducts, selectedProductId],
  );

  const availableColors = useMemo(() => {
    if (!currentProduct) return [];
    return Array.from(
      new Set(
        currentProduct.product_variants
          .filter((v) => v.is_active && v.stock > 0)
          .map((v) => v.color_name),
      ),
    );
  }, [currentProduct]);

  const effectiveColor = availableColors.includes(selectedColor)
    ? selectedColor
    : (availableColors[0] ?? '');

  const variantsForColor = useMemo(() => {
    if (!currentProduct || !effectiveColor) return [];
    return currentProduct.product_variants.filter(
      (v) => v.is_active && v.stock > 0 && v.color_name === effectiveColor,
    );
  }, [currentProduct, effectiveColor]);

  const effectiveVariant =
    variantsForColor.find((v) => v.size === selectedSize) ?? variantsForColor[0] ?? null;

  const watchedGovId = watch('governorate_id');
  const activeGovs = useMemo(
    () => (shippingQuery.data ?? []).filter((g) => g.is_active),
    [shippingQuery.data],
  );
  const selectedGov = activeGovs.find((g) => g.id === Number(watchedGovId)) ?? null;

  const pricingTiers = useMemo(
    () =>
      (tiersQuery.data ?? []).map((t) => ({
        productId: t.product_id,
        minQty: t.min_qty,
        type: t.discount_type,
        value: t.value,
        isActive: t.is_active,
      })),
    [tiersQuery.data],
  );

  const priced = useMemo(() => {
    const baseFee = overrideShipping ? Math.max(0, customShippingFee) : (selectedGov?.fee ?? 0);
    const threshold = overrideShipping ? 0 : (settingsQuery.data?.free_shipping_threshold ?? 0);
    return calculateCart({
      lines: lines.map((l) => ({
        lineKey: l.lineKey,
        variantId: l.variantId,
        productId: l.productId,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      })),
      tiers: pricingTiers,
      shippingFee: baseFee,
      freeShippingThreshold: threshold,
    });
  }, [
    lines,
    pricingTiers,
    overrideShipping,
    customShippingFee,
    selectedGov?.fee,
    settingsQuery.data?.free_shipping_threshold,
  ]);

  const handleAddLine = () => {
    if (!currentProduct || !effectiveVariant) {
      toast.error('يرجى اختيار منتج ولون ومقاس متاح في المخزون');
      return;
    }
    const lineKey = buildCartItemKey(
      currentProduct.id,
      effectiveVariant.color_name,
      effectiveVariant.size,
    );
    const maxCap = Math.min(10, effectiveVariant.stock);

    setLines((prev) => {
      const idx = prev.findIndex((l) => l.lineKey === lineKey);
      if (idx >= 0) {
        const next = [...prev];
        const existing = next[idx]!;
        next[idx] = {
          ...existing,
          quantity: Math.min(maxCap, existing.quantity + pickQty),
        };
        return next;
      }
      return [
        ...prev,
        {
          lineKey,
          variantId: effectiveVariant.id,
          productId: currentProduct.id,
          titleAr: currentProduct.title_ar,
          colorName: effectiveVariant.color_name,
          size: effectiveVariant.size,
          unitPrice: currentProduct.base_price,
          maxStock: maxCap,
          quantity: Math.min(maxCap, Math.max(1, pickQty)),
        },
      ];
    });
    setPickQty(1);
  };

  const updateLineQty = (lineKey: string, nextQty: number) => {
    if (nextQty <= 0) {
      setLines((prev) => prev.filter((l) => l.lineKey !== lineKey));
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l.lineKey === lineKey ? { ...l, quantity: Math.min(l.maxStock, nextQty) } : l,
      ),
    );
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    if (lines.length === 0) {
      toast.error('يرجى إضافة قطعة واحدة على الأقل للأوردر');
      return;
    }

    try {
      const res = await createManualOrder.mutateAsync({
        customer_name: values.customer_name,
        phone: values.phone,
        phone_secondary: values.phone_secondary || null,
        governorate_id: values.governorate_id,
        city_area: values.city_area,
        address_details: values.address_details,
        notes: values.notes || null,
        initial_status: initialStatus,
        shipping_fee_override: overrideShipping ? Math.max(0, Math.round(customShippingFee)) : null,
        items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
      });

      reset();
      setLines([]);
      setOverrideShipping(false);
      setInitialStatus('confirmed');
      onClose();
      onCreated(res.order_id, res.order_ref);
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('STOCK_UNAVAILABLE')) {
        toast.error('المخزون المتاح غير كافٍ لبعض القطع المختارة');
      } else {
        toast.error(msg || 'تعذر إنشاء الأوردر اليدوي');
      }
    }
  };

  return (
    <Drawer open={open} onClose={onClose} ariaLabel="إضافة أوردر يدوي">
      <div className="flex items-center justify-between border-b border-[#132238]/12 bg-[#FFFFFF] px-5 py-4 text-[#132238]">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-[#FF6B1A]" />
          <h2 className="text-lg font-black">إضافة أوردر يدوي (واتساب / تليفون)</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[2px] text-[#132238] hover:bg-[#132238]/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form
        id="manual-order-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 space-y-5 overflow-y-auto p-5 text-[#132238]"
      >
        {/* Multi-Variant Product Picker */}
        <div className="space-y-3 rounded-sm border border-[#132238]/15 bg-[#FFFFFF] p-4">
          <h3 className="text-sm font-black">1. اختيار القطع والمقاسات</h3>

          <input
            type="search"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="بحث باسم المنتج..."
            className="min-h-10 w-full rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] px-3 text-xs font-semibold"
          />

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold">المنتج</label>
              <select
                value={currentProduct?.id ?? ''}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setSelectedColor('');
                  setSelectedSize('');
                }}
                className="min-h-10 w-full rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] px-3 text-xs font-bold"
              >
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title_ar} — {formatEGP(p.base_price, 'ar')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold">اللون</label>
              <select
                value={effectiveColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  setSelectedSize('');
                }}
                className="min-h-10 w-full rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] px-3 text-xs font-bold"
              >
                {availableColors.length === 0 && <option value="">لا توجد ألوان متاحة</option>}
                {availableColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold">المقاس (المخزون)</label>
              <select
                value={effectiveVariant?.size ?? ''}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="min-h-10 w-full rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] px-3 font-display text-xs font-bold"
              >
                {variantsForColor.length === 0 && <option value="">نفد المخزون</option>}
                {variantsForColor.map((v) => (
                  <option key={v.id} value={v.size}>
                    {v.size} (متاح: {v.stock})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">الكمية:</span>
              <input
                type="number"
                min={1}
                max={effectiveVariant ? Math.min(10, effectiveVariant.stock) : 10}
                value={pickQty}
                onChange={(e) => setPickQty(Math.max(1, Number(e.target.value) || 1))}
                className="h-9 w-16 rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] text-center font-display text-xs font-bold"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!effectiveVariant}
              onClick={handleAddLine}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>أضف للأوردر</span>
            </Button>
          </div>

          {/* Selected Lines */}
          {lines.length > 0 && (
            <div className="space-y-2 border-t border-[#132238]/12 pt-3">
              {lines.map((line) => {
                const pricedLine = priced.lines.find((pl) => pl.lineKey === line.lineKey);
                return (
                  <div
                    key={line.lineKey}
                    className="flex items-center justify-between gap-2 rounded-[2px] border border-[#132238]/10 bg-[#F4F2EC] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold">{line.titleAr}</p>
                      <p className="text-[11px] text-[#132238]/75">
                        {line.colorName} • {line.size} (الحد: {line.maxStock})
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateLineQty(line.lineKey, line.quantity - 1)}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] hover:bg-[#ECE9E0]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-display font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateLineQty(line.lineKey, line.quantity + 1)}
                        disabled={line.quantity >= line.maxStock}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] hover:bg-[#ECE9E0] disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="w-16 text-end font-display font-black">
                      {formatEGP(pricedLine?.lineTotal ?? line.unitPrice * line.quantity, 'ar')}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateLineQty(line.lineKey, 0)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[2px] text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="space-y-3 rounded-sm border border-[#132238]/15 bg-[#FFFFFF] p-4">
          <h3 className="text-sm font-black">2. بيانات العميل والشحن</h3>

          <Input
            label="الاسم بالكامل"
            {...register('customer_name')}
            error={errors.customer_name ? 'يرجى كتابة الاسم الثلاثي (3 أحرف على الأقل)' : undefined}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="رقم الموبايل"
              dir="ltr"
              placeholder="01012345678"
              {...register('phone')}
              error={errors.phone ? 'أدخل رقم موبايل مصري صحيح (11 رقم)' : undefined}
            />
            <Input
              label="موبايل احتياطي (اختياري)"
              dir="ltr"
              placeholder="01112345678"
              {...register('phone_secondary')}
              error={errors.phone_secondary ? 'رقم موبايل غير صحيح' : undefined}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold">المحافظة</label>
              <select
                {...register('governorate_id', { valueAsNumber: true })}
                className="min-h-11 w-full rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] px-3 text-xs font-bold"
              >
                {activeGovs.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name_ar} ({g.fee} ج.م)
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="المدينة / المنطقة"
              {...register('city_area')}
              error={errors.city_area ? 'يرجى كتابة المدينة أو المنطقة' : undefined}
            />
          </div>

          <Input
            label="العنوان بالتفصيل"
            {...register('address_details')}
            error={errors.address_details ? 'يرجى كتابة العنوان بالتفصيل' : undefined}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="ملاحظات (مثال: طلب واتساب)" {...register('notes')} />
            <div>
              <label className="mb-1 block text-xs font-bold">الحالة الأولية للأوردر</label>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as 'confirmed' | 'new')}
                className="min-h-11 w-full rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] px-3 text-xs font-bold"
              >
                <option value="confirmed">مؤكد (جاهز للشحن)</option>
                <option value="new">جديد (يحتاج مراجعة)</option>
              </select>
            </div>
          </div>

          {/* Shipping Fee Override */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#132238]/10 pt-3 text-xs">
            <label className="flex cursor-pointer items-center gap-2 font-bold">
              <input
                type="checkbox"
                checked={overrideShipping}
                onChange={(e) => setOverrideShipping(e.target.checked)}
                className="h-4 w-4 accent-[#FF6B1A]"
              />
              <span>تعديل سعر الشحن يدوياً (مثل شحن مجاني 0)</span>
            </label>
            {overrideShipping && (
              <input
                type="number"
                min={0}
                value={customShippingFee}
                onChange={(e) => setCustomShippingFee(Math.max(0, Number(e.target.value) || 0))}
                className="h-9 w-24 rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] px-2 font-display font-bold"
              />
            )}
          </div>
        </div>

        {/* Live Pricing Summary */}
        <div className="space-y-1.5 rounded-sm border border-[#132238]/15 bg-[#ECE9E0] p-4 text-xs">
          <div className="flex justify-between">
            <span>الإجمالي قبل الخصم:</span>
            <span className="font-display font-bold">{formatEGP(priced.subtotalOriginal, 'ar')}</span>
          </div>
          {priced.discountTotal > 0 && (
            <div className="flex justify-between font-bold text-[#FF6B1A]">
              <span>خصم الكميات التلقائي:</span>
              <span className="font-display">-{formatEGP(priced.discountTotal, 'ar')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>الشحن:</span>
            <span className="font-display font-bold">
              {priced.shippingFee === 0 ? 'مجاني' : formatEGP(priced.shippingFee ?? 0, 'ar')}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#132238]/15 pt-2 text-sm font-black">
            <span>المطلوب تحصيله (كاش):</span>
            <span className="font-display text-base">
              {formatEGP(priced.totalCod ?? priced.subtotalAfterDiscount, 'ar')}
            </span>
          </div>
        </div>
      </form>

      <div className="border-t border-[#132238]/12 bg-[#FFFFFF] p-4">
        <Button
          type="submit"
          form="manual-order-form"
          variant="primary"
          size="lg"
          loading={createManualOrder.isPending}
          className="w-full"
        >
          تأكيد وإنشاء الأوردر اليدوي
        </Button>
      </div>
    </Drawer>
  );
}
