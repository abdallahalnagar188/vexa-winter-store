import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderRecord } from '@/shared/types/domain';
import { buildCourierMessage } from '@/shared/constants/orderStatus';
import { Button } from '@/shared/components/ui/Button';

interface CopyForCourierButtonProps {
  order: OrderRecord;
  template?: string;
  size?: 'sm' | 'md';
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

export function CopyForCourierButton({ order, template, size = 'sm' }: CopyForCourierButtonProps) {
  const handleCopy = async () => {
    const msg = buildCourierMessage(order, template);
    await copyText(msg);
    toast.success(`تم نسخ بيانات الشحن (${order.order_ref})`);
  };

  return (
    <Button
      type="button"
      variant="primary"
      size={size}
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
