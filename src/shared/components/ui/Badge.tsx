import type { ReactNode } from 'react';
import { cn } from './cn';

type BadgeVariant = 'accent' | 'primary' | 'beige' | 'muted';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  accent: 'bg-[#FFD60A] text-[#124E3B] font-extrabold',
  primary: 'bg-[#124E3B] text-[#E8E3D5] font-bold',
  beige: 'bg-[#E8E3D5] text-[#124E3B] font-bold',
  muted: 'bg-[#124E3B]/10 text-[#124E3B] font-semibold',
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
