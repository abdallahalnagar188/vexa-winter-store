import { Outlet } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { envConfigError, isSupabaseConfigured } from '@/lib/supabase';

export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#124E3B] text-[#E8E3D5]">
      {!isSupabaseConfigured && (
        <div className="bg-[#FFD60A] px-4 py-2 text-center text-xs font-extrabold text-[#124E3B]">
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
