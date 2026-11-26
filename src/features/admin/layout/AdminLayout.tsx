import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAdminOrdersRealtime } from '@/features/admin/api/useAdminOrders';

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useAdminOrdersRealtime(true);

  return (
    <div dir="rtl" className="flex min-h-screen bg-[#132238] text-[#132238]">
      <div className="hidden shrink-0 border-e border-[#F4F2EC]/15 lg:block">
        <Sidebar />
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="relative z-10 h-full"
            >
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 bg-[#0C1626]/65 backdrop-blur-xs"
            />
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col bg-[#F4F2EC]">
        <TopBar onOpenMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
