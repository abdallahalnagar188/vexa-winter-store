import type { OrderStatus } from '@/shared/types/database';
import { ORDER_STATUS_META } from '@/shared/constants/orderStatus';
import { cn } from '@/shared/components/ui/cn';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[2px] border px-2.5 py-0.5 text-xs font-extrabold',
        meta.badgeClass,
      )}
    >
      {meta.labelAr}
    </span>
  );
}
