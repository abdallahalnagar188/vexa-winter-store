import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export function useAdminSession() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['admin', 'session'] });
    });
    return () => listener.subscription.unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ['admin', 'session'],
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return { session: null, isAdmin: false };

      const { data: isAdminRow } = await supabase.rpc('is_admin');
      return { session, isAdmin: Boolean(isAdminRow) };
    },
  });
}
