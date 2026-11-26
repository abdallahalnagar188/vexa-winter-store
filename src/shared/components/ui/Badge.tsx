import type { ReactNode } from 'react';
import { cn } from './cn';

type BadgeVariant = 'accent' | 'primary' | 'beige' | 'muted';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  accent: 'bg-[#FF6B1A] text-white font-extrabold',
  primary: 'bg-[#132238] text-[#F4F2EC] font-bold',
  beige: 'bg-[#ECE9E0] text-[#132238] font-bold',
  muted: 'bg-[#132238]/10 text-[#132238] font-semibold',
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
