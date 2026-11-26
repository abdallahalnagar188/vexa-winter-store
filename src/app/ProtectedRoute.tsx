import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminSession } from '@/features/admin/auth/useAdminSession';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Skeleton } from '@/shared/components/ui/Skeleton';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const sessionQuery = useAdminSession();

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F2EC] p-6 text-center text-[#132238]">
        <div className="max-w-md rounded-2xl bg-[#FFFFFF] p-6 text-[#132238] shadow-lg">
          <h2 className="text-lg font-extrabold">Supabase غير مُعد بعد</h2>
          <p className="mt-2 text-sm">يرجى إضافة بيانات Supabase في ملف `.env` أولاً.</p>
        </div>
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F2EC] p-6">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!sessionQuery.data?.session || !sessionQuery.data.isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
