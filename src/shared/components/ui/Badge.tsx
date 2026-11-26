import type { ReactNode } from 'react';
import { cn } from './cn';

type BadgeVariant = 'accent' | 'primary' | 'beige' | 'muted';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  accent: 'bg-[#F47B20] text-white font-extrabold',
  primary: 'bg-[#3E452B] text-[#EAE6D7] font-bold',
  beige: 'bg-[#EAE6D7] text-[#3E452B] font-bold',
  muted: 'bg-[#3E452B]/12 text-[#3E452B] font-semibold',
};

export function Badge({ children, variant = 'accent', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
