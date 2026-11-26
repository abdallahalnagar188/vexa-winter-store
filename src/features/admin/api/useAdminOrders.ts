import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { OrderStatus } from '@/shared/types/database';
import type { OrderRecord } from '@/shared/types/domain';

function playPing() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // browser autoplay policy requires user gesture
  }
}

export function useAdminOrdersRealtime(soundEnabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
          if (payload.eventType === 'INSERT') {
            const ref = (payload.new as { order_ref?: string })?.order_ref ?? '';
            toast.success(`طلب جديد وصل: ${ref}`);
            if (soundEnabled) playPing();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, soundEnabled]);
}

export function useAdminOrders(statusFilter?: OrderStatus | 'all') {
  return useQuery({
    queryKey: ['admin', 'orders', statusFilter ?? 'all'],
    staleTime: 10_000,
    refetchInterval: 30_000,
    queryFn: async (): Promise<OrderRecord[]> => {
      let query = supabase
        .from('orders')
        .select('*, order_items(*), order_status_history(*)')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as OrderRecord[];
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
      note,
      restock = true,
    }: {
      orderId: string;
      newStatus: OrderStatus;
      note?: string;
      restock?: boolean;
    }) => {
      const { error } = await supabase.rpc('admin_update_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_note: note ?? null,
        p_restock: restock,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateOrderNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, internalNotes }: { orderId: string; internalNotes: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ internal_notes: internalNotes })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}
