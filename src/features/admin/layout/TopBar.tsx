import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/shared/components/ui/Button';

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#132238]/12 bg-[#FFFFFF] px-4 text-[#132238] sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#132238]/10 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden text-sm font-extrabold lg:block">نظام إدارة المبيعات والمخزون</div>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        <span>تسجيل الخروج</span>
      </Button>
    </header>
  );
}
