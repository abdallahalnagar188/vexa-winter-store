import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutTemplate,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { useAdminOrders } from '@/features/admin/api/useAdminOrders';
import { cn } from '@/shared/components/ui/cn';

const NAV_ITEMS = [
  { to: '/admin', label: 'نظرة عامة', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'الطلبات', icon: ShoppingCart, badge: true },
  { to: '/admin/products', label: 'المنتجات', icon: Package },
  { to: '/admin/homepage', label: 'إدارة الرئيسية', icon: LayoutTemplate },
  { to: '/admin/discounts', label: 'خصومات الكميات', icon: Percent },
  { to: '/admin/shipping', label: 'شحن المحافظات', icon: Truck },
  { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: newOrders = [] } = useAdminOrders('new');

  return (
    <aside className="flex h-full w-64 flex-col bg-[#132238] p-4 text-[#F4F2EC]">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B1A] font-display text-sm font-black text-white">
          V
        </span>
        <div>
          <p className="font-display text-lg font-extrabold leading-none">VEXA Admin</p>
          <p className="text-[11px] text-[#ECE9E0]/70">إدارة المتجر</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center justify-between rounded-xl px-3.5 text-sm font-bold transition-colors',
                  isActive
                    ? 'bg-[#FF6B1A] text-white shadow-sm'
                    : 'text-[#F4F2EC]/85 hover:bg-[#1C314E]',
                )
              }
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </span>
              {item.badge && newOrders.length > 0 && (
                <span className="rounded-full bg-[#132238] px-2 py-0.5 font-display text-xs font-extrabold text-[#FF6B1A] ring-1 ring-[#FF6B1A]">
                  {newOrders.length}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#F4F2EC]/25 text-xs font-bold text-[#F4F2EC] hover:border-[#FF6B1A] hover:text-[#FF6B1A]"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        <span>عرض المتجر</span>
      </a>
    </aside>
  );
}
