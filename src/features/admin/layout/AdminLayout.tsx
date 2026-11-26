import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAdminOrdersRealtime } from '@/features/admin/api/useAdminOrders';

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useAdminOrdersRealtime(true);

  return (
    <div dir="rtl" className="flex min-h-screen bg-[#124E3B] text-[#124E3B]">
      <div className="hidden shrink-0 border-e border-[#E8E3D5]/15 lg:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="relative z-10 h-full">
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1 bg-black/50 backdrop-blur-xs"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-[#F2EFE6]">
        <TopBar onOpenMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
