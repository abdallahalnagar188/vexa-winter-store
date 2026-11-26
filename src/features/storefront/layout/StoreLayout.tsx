import { Outlet } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { envConfigError, isSupabaseConfigured } from '@/lib/supabase';

export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#C5BFA8] text-[#3E452B]">
      {!isSupabaseConfigured && (
        <div className="bg-[#F47B20] px-4 py-2 text-center text-xs font-extrabold text-white">
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Supabase env vars missing ({envConfigError}). Create `.env` from `.env.example`.
          </span>
        </div>
      )}
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
    </div>
  );
}
