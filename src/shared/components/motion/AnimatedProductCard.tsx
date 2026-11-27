import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedProductCardProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedProductCard({ children, className }: AnimatedProductCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
