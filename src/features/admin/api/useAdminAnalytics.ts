import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DashboardAnalytics } from '@/shared/types/domain';

export type DateRangePreset = 'today' | '7d' | '30d' | 'month';

export function resolveDateRange(preset: DateRangePreset): { startIso: string; endIso: string } {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (preset === '7d') {
    start.setDate(start.getDate() - 6);
  } else if (preset === '30d') {
    start.setDate(start.getDate() - 29);
  } else if (preset === 'month') {
    start.setDate(1);
  }

  return {
    startIso: start.toISOString(),
    endIso: endOfDay.toISOString(),
  };
}

export function useDashboardAnalytics(preset: DateRangePreset) {
  const { startIso, endIso } = resolveDateRange(preset);

  return useQuery({
    queryKey: ['admin', 'analytics', preset],
    staleTime: 20_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<DashboardAnalytics> => {
      const { data, error } = await supabase.rpc('admin_get_dashboard_analytics', {
        p_start_date: startIso,
        p_end_date: endIso,
      });
      if (error) throw error;
      return data as unknown as DashboardAnalytics;
    },
  });
}
