import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Json, OrderStatus } from '@/shared/types/database';
import type { CustomerRiskStat, OrderRecord } from '@/shared/types/domain';

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
      void qc.invalidateQueries({ queryKey: ['admin', 'customer-risk'] });
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

export interface CreateManualOrderPayload {
  customer_name: string;
  phone: string;
  phone_secondary?: string | null;
  governorate_id: number;
  city_area: string;
  address_details: string;
  notes?: string | null;
  initial_status: 'new' | 'confirmed';
  shipping_fee_override?: number | null;
  items: { variant_id: string; quantity: number }[];
}

export interface CreateManualOrderResult {
  order_id: string;
  order_ref: string;
  total_cod: number;
}

export function useCreateManualOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateManualOrderPayload): Promise<CreateManualOrderResult> => {
      const { data, error } = await supabase.rpc('admin_create_manual_order', {
        p: payload as unknown as Json,
      });
      if (error) throw error;
      return data as CreateManualOrderResult;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'customer-risk'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCustomerRiskStats(phones: string[]) {
  const uniquePhones = Array.from(new Set(phones.filter(Boolean))).sort();
  return useQuery({
    queryKey: ['admin', 'customer-risk', uniquePhones],
    enabled: uniquePhones.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<Record<string, CustomerRiskStat>> => {
      const { data, error } = await supabase.rpc('admin_get_customer_risk_stats', {
        p_phones: uniquePhones,
      });
      if (error) throw error;
      const rows = (data ?? []) as unknown as CustomerRiskStat[];
      const map: Record<string, CustomerRiskStat> = {};
      for (const r of rows) {
        map[r.phone] = r;
      }
      return map;
    },
  });
}
