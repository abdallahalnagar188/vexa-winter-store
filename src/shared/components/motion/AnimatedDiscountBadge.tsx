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
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 450, damping: 24 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-[#FFD60A] px-2.5 py-1 text-xs font-extrabold text-[#124E3B] shadow-xs',
        className,
      )}
    >
      {children}
    </motion.span>
  );
}
