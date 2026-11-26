import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { usePublicSettings } from '@/features/storefront/api/usePublicSettings';

export function Footer() {
  const { t } = useTranslation();
  const { data } = usePublicSettings();
  const digits = (data?.whatsappNumber || '').replace(/\D/g, '');

  return (
    <footer className="border-t border-[#C5BFA8]/20 bg-[#3E452B] text-[#EAE6D7]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-display text-xl font-extrabold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#F47B20] text-xs font-black text-white">
              V
            </span>
            <span>{t('brand')}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#C5BFA8]">{t('footer.about')}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-extrabold text-[#F47B20]">{t('nav.shop')}</span>
          <Link to="/shop" className="text-[#EAE6D7]/85 hover:text-[#F47B20]">
            {t('catalog.title')}
          </Link>
          <Link to="/track" className="text-[#EAE6D7]/85 hover:text-[#F47B20]">
            {t('nav.track')}
          </Link>
          <Link to="/cart" className="text-[#EAE6D7]/85 hover:text-[#F47B20]">
            {t('nav.cart')}
          </Link>
          <Link to="/admin" className="text-[#C5BFA8]/75 hover:text-[#EAE6D7]">
            {t('nav.admin')}
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p className="text-[#C5BFA8]">{t('footer.policies')}</p>
          {digits && (
            <a
              href={`https://wa.me/${digits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#F47B20] px-4 py-2.5 font-extrabold text-white transition-colors hover:bg-[#DC6812]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{t('footer.whatsapp')}</span>
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-[#C5BFA8]/15 px-4 py-4 text-center text-xs text-[#C5BFA8]/80">
        {t('footer.rights')}
      </div>
    </footer>
  );
}
