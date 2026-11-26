import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { usePublicSettings } from '@/features/storefront/api/usePublicSettings';

export function Footer() {
  const { t } = useTranslation();
  const { data } = usePublicSettings();
  const digits = (data?.whatsappNumber || '').replace(/\D/g, '');

  return (
    <footer className="border-t border-[#F4F2EC]/15 bg-[#132238] text-[#F4F2EC]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-display text-xl font-extrabold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B1A] text-xs font-black text-white">
              V
            </span>
            <span>{t('brand')}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#ECE9E0]/80">{t('footer.about')}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-extrabold text-[#FF6B1A]">{t('nav.shop')}</span>
          <Link to="/shop" className="text-[#F4F2EC]/85 hover:text-[#FF6B1A]">
            {t('catalog.title')}
          </Link>
          <Link to="/track" className="text-[#F4F2EC]/85 hover:text-[#FF6B1A]">
            {t('nav.track')}
          </Link>
          <Link to="/cart" className="text-[#F4F2EC]/85 hover:text-[#FF6B1A]">
            {t('nav.cart')}
          </Link>
          <Link to="/admin" className="text-[#ECE9E0]/65 hover:text-[#F4F2EC]">
            {t('nav.admin')}
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p className="text-[#ECE9E0]/85">{t('footer.policies')}</p>
          {digits && (
            <a
              href={`https://wa.me/${digits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#FF6B1A] px-4 py-2.5 font-extrabold text-white transition-colors hover:bg-[#E85A0C]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{t('footer.whatsapp')}</span>
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-[#F4F2EC]/12 px-4 py-4 text-center text-xs text-[#ECE9E0]/70">
        {t('footer.rights')}
      </div>
    </footer>
  );
}
