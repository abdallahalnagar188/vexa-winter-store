import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/features/cart/cartStore';
import { useCategories } from '@/features/storefront/api/useCategories';
import { useDir } from '@/shared/hooks/useDir';
import { VexaLogo } from '@/shared/components/ui/VexaLogo';
import { LanguageToggle } from './LanguageToggle';

export function Header() {
  const { t } = useTranslation();
  const { lang, isRtl } = useDir();
  const { pathname, search } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const items = useCartStore((s) => s.items);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { data: categories = [] } = useCategories();

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const headerCategories = categories.filter((c) => c.show_in_header !== false);
  const slideOffset = isRtl ? '100%' : '-100%';

  const closeDrawerCleanly = () => {
    document.body.style.overflow = '';
    setMobileOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = '';
    setMobileOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawerCleanly();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const mobileDrawer = (
    <AnimatePresence>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawerCleanly}
            className="fixed inset-0 bg-[#0C1626]/80"
          />
          <motion.nav
            initial={{ x: slideOffset }}
            animate={{ x: 0 }}
            exit={{ x: slideOffset }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-dvh w-72 max-w-[82vw] flex-col overflow-y-auto bg-[#132238] p-5 text-sm font-bold text-[#F4F2EC] shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#F4F2EC]/15 pb-3.5">
              <VexaLogo variant="dark-bg" className="h-7 w-auto" />
              <button
                type="button"
                onClick={closeDrawerCleanly}
                aria-label="Close menu"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[2px] text-[#F4F2EC] hover:bg-[#1C314E]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <NavLink
                to="/"
                end
                onClick={closeDrawerCleanly}
                className={({ isActive }) =>
                  `rounded-[2px] px-3.5 py-2.5 transition-colors ${
                    isActive
                      ? 'bg-[#FF6B1A] text-white'
                      : 'bg-[#1C314E]/60 text-[#F4F2EC] hover:bg-[#1C314E]'
                  }`
                }
              >
                {t('nav.home')}
              </NavLink>
              <NavLink
                to="/shop"
                onClick={closeDrawerCleanly}
                className={({ isActive }) =>
                  `rounded-[2px] px-3.5 py-2.5 transition-colors ${
                    isActive && !search
                      ? 'bg-[#FF6B1A] text-white'
                      : 'bg-[#1C314E]/60 text-[#F4F2EC] hover:bg-[#1C314E]'
                  }`
                }
              >
                {t('nav.shop')}
              </NavLink>
            </div>

            {headerCategories.length > 0 && (
              <div className="mt-4 border-t border-[#F4F2EC]/15 pt-4">
                <p className="mb-2 px-2 text-xs font-extrabold text-[#ECE9E0]/65">
                  {t('home.shopByCategory')}
                </p>
                <div className="flex flex-col gap-1">
                  {headerCategories.map((cat) => {
                    const activeCat = search.includes(`category=${cat.slug}`);
                    return (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${cat.slug}`}
                        onClick={closeDrawerCleanly}
                        className={`rounded-[2px] px-3.5 py-2.5 transition-colors ${
                          activeCat
                            ? 'bg-[#FF6B1A] text-white'
                            : 'text-[#ECE9E0] hover:bg-[#1C314E] hover:text-white'
                        }`}
                      >
                        {lang === 'ar' ? cat.name_ar : cat.name_en}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-auto border-t border-[#F4F2EC]/15 pt-4">
              <Link
                to="/track"
                onClick={closeDrawerCleanly}
                className="block rounded-[2px] bg-[#FF6B1A] px-3.5 py-3 text-center font-extrabold text-white shadow-sm transition-colors hover:bg-[#E85A0C]"
              >
                {t('nav.track')}
              </Link>
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b text-[#F4F2EC] transition-[background-color,border-color,box-shadow] duration-200 ${
          scrolled
            ? 'border-[#F4F2EC]/20 bg-[#132238]/95 shadow-md backdrop-blur-sm'
            : 'border-[#F4F2EC]/12 bg-[#132238]'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[2px] text-[#F4F2EC] hover:bg-[#1C314E] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" aria-label="VEXA Home" className="flex items-center py-1">
              <VexaLogo variant="dark-bg" className="h-7 w-auto sm:h-8" />
            </Link>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-semibold lg:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'text-[#FF6B1A]' : 'text-[#F4F2EC]/85 hover:text-[#FF6B1A]'
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                isActive ? 'text-[#FF6B1A]' : 'text-[#F4F2EC]/85 hover:text-[#FF6B1A]'
              }
            >
              {t('nav.shop')}
            </NavLink>
            {headerCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="text-[#F4F2EC]/75 transition-colors hover:text-[#FF6B1A]"
              >
                {lang === 'ar' ? cat.name_ar : cat.name_en}
              </Link>
            ))}
            <NavLink
              to="/track"
              className={({ isActive }) =>
                isActive ? 'text-[#FF6B1A]' : 'text-[#F4F2EC]/85 hover:text-[#FF6B1A]'
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
              className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[2px] bg-[#FF6B1A] px-3.5 text-sm font-extrabold text-white transition-colors hover:bg-[#E85A0C] active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.cart')}</span>
              <motion.span
                key={totalCount}
                initial={{ scale: 1.35 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-[2px] bg-[#132238] px-1.5 font-display text-xs font-bold text-[#F4F2EC] tabular-nums"
              >
                {totalCount}
              </motion.span>
            </button>
          </div>
        </div>
      </header>
      {typeof document !== 'undefined' && createPortal(mobileDrawer, document.body)}
    </>
  );
}
