import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import '@/lib/i18n';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster position="top-center" richColors />
      </MotionConfig>
    </QueryClientProvider>
  );
}
