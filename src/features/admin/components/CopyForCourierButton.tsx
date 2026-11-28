import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderRecord } from '@/shared/types/domain';
import { buildCourierMessage } from '@/shared/constants/orderStatus';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/components/ui/cn';

interface CopyForCourierButtonProps {
  order: OrderRecord;
  template?: string;
  size?: 'sm' | 'md';
  iconOnly?: boolean;
  className?: string;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

export function CopyForCourierButton({
  order,
  template,
  size = 'sm',
  iconOnly = false,
  className,
}: CopyForCourierButtonProps) {
  const handleCopy = async () => {
    const msg = buildCourierMessage(order, template);
    await copyText(msg);
    toast.success(`تم نسخ بيانات الشحن (${order.order_ref})`);
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        title="نسخ بيانات الشحن للمندوب"
        aria-label="نسخ للمندوب"
        onClick={(e) => {
          e.stopPropagation();
          void handleCopy();
        }}
        className={cn(
          'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-400 hover:text-[#0D1526]',
          className,
        )}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="primary"
      size={size}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        void handleCopy();
      }}
    >
      <Copy className="h-3.5 w-3.5" />
      <span>نسخ للمندوب</span>
    </Button>
  );
}
