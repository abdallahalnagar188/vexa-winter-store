import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/features/cart/cartStore';
import { useCategories } from '@/features/storefront/api/useCategories';
import { useDir } from '@/shared/hooks/useDir';
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
  const slideOffset = isRtl ? '100%' : '-100%';

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const mobileDrawer = (
    <AnimatePresence>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-[#0C1626]/75 backdrop-blur-xs"
          />
          <motion.nav
            initial={{ x: slideOffset }}
            animate={{ x: 0 }}
            exit={{ x: slideOffset }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="relative z-10 flex h-dvh w-72 max-w-[82vw] flex-col overflow-y-auto bg-[#132238] p-5 text-sm font-bold text-[#F4F2EC] shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#F4F2EC]/15 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B1A] font-display text-xs font-black text-white">
                  V
                </span>
                <span className="font-display text-xl font-black text-[#F4F2EC]">
                  {t('brand')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-[#F4F2EC] hover:bg-[#1C314E]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <NavLink
                to="/"
                end
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2.5 transition-colors ${
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
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2.5 transition-colors ${
                    isActive && !search
                      ? 'bg-[#FF6B1A] text-white'
                      : 'bg-[#1C314E]/60 text-[#F4F2EC] hover:bg-[#1C314E]'
                  }`
                }
              >
                {t('nav.shop')}
              </NavLink>
            </div>

            {categories.length > 0 && (
              <div className="mt-4 border-t border-[#F4F2EC]/15 pt-4">
                <p className="mb-2 px-2 text-xs font-extrabold text-[#ECE9E0]/65">
                  {t('home.shopByCategory')}
                </p>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => {
                    const activeCat = search.includes(`category=${cat.slug}`);
                    return (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-xl px-3.5 py-2.5 transition-colors ${
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
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl bg-[#FF6B1A] px-3.5 py-3 text-center font-extrabold text-white shadow-sm transition-colors hover:bg-[#E85A0C]"
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
            ? 'border-[#F4F2EC]/20 bg-[#132238]/90 shadow-md backdrop-blur-md'
            : 'border-[#F4F2EC]/12 bg-[#132238]'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-[#F4F2EC] hover:bg-[#1C314E] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-[#F4F2EC]"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B1A] text-sm font-black text-white shadow-xs">
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
            {categories.slice(0, 3).map((cat) => (
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
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={openDrawer}
              aria-label={t('nav.cart')}
              className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#FF6B1A] px-3.5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#E85A0C]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.cart')}</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#132238] px-1.5 font-display text-xs font-bold text-[#F4F2EC] tabular-nums">
                {totalCount}
              </span>
            </motion.button>
          </div>
        </div>
      </header>
      {typeof document !== 'undefined' && createPortal(mobileDrawer, document.body)}
    </>
  );
}
