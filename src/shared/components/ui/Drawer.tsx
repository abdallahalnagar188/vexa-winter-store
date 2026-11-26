import type { ReactNode } from 'react';
import { AnimatedCartDrawer } from '@/shared/components/motion/AnimatedCartDrawer';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

export function Drawer({ open, onClose, children, ariaLabel }: DrawerProps) {
  return (
    <AnimatedCartDrawer open={open} onClose={onClose} ariaLabel={ariaLabel}>
      {children}
    </AnimatedCartDrawer>
  );
}
