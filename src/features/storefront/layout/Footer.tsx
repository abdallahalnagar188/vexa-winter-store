import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { usePublicSettings } from '@/features/storefront/api/usePublicSettings';

export function Footer() {
  const { t } = useTranslation();
  const { data } = usePublicSettings();
  const digits = (data?.whatsappNumber || '').replace(/\D/g, '');

  return (
    <footer className="border-t border-[#E8E3D5]/15 bg-[#0C382A] text-[#E8E3D5]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-display text-xl font-extrabold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFD60A] text-xs font-black text-[#124E3B]">
              V
            </span>
            <span>{t('brand')}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#E8E3D5]/75">{t('footer.about')}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-extrabold text-[#FFD60A]">{t('nav.shop')}</span>
          <Link to="/shop" className="text-[#E8E3D5]/80 hover:text-[#FFD60A]">
            {t('catalog.title')}
          </Link>
          <Link to="/track" className="text-[#E8E3D5]/80 hover:text-[#FFD60A]">
            {t('nav.track')}
          </Link>
          <Link to="/cart" className="text-[#E8E3D5]/80 hover:text-[#FFD60A]">
            {t('nav.cart')}
          </Link>
          <Link to="/admin" className="text-[#E8E3D5]/55 hover:text-[#E8E3D5]">
            {t('nav.admin')}
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p className="text-[#E8E3D5]/80">{t('footer.policies')}</p>
          {digits && (
            <a
              href={`https://wa.me/${digits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#FFD60A] px-4 py-2 font-extrabold text-[#124E3B] hover:bg-[#E6C000]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{t('footer.whatsapp')}</span>
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-[#E8E3D5]/10 px-4 py-4 text-center text-xs text-[#E8E3D5]/60">
        {t('footer.rights')}
      </div>
    </footer>
  );
}
