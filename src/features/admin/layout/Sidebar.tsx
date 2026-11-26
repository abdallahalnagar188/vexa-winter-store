import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
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
  { to: '/admin/discounts', label: 'خصومات الكميات', icon: Percent },
  { to: '/admin/shipping', label: 'شحن المحافظات', icon: Truck },
  { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: newOrders = [] } = useAdminOrders('new');

  return (
    <aside className="flex h-full w-64 flex-col bg-[#124E3B] p-4 text-[#E8E3D5]">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD60A] font-display text-sm font-black text-[#124E3B]">
          V
        </span>
        <div>
          <p className="font-display text-lg font-extrabold leading-none">VEXA Admin</p>
          <p className="text-[11px] text-[#E8E3D5]/65">إدارة المتجر</p>
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
                    ? 'bg-[#FFD60A] text-[#124E3B] shadow-sm'
                    : 'text-[#E8E3D5]/85 hover:bg-[#0C382A]',
                )
              }
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </span>
              {item.badge && newOrders.length > 0 && (
                <span className="rounded-full bg-[#124E3B] px-2 py-0.5 font-display text-xs font-extrabold text-[#FFD60A]">
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
        className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#E8E3D5]/25 text-xs font-bold text-[#E8E3D5] hover:border-[#FFD60A] hover:text-[#FFD60A]"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        <span>عرض المتجر</span>
      </a>
    </aside>
  );
}
