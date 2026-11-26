import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ruler, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { AnimatedDiscountBadge } from '@/shared/components/motion/AnimatedDiscountBadge';
import { ProductGallery } from '@/features/storefront/components/ProductGallery';
import { VariantPicker } from '@/features/storefront/components/VariantPicker';
import { TierOfferBanner } from '@/features/storefront/components/TierOfferBanner';
import { useProduct } from '@/features/storefront/api/useProduct';
import { useTiers } from '@/features/storefront/api/useTiers';
import { useCartStore } from '@/features/cart/cartStore';
import { calculateCart } from '@/shared/pricing/calculateCart';
import { resolveTiers } from '@/shared/pricing/tiers';
import { useDir } from '@/shared/hooks/useDir';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { formatEGP } from '@/lib/format';
import { trackPixelEvent } from '@/lib/analytics';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PriceTag } from '@/shared/components/ui/PriceTag';
import { QuantityStepper } from '@/shared/components/ui/QuantityStepper';
import { Skeleton } from '@/shared/components/ui/Skeleton';

export function ProductPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { lang } = useDir();
  const productQuery = useProduct(slug);
  const tiersQuery = useTiers();

  const addToCart = useCartStore((s) => s.add);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const cartItems = useCartStore((s) => s.items);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [pickerError, setPickerError] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const product = productQuery.data;
  const title = product
    ? lang === 'ar'
      ? product.title_ar
      : product.title_en || product.title_ar
    : t('nav.shop');
  useDocumentTitle(title);

  useEffect(() => {
    if (!product) return;
    trackPixelEvent('ViewContent', {
      content_ids: [product.id],
      content_name: product.title_en || product.title_ar,
      value: product.base_price,
      currency: 'EGP',
    });
    const firstAvailable = product.product_variants.find((v) => v.stock > 0);
    if (firstAvailable && !selectedColor) {
      setSelectedColor(firstAvailable.color_name);
    }
  }, [product, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedColor || !selectedSize) return null;
    return (
      product.product_variants.find(
        (v) => v.color_name === selectedColor && v.size === selectedSize,
      ) ?? null
    );
  }, [product, selectedColor, selectedSize]);

  const productTiers = useMemo(
    () => (product ? resolveTiers(product.id, tiersQuery.data ?? []) : []),
    [product, tiersQuery.data],
  );

  const existingProductCartQty = useMemo(
    () =>
      product
        ? cartItems
            .filter((i) => i.productId === product.id)
            .reduce((acc, i) => acc + i.quantity, 0)
        : 0,
    [cartItems, product],
  );

  const previewPriced = useMemo(() => {
    if (!product) return null;
    const simulatedLines = [
      ...cartItems
        .filter((i) => i.productId === product.id)
        .map((i) => ({
          variantId: i.variantId,
          productId: product.id,
          unitPrice: product.base_price,
          quantity: i.quantity,
        })),
      {
        variantId: selectedVariant?.id ?? 'preview-current',
        productId: product.id,
        unitPrice: product.base_price,
        quantity: qty,
      },
    ];
    return calculateCart({
      lines: simulatedLines,
      tiers: tiersQuery.data ?? [],
      shippingFee: null,
      freeShippingThreshold: 0,
    });
  }, [product, cartItems, selectedVariant?.id, qty, tiersQuery.data]);

  const groupPreview = product && previewPriced ? previewPriced.groups[product.id] : undefined;

  const handleAdd = () => {
    if (!product) return;
    if (!selectedColor || !selectedSize || !selectedVariant || selectedVariant.stock <= 0) {
      setPickerError(true);
      pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setPickerError(false);
    addToCart(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        quantity: qty,
        snapshot: {
          titleAr: product.title_ar,
          titleEn: product.title_en,
          size: selectedVariant.size,
          colorName: selectedVariant.color_name,
          colorHex: selectedVariant.color_hex,
          imageUrl: product.product_images[0]?.url ?? null,
          slug: product.slug,
        },
      },
      selectedVariant.stock,
    );
    trackPixelEvent('AddToCart', {
      content_ids: [product.id],
      value: product.base_price * qty,
      currency: 'EGP',
    });
    toast.success(t('product.addedToast'));
    openDrawer();
  };

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <Skeleton className="aspect-4/5 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState title={t('catalog.noProducts')} />
      </div>
    );
  }

  const maxOrderQty = selectedVariant ? Math.min(10, Math.max(1, selectedVariant.stock)) : 10;
  const description =
    lang === 'ar' ? product.description_ar : product.description_en || product.description_ar;

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pb-12">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ProductGallery images={product.product_images} title={title} />
        </div>

        <div className="flex flex-col gap-5 rounded-3xl border border-[#3E452B]/15 bg-[#EAE6D7] p-5 text-[#3E452B] shadow-xl sm:p-7 lg:col-span-6">
          <div>
            {product.is_new && (
              <span className="mb-2 inline-block rounded-full bg-[#3E452B] px-3 py-0.5 text-xs font-extrabold text-[#EAE6D7]">
                {t('catalog.newTag')}
              </span>
            )}
            <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
            <div className="mt-3">
              <PriceTag price={product.base_price} size="lg" />
            </div>
          </div>

          <TierOfferBanner
            tiers={productTiers}
            activeMinQty={groupPreview?.appliedTier?.minQty ?? null}
          />

          <div ref={pickerRef} className="space-y-4">
            <VariantPicker
              variants={product.product_variants}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onSelectColor={(c) => {
                setSelectedColor(c);
                setPickerError(false);
              }}
              onSelectSize={(s) => {
                setSelectedSize(s);
                setPickerError(false);
                setQty(1);
              }}
            />

            {pickerError && (
              <p className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-800">
                {t('product.pickVariantError')}
              </p>
            )}

            {selectedVariant && (
              <div className="text-xs font-bold">
                {selectedVariant.stock <= 0 ? (
                  <span className="text-rose-700">{t('product.outOfStock')}</span>
                ) : selectedVariant.stock <= 3 ? (
                  <span className="text-[#F47B20]">
                    {t('product.onlyLeft', { count: selectedVariant.stock })}
                  </span>
                ) : (
                  <span className="text-[#3E452B]">{t('product.inStock')}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#3E452B]/15 pt-4">
            <div>
              <span className="mb-1.5 block text-xs font-bold text-[#3E452B]/75">
                {t('product.quantity')}
              </span>
              <QuantityStepper value={qty} max={maxOrderQty} onChange={setQty} />
            </div>

            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#3E452B] underline"
            >
              <Ruler className="h-4 w-4 text-[#F47B20]" />
              <span>{t('product.sizeGuide')}</span>
            </button>
          </div>

          {groupPreview && (
            <div className="rounded-2xl border border-[#3E452B]/15 bg-[#F5F2E8] p-4">
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#3E452B]/75">
                <span>{t('product.livePreview')}</span>
                {existingProductCartQty > 0 && (
                  <span>{t('product.includesCart', { count: existingProductCartQty })}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <PriceTag
                  price={groupPreview.groupTotal}
                  originalPrice={
                    groupPreview.groupDiscount > 0 ? groupPreview.groupOriginal : undefined
                  }
                  size="lg"
                />
                {groupPreview.groupDiscount > 0 && (
                  <AnimatedDiscountBadge>
                    {t('offers.youSave', {
                      amount: formatEGP(groupPreview.groupDiscount, lang),
                    })}
                  </AnimatedDiscountBadge>
                )}
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={handleAdd}
            className="hidden w-full lg:inline-flex"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>{t('product.addToCart')}</span>
          </Button>

          {description && (
            <div className="border-t border-[#3E452B]/15 pt-4">
              <h2 className="mb-1.5 text-sm font-extrabold">{t('product.description')}</h2>
              <p className="text-sm leading-relaxed text-[#3E452B]/80">{description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky mobile Add to Cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#3E452B]/15 bg-[#EAE6D7]/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold text-[#3E452B]/70">{title}</p>
            <PriceTag
              price={groupPreview?.groupTotal ?? product.base_price * qty}
              originalPrice={
                groupPreview && groupPreview.groupDiscount > 0
                  ? groupPreview.groupOriginal
                  : undefined
              }
              size="sm"
            />
          </div>
          <Button variant="primary" size="md" onClick={handleAdd} className="shrink-0">
            <ShoppingBag className="h-4 w-4" />
            <span>{t('product.addToCart')}</span>
          </Button>
        </div>
      </div>

      <Dialog open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} title={t('product.sizeGuide')}>
        <div className="overflow-x-auto text-sm">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="border-b border-[#3E452B]/20 font-extrabold">
                <th className="p-2">Size</th>
                <th className="p-2">Chest (cm)</th>
                <th className="p-2">Length (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3E452B]/10 font-display">
              <tr><td className="p-2 font-bold">S</td><td>56</td><td>68</td></tr>
              <tr><td className="p-2 font-bold">M</td><td>59</td><td>71</td></tr>
              <tr><td className="p-2 font-bold">L</td><td>62</td><td>74</td></tr>
              <tr><td className="p-2 font-bold">XL</td><td>65</td><td>77</td></tr>
            </tbody>
          </table>
        </div>
      </Dialog>
    </PageTransition>
  );
}
