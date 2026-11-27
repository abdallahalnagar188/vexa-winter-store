import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/shared/components/ui/Button';
import { VexaLogo } from '@/shared/components/ui/VexaLogo';

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#132238]/12 bg-[#FFFFFF] px-4 text-[#132238] sm:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-[2px] hover:bg-[#132238]/10"
        >
          <Menu className="h-5 w-5" />
        </button>
        <VexaLogo variant="light-bg" className="h-6 w-auto" />
      </div>
      <div className="hidden text-sm font-extrabold lg:block">نظام إدارة المبيعات والمخزون</div>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        <span>تسجيل الخروج</span>
      </Button>
    </header>
  );
}
