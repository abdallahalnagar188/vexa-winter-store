import { bestTier, nextTier, resolveTiers, type PricingTier } from './tiers';

export interface PricedLineInput {
  lineKey?: string;
  variantId: string;
  productId: string;
  unitPrice: number;
  quantity: number;
}

export interface PricedInput {
  lines: PricedLineInput[];
  tiers: PricingTier[];
  shippingFee: number | null; // null until governorate selected
  freeShippingThreshold: number; // 0 = disabled
}

export interface PricedLineOutput {
  lineKey: string;
  variantId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineOriginal: number;
  lineDiscount: number;
  lineTotal: number;
  tierMinQty: number | null;
}

export interface NextTierHint {
  productId: string;
  addQty: number;
  minQty: number;
  type: 'percent' | 'fixed';
  value: number;
}

export interface GroupSummary {
  productId: string;
  totalQty: number;
  groupOriginal: number;
  groupDiscount: number;
  groupTotal: number;
  appliedTier: PricingTier | null;
  nextTierHint: NextTierHint | null;
}

export interface PricedOutput {
  lines: PricedLineOutput[];
  groups: Record<string, GroupSummary>;
  subtotalOriginal: number;
  discountTotal: number;
  subtotalAfterDiscount: number;
  shippingFee: number | null;
  isFreeShipping: boolean;
  totalCod: number | null;
  nextTierHint: NextTierHint | null;
}

/**
 * Pure cart pricing engine. Mirrors PostgreSQL `create_guest_order` & `group_discount` 1:1.
 */
export function calculateCart(input: PricedInput): PricedOutput {
  const byProduct = new Map<string, PricedLineInput[]>();
  const validLines = input.lines
    .map((line) => ({
      ...line,
      unitPrice: Number.isFinite(line.unitPrice) ? Math.max(0, Math.round(line.unitPrice)) : 0,
      quantity: Number.isFinite(line.quantity) ? Math.floor(line.quantity) : 0,
    }))
    .filter((line) => line.quantity > 0);

  for (const line of validLines) {
    const list = byProduct.get(line.productId) ?? [];
    list.push(line);
    byProduct.set(line.productId, list);
  }

  const pricedLineByKey = new Map<string, PricedLineOutput>();
  const groups: Record<string, GroupSummary> = {};
  let subtotalOriginal = 0;
  let discountTotal = 0;
  let globalNextHint: NextTierHint | null = null;

  for (const [productId, groupLines] of byProduct.entries()) {
    // Deterministic sort by variantId / lineKey to match SQL `order by v.id`
    const sorted = [...groupLines].sort((a, b) =>
      (a.lineKey ?? a.variantId).localeCompare(b.lineKey ?? b.variantId),
    );
    const totalQty = sorted.reduce((acc, l) => acc + l.quantity, 0);
    const groupOriginal = sorted.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);

    const scopedTiers = resolveTiers(productId, input.tiers);
    const applied = bestTier(scopedTiers, totalQty);
    const upcoming = nextTier(scopedTiers, totalQty);

    let groupDiscount = 0;
    if (applied && groupOriginal > 0) {
      if (applied.type === 'percent') {
        groupDiscount = Math.round((groupOriginal * applied.value) / 100);
      } else {
        groupDiscount = Math.min(applied.value, groupOriginal);
      }
    }
    groupDiscount = Math.max(0, Math.min(groupOriginal, groupDiscount));

    let remaining = groupDiscount;
    sorted.forEach((line, idx) => {
      const unitPrice = line.unitPrice;
      const lineOriginal = unitPrice * line.quantity;
      const isLast = idx === sorted.length - 1;
      let lineDiscount = isLast
        ? remaining
        : groupOriginal > 0
          ? Math.round((groupDiscount * lineOriginal) / groupOriginal)
          : 0;
      lineDiscount = Math.max(0, Math.min(lineOriginal, lineDiscount));
      remaining -= lineDiscount;

      const key = line.lineKey ?? line.variantId;
      const lineTotal = lineOriginal - lineDiscount;
      pricedLineByKey.set(key, {
        lineKey: key,
        variantId: line.variantId,
        productId,
        quantity: line.quantity,
        unitPrice,
        lineOriginal,
        lineDiscount,
        lineTotal,
        tierMinQty: applied ? applied.minQty : null,
      });
    });

    const hint: NextTierHint | null = upcoming
      ? {
          productId,
          addQty: upcoming.minQty - totalQty,
          minQty: upcoming.minQty,
          type: upcoming.type,
          value: upcoming.value,
        }
      : null;

    if (hint && (!globalNextHint || hint.addQty < globalNextHint.addQty)) {
      globalNextHint = hint;
    }

    groups[productId] = {
      productId,
      totalQty,
      groupOriginal,
      groupDiscount,
      groupTotal: groupOriginal - groupDiscount,
      appliedTier: applied,
      nextTierHint: hint,
    };

    subtotalOriginal += groupOriginal;
    discountTotal += groupDiscount;
  }

  // Preserve original input line order in output array
  const lines: PricedLineOutput[] = validLines
    .map((l) => pricedLineByKey.get(l.lineKey ?? l.variantId)!)
    .filter(Boolean);

  const subtotalAfterDiscount = subtotalOriginal - discountTotal;
  const rawThreshold = Number.isFinite(input.freeShippingThreshold) ? input.freeShippingThreshold : 0;
  const threshold = Math.max(0, Math.round(rawThreshold));
  const isFreeShipping =
    input.shippingFee !== null && threshold > 0 && subtotalAfterDiscount >= threshold;
  const safeShip = input.shippingFee !== null && Number.isFinite(input.shippingFee) ? input.shippingFee : 0;
  const effectiveShipping =
    input.shippingFee === null ? null : isFreeShipping ? 0 : Math.max(0, Math.round(safeShip));
  const totalCod = effectiveShipping === null ? null : subtotalAfterDiscount + effectiveShipping;

  return {
    lines,
    groups,
    subtotalOriginal,
    discountTotal,
    subtotalAfterDiscount,
    shippingFee: effectiveShipping,
    isFreeShipping,
    totalCod,
    nextTierHint: globalNextHint,
  };
}
