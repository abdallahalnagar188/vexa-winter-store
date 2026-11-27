import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { usePublicSettings } from '@/features/storefront/api/usePublicSettings';
import { useCategories } from '@/features/storefront/api/useCategories';
import { useDir } from '@/shared/hooks/useDir';
import { VexaLogo } from '@/shared/components/ui/VexaLogo';

export function Footer() {
  const { t } = useTranslation();
  const { lang } = useDir();
  const isAr = lang === 'ar';
  const { data: settings } = usePublicSettings();
  const { data: categories = [] } = useCategories();
  const digits = (settings?.whatsappNumber || '').replace(/\D/g, '');

  return (
    <footer className="border-t border-white/10 bg-[#090E1A] text-white">
      {/* Subtle architectural orange top accent rule */}
      <div className="h-[2px] w-full bg-linear-to-r from-transparent via-[#F97316] to-transparent opacity-80" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
          {/* Column 1: Brand Identity */}
          <div className="space-y-4 lg:col-span-4">
            <Link to="/" aria-label="VEXA Home" className="inline-block">
              <VexaLogo variant="dark-bg" className="h-9 w-auto" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              {t('footer.about')}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-white/15 text-slate-300 transition-colors hover:border-[#F97316] hover:text-[#F97316]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect width="20" height="20" x="2" y="2" rx="4" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-white/15 text-slate-300 transition-colors hover:border-[#F97316] hover:text-[#F97316]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-white/15 text-slate-300 transition-colors hover:border-[#F97316] hover:text-[#F97316]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Shop Categories */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 border-b border-white/10 pb-2 text-xs font-bold uppercase tracking-widest text-white/90">
              {isAr ? 'الأقسام' : 'Shop'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/shop" className="text-slate-300 transition-colors hover:text-[#F97316]">
                  {isAr ? 'كل المنتجات' : 'All Products'}
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/shop?category=${cat.slug}`}
                    className="text-slate-400 transition-colors hover:text-[#F97316]"
                  >
                    {isAr ? cat.name_ar : cat.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 border-b border-white/10 pb-2 text-xs font-bold uppercase tracking-widest text-white/90">
              {isAr ? 'خدمة العملاء' : 'Customer Care'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/track" className="text-slate-300 transition-colors hover:text-[#F97316]">
                  {t('nav.track')}
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-300 transition-colors hover:text-[#F97316]">
                  {t('nav.cart')}
                </Link>
              </li>
              <li className="text-xs text-slate-400">
                {isAr ? 'استبدال خلال 14 يوماً' : '14-Day Sizing Exchange'}
              </li>
              <li className="text-xs text-slate-400">
                {isAr ? 'كاش عند الاستلام — 27 محافظة' : 'Nationwide COD — 27 Govs'}
              </li>
            </ul>
          </div>

          {/* Column 4: Direct Support / WhatsApp */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 border-b border-white/10 pb-2 text-xs font-bold uppercase tracking-widest text-white/90">
              {isAr ? 'تواصل معنا' : 'Need Help?'}
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
              {isAr
                ? 'استفسار عن مقاس أو طلب؟ تواصل معنا مباشرة'
                : 'Questions about sizing or your order? Message us directly.'}
            </p>
            {digits && (
              <a
                href={`https://wa.me/${digits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-[2px] bg-[#F97316] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#EA580C] sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{t('footer.whatsapp')}</span>
              </a>
            )}
          </div>
        </div>

        {/* Clean Bottom Utility Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-slate-400 sm:flex-row">
          <p>
            {isAr
              ? '© 2026 VEXA Egypt. جميع الحقوق محفوظة.'
              : '© 2026 VEXA Egypt. All rights reserved.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[2px] border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">
              {isAr ? 'COD • الدفع عند الاستلام' : 'COD • Cash on Delivery'}
            </span>
            <span className="rounded-[2px] border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">
              {isAr ? 'شحن لـ 27 محافظة' : '27 Governorates Shipping'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
