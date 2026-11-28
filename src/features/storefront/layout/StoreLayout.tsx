import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import { envConfigError, isSupabaseConfigured } from '@/lib/supabase';
import { trackStorefrontEvent } from '@/lib/storefrontTracker';
import { ScrollToTop } from '@/shared/components/ScrollToTop';

const CartDrawer = lazy(() =>
  import('@/features/cart/CartDrawer').then((m) => ({ default: m.CartDrawer })),
);

export function StoreLayout() {
  const location = useLocation();

  useEffect(() => {
    trackStorefrontEvent('page_view', {
      path: `${location.pathname}${location.search}`,
    });
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F2EC] text-[#132238]">
      <ScrollToTop />
      {!isSupabaseConfigured && (
        <div className="bg-[#FF6B1A] px-4 py-2 text-center text-xs font-extrabold text-white">
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Supabase env vars missing ({envConfigError}). Create `.env` from `.env.example`.
          </span>
        </div>
      )}
      <Header />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
    </div>
  );
}
