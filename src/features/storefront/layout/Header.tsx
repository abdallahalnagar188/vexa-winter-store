import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { data: categories = [] } = useCategories();

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const slideOffset = isRtl ? '100%' : '-100%';

  return (
    <header className="sticky top-0 z-40 border-b border-[#F4F2EC]/15 bg-[#132238]/95 text-[#F4F2EC] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#F4F2EC] hover:bg-[#1C314E] md:hidden"
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

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-[#0C1626]/70 backdrop-blur-xs"
            />
            <motion.nav
              initial={{ x: slideOffset }}
              animate={{ x: 0 }}
              exit={{ x: slideOffset }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="relative z-10 flex h-full w-72 max-w-[82vw] flex-col gap-2 bg-[#132238] p-5 text-sm font-bold text-[#F4F2EC] shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between border-b border-[#F4F2EC]/15 pb-3">
                <span className="font-display text-xl font-black text-[#F4F2EC]">{t('brand')}</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#1C314E]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3.5 py-2.5 text-[#F4F2EC] hover:bg-[#1C314E]"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/shop"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3.5 py-2.5 text-[#F4F2EC] hover:bg-[#1C314E]"
              >
                {t('nav.shop')}
              </Link>
              <div className="my-1 border-t border-[#F4F2EC]/15 pt-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-3.5 py-2 text-[#ECE9E0]/85 hover:bg-[#1C314E] hover:text-[#F4F2EC]"
                  >
                    {lang === 'ar' ? cat.name_ar : cat.name_en}
                  </Link>
                ))}
              </div>
              <Link
                to="/track"
                onClick={() => setMobileOpen(false)}
                className="mt-auto rounded-xl bg-[#FF6B1A] px-3.5 py-3 text-center font-extrabold text-white"
              >
                {t('nav.track')}
              </Link>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
