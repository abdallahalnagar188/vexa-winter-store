import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/components/ui/cn';

interface AnimatedDiscountBadgeProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedDiscountBadge({ children, className }: AnimatedDiscountBadgeProps) {
  return (
    <motion.span
      layout
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'inline-flex items-center gap-1 rounded-[2px] border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600',
        className,
      )}
    >
      {children}
    </motion.span>
  );
}
