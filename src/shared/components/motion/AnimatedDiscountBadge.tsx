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
      animate={{ scale: [0.85, 1.07, 1], opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'inline-flex items-center gap-1 rounded-[2px] bg-[#FF6B1A] px-2.5 py-0.5 text-xs font-extrabold text-white shadow-xs',
        className,
      )}
    >
      {children}
    </motion.span>
  );
}
