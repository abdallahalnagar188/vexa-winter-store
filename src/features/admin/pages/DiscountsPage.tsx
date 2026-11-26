import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminTiers, useSaveTiersForScope } from '@/features/admin/api/useAdminTiers';
import { useAdminProducts } from '@/features/admin/api/useAdminProducts';
import { TierEditor, type EditableTier } from '@/features/admin/components/TierEditor';
import { calculateCart } from '@/shared/pricing/calculateCart';
import { formatEGP } from '@/lib/format';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Button } from '@/shared/components/ui/Button';

export function DiscountsPage() {
  useDocumentTitle('خصومات الكميات - الإدارة');
  const tiersQuery = useAdminTiers();
  const productsQuery = useAdminProducts(false);
  const saveTiers = useSaveTiersForScope();

  const [globalTiers, setGlobalTiers] = useState<EditableTier[]>([]);
  const [simProductId, setSimProductId] = useState('');
  const [simQty, setSimQty] = useState(2);

  useEffect(() => {
    const globals = (tiersQuery.data ?? []).filter((t) => t.product_id === null);
    setGlobalTiers(
      globals.map((g) => ({
        min_qty: g.min_qty,
        discount_type: g.discount_type,
        value: g.value,
        is_active: g.is_active,
      })),
    );
  }, [tiersQuery.data]);

  useEffect(() => {
    if (!simProductId && productsQuery.data?.[0]) {
      setSimProductId(productsQuery.data[0].id);
    }
  }, [productsQuery.data, simProductId]);

  const handleSaveGlobal = async () => {
    const unique = new Set(globalTiers.map((t) => t.min_qty)).size === globalTiers.length;
    if (!unique) {
      toast.error('يجب أن تكون كميات الشرائح غير مكررة');
      return;
    }
    try {
      await saveTiers.mutateAsync({ productId: null, rows: globalTiers });
      toast.success('تم تحديث شرائح الخصم العامة');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const productsWithOverrides = useMemo(() => {
    const productIds = new Set(
      (tiersQuery.data ?? []).filter((t) => t.product_id !== null).map((t) => t.product_id!),
    );
    return (productsQuery.data ?? []).filter((p) => productIds.has(p.id));
  }, [tiersQuery.data, productsQuery.data]);

  const simProduct = (productsQuery.data ?? []).find((p) => p.id === simProductId);
  const simResult = useMemo(() => {
    if (!simProduct) return null;
    const allPricingTiers = [
      ...globalTiers.map((t) => ({
        productId: null,
        minQty: t.min_qty,
        type: t.discount_type,
        value: t.value,
        isActive: t.is_active,
      })),
      ...(tiersQuery.data ?? [])
        .filter((t) => t.product_id !== null)
        .map((t) => ({
          productId: t.product_id,
          minQty: t.min_qty,
          type: t.discount_type,
          value: t.value,
          isActive: t.is_active,
        })),
    ];

    return calculateCart({
      lines: [
        {
          variantId: 'sim',
          productId: simProduct.id,
          unitPrice: simProduct.base_price,
          quantity: simQty,
        },
      ],
      tiers: allPricingTiers,
      shippingFee: null,
      freeShippingThreshold: 0,
    });
  }, [simProduct, simQty, globalTiers, tiersQuery.data]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#3E452B]">خصومات الكميات (Tiered Discounts)</h1>

      <div className="space-y-4 rounded-2xl border border-[#3E452B]/15 bg-[#EAE6D7] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold">القواعد العامة لكل المنتجات</h2>
            <p className="text-xs text-[#3E452B]/75">
              تطبق على أي منتج لا يمتلك شرائح خاصة به. الشريحة الأعلى فقط هي التي تُطبق.
            </p>
          </div>
          <Button variant="primary" onClick={handleSaveGlobal} loading={saveTiers.isPending}>
            <Save className="h-4 w-4" />
            <span>حفظ القواعد العامة</span>
          </Button>
        </div>

        <TierEditor tiers={globalTiers} onChange={setGlobalTiers} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#3E452B]/15 bg-[#EAE6D7] p-5 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold">محاكي الأسعار المباشر</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={simProductId}
              onChange={(e) => setSimProductId(e.target.value)}
              className="min-h-10 rounded-xl border border-[#3E452B]/20 bg-[#F5F2E8] px-3 text-sm font-bold"
            >
              {(productsQuery.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title_ar} ({formatEGP(p.base_price, 'ar')})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={10}
              value={simQty}
              onChange={(e) => setSimQty(Math.max(1, Number(e.target.value) || 1))}
              className="min-h-10 rounded-xl border border-[#3E452B]/20 bg-[#F5F2E8] px-3 font-display text-sm font-bold"
            />
          </div>
          {simResult && (
            <div className="mt-4 space-y-1.5 rounded-xl bg-[#F5F2E8] p-4 text-sm font-bold">
              <div className="flex justify-between">
                <span>الأصلي:</span>
                <span className="font-display">{formatEGP(simResult.subtotalOriginal, 'ar')}</span>
              </div>
              <div className="flex justify-between text-[#F47B20]">
                <span>الخصم:</span>
                <span className="font-display">-{formatEGP(simResult.discountTotal, 'ar')}</span>
              </div>
              <div className="flex justify-between border-t border-[#3E452B]/15 pt-2 text-base font-extrabold">
                <span>النهائي:</span>
                <span className="font-display">{formatEGP(simResult.subtotalAfterDiscount, 'ar')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#3E452B]/15 bg-[#EAE6D7] p-5 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold">منتجات بشرائح خصم خاصة</h2>
          <p className="mb-3 text-xs text-[#3E452B]/75">
            هذه المنتجات تستخدم قواعدها الخاصة بدلاً من القواعد العامة.
          </p>
          <div className="space-y-2">
            {productsWithOverrides.map((p) => (
              <Link
                key={p.id}
                to={`/admin/products/${p.id}`}
                className="flex items-center justify-between rounded-xl bg-[#F5F2E8] px-3.5 py-2.5 text-sm font-bold hover:bg-[#F47B20]/15"
              >
                <span>{p.title_ar}</span>
                <span className="text-xs text-[#F47B20] underline">تعديل</span>
              </Link>
            ))}
            {productsWithOverrides.length === 0 && (
              <p className="text-xs text-[#3E452B]/65">كل المنتجات تتبع القواعد العامة حالياً.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
