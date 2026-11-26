import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useDir } from '@/shared/hooks/useDir';

interface AnimatedCartDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

export function AnimatedCartDrawer({
  open,
  onClose,
  children,
  ariaLabel = 'Drawer',
}: AnimatedCartDrawerProps) {
  const { isRtl } = useDir();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const hiddenX = isRtl ? '-100%' : '100%';

  const content = (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0C1626]/70 backdrop-blur-xs"
          />
          <motion.aside
            initial={{ x: hiddenX }}
            animate={{ x: 0 }}
            exit={{ x: hiddenX }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="relative z-10 flex h-dvh w-full max-w-md flex-col bg-[#F4F2EC] text-[#132238] shadow-2xl"
          >
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}
