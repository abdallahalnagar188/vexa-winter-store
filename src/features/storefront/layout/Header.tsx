import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/features/cart/cartStore';
import { useCategories } from '@/features/storefront/api/useCategories';
import { useDir } from '@/shared/hooks/useDir';
import { LanguageToggle } from './LanguageToggle';

export function Header() {
  const { t } = useTranslation();
  const { lang } = useDir();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { data: categories = [] } = useCategories();

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8E3D5]/15 bg-[#124E3B]/95 text-[#E8E3D5] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#E8E3D5] hover:bg-[#0C382A] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-[#E8E3D5]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFD60A] text-sm font-black text-[#124E3B]">
              V
            </span>
            <span>{t('brand')}</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'text-[#FFD60A]' : 'text-[#E8E3D5]/85 hover:text-[#FFD60A]'
            }
          >
            {t('nav.home')}
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              isActive ? 'text-[#FFD60A]' : 'text-[#E8E3D5]/85 hover:text-[#FFD60A]'
            }
          >
            {t('nav.shop')}
          </NavLink>
          {categories.slice(0, 3).map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="text-[#E8E3D5]/75 transition-colors hover:text-[#FFD60A]"
            >
              {lang === 'ar' ? cat.name_ar : cat.name_en}
            </Link>
          ))}
          <NavLink
            to="/track"
            className={({ isActive }) =>
              isActive ? 'text-[#FFD60A]' : 'text-[#E8E3D5]/85 hover:text-[#FFD60A]'
            }
          >
            {t('nav.track')}
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            onClick={openDrawer}
            aria-label={t('nav.cart')}
            className="relative inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#FFD60A] px-3.5 text-sm font-extrabold text-[#124E3B] shadow-sm transition-colors hover:bg-[#E6C000]"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">{t('nav.cart')}</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#124E3B] px-1.5 font-display text-xs font-bold text-[#FFD60A] tabular-nums">
              {totalCount}
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#E8E3D5]/15 bg-[#0C382A] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2 text-sm font-bold">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-[#E8E3D5] hover:bg-[#124E3B]"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-[#E8E3D5] hover:bg-[#124E3B]"
            >
              {t('nav.shop')}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2 text-[#E8E3D5]/80 hover:bg-[#124E3B]"
              >
                {lang === 'ar' ? cat.name_ar : cat.name_en}
              </Link>
            ))}
            <Link
              to="/track"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-[#FFD60A] hover:bg-[#124E3B]"
            >
              {t('nav.track')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
