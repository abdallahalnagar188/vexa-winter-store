import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  LogOut,
  Menu,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatEGP } from '@/lib/format';
import {
  playOrderNotificationChime,
  requestDesktopNotifPermission,
  unlockOrderAudio,
} from '@/features/admin/utils/orderSound';
import { useAdminNotificationStore } from '@/features/admin/store/notificationStore';
import { Button } from '@/shared/components/ui/Button';
import { VexaLogo } from '@/shared/components/ui/VexaLogo';
import { cn } from '@/shared/components/ui/cn';

function formatRelativeAr(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'الآن';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `منذ ${min} د`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `منذ ${hrs} س`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} ي`;
}

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [bellOpen, setBellOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = useAdminNotificationStore((s) => s.notifications);
  const soundMuted = useAdminNotificationStore((s) => s.soundMuted);
  const desktopNotifEnabled = useAdminNotificationStore((s) => s.desktopNotifEnabled);
  const markRead = useAdminNotificationStore((s) => s.markRead);
  const markAllRead = useAdminNotificationStore((s) => s.markAllRead);
  const toggleSoundMuted = useAdminNotificationStore((s) => s.toggleSoundMuted);
  const setDesktopNotifEnabled = useAdminNotificationStore((s) => s.setDesktopNotifEnabled);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!bellOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBellOpen(false);
    };
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [bellOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate('/admin/login', { replace: true });
  };

  const handleTestSound = () => {
    unlockOrderAudio();
    const ok = playOrderNotificationChime();
    if (ok) toast.success('تم تشغيل نغمة تنبيه الطلبات');
    else toast.error('المتصفح لا يدعم Web Audio API');
  };

  const handleToggleDesktopNotif = async () => {
    if (desktopNotifEnabled) {
      setDesktopNotifEnabled(false);
      toast.success('تم إيقاف إشعارات المتصفح');
      return;
    }
    const granted = await requestDesktopNotifPermission();
    setDesktopNotifEnabled(granted);
    if (granted) {
      toast.success('تم تفعيل إشعارات المتصفح للطلبات الجديدة');
    } else {
      toast.error('يرجى السماح بالإشعارات من إعدادات المتصفح');
    }
  };

  return (
    <header className="relative z-30 flex h-16 items-center justify-between border-b border-[#132238]/12 bg-[#FFFFFF] px-4 text-[#132238] sm:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[2px] hover:bg-[#132238]/10"
        >
          <Menu className="h-5 w-5" />
        </button>
        <VexaLogo variant="light-bg" className="h-6 w-auto" />
      </div>

      <div className="hidden text-sm font-extrabold lg:block">نظام إدارة المبيعات والمخزون</div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Center Bell */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              unlockOrderAudio();
              setBellOpen((v) => !v);
            }}
            aria-label="إشعارات الطلبات"
            className={cn(
              'relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-[2px] border transition-colors',
              bellOpen
                ? 'border-[#132238] bg-[#132238] text-[#F4F2EC]'
                : 'border-[#132238]/18 bg-[#F4F2EC]/60 text-[#132238] hover:border-[#132238]',
            )}
          >
            <Bell className={cn('h-4 w-4', unreadCount > 0 && !bellOpen && 'animate-pulse text-[#FF6B1A]')} />
            {unreadCount > 0 && (
              <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-[2px] bg-[#FF6B1A] px-1 font-display text-[10px] font-black text-white shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute end-0 top-12 z-50 w-80 max-w-[92vw] rounded-sm border border-[#132238]/20 bg-[#FFFFFF] text-[#132238] shadow-2xl sm:w-96">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#132238]/12 bg-[#132238] px-4 py-3 text-[#F4F2EC]">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-[#FF6B1A]" />
                  <span className="text-xs font-black">مركز إشعارات الطلبات ({unreadCount} جديد)</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-[#FF6B1A] hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>تحديد الكل كمقروء</span>
                  </button>
                )}
              </div>

              {/* Sound & Desktop Notification Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#132238]/10 bg-[#F4F2EC]/80 px-3 py-2 text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextMuted = toggleSoundMuted();
                      toast.success(nextMuted ? 'تم كتم صوت التنبيهات' : 'تم تفعيل صوت التنبيهات');
                    }}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1 rounded-[2px] border px-2 py-1 transition-colors',
                      soundMuted
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-[#1F7A4D]/30 bg-[#1F7A4D]/10 text-[#1F7A4D]',
                    )}
                  >
                    {soundMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    <span>{soundMuted ? 'الصوت مكتوم' : 'الصوت مفعّل'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-[2px] border border-[#132238]/20 bg-[#FFFFFF] px-2 py-1 text-[#132238] hover:bg-[#132238] hover:text-white"
                  >
                    <Play className="h-2.5 w-2.5" />
                    <span>تجربة الصوت</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void handleToggleDesktopNotif()}
                  className={cn(
                    'cursor-pointer rounded-[2px] border px-2 py-1 transition-colors',
                    desktopNotifEnabled
                      ? 'border-[#132238] bg-[#132238] text-[#F4F2EC]'
                      : 'border-[#132238]/20 bg-[#FFFFFF] text-[#132238]/80 hover:border-[#132238]',
                  )}
                >
                  {desktopNotifEnabled ? 'إشعارات المتصفح ✓' : 'تفعيل إشعارات المتصفح'}
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 divide-y divide-[#132238]/10 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs font-semibold text-[#132238]/60">
                    لا توجد إشعارات طلبات جديدة حالياً.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        markRead(n.orderId);
                        setBellOpen(false);
                        navigate(`/admin/orders?ref=${encodeURIComponent(n.orderRef)}`);
                      }}
                      className={cn(
                        'flex w-full cursor-pointer items-start justify-between gap-2 px-4 py-3 text-start transition-colors hover:bg-[#F4F2EC]',
                        !n.read && 'bg-[#FF6B1A]/6',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="h-2 w-2 shrink-0 bg-[#FF6B1A]" />}
                          <span className="font-display text-xs font-black text-[#132238]">
                            {n.orderRef}
                          </span>
                          <span className="text-[10px] font-bold text-[#132238]/55">
                            {formatRelativeAr(n.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-bold text-[#132238]">
                          {n.customerName}
                        </p>
                        {n.governorateName && (
                          <p className="text-[11px] text-[#132238]/70">{n.governorateName}</p>
                        )}
                      </div>
                      <span className="shrink-0 font-display text-xs font-black text-[#FF6B1A]">
                        {formatEGP(n.totalCod, 'ar')}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">تسجيل الخروج</span>
        </Button>
      </div>
    </header>
  );
}
