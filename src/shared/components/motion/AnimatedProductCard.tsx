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
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.28, ease: 'easeOut' },
        },
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
