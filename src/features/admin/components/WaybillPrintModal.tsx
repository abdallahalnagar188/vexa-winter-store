import { useEffect, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { OrderRecord } from '@/shared/types/domain';
import { formatDate, formatEGP } from '@/lib/format';
import { Button } from '@/shared/components/ui/Button';
import { VexaLogo } from '@/shared/components/ui/VexaLogo';

type PaperFormat = 'a6' | 'a4';

interface WaybillPrintModalProps {
  order: OrderRecord | null;
  whatsappNumber?: string;
  onClose: () => void;
}

export function WaybillPrintModal({ order, whatsappNumber, onClose }: WaybillPrintModalProps) {
  const [format, setFormat] = useState<PaperFormat>('a6');

  useEffect(() => {
    if (!order) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  const siteUrl =
    (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://vexa-winter-store.vercel.app');
  const trackUrl = `${siteUrl}/track`;
  const isA6 = format === 'a6';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="طباعة بوليصة الشحن"
    >
      {/* Dynamic @page print rule matching active paper format */}
      <style media="print">
        {`@page { size: ${isA6 ? '100mm 150mm' : 'A4'}; margin: ${isA6 ? '4mm' : '10mm'}; }`}
      </style>

      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-sm border border-[#132238]/20 bg-[#F4F2EC] shadow-2xl">
        {/* Toolbar (Hidden on Print via parent rules) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#132238]/15 bg-[#FFFFFF] px-4 py-3 text-[#132238]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black">معاينة البوليصة ({order.order_ref})</span>
            <div className="flex rounded-[2px] border border-[#132238]/20 bg-[#F4F2EC] p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormat('a6')}
                className={`cursor-pointer rounded-[2px] px-3 py-1 transition-colors ${
                  isA6 ? 'bg-[#132238] text-white' : 'text-[#132238]'
                }`}
              >
                حراري A6 (100×150)
              </button>
              <button
                type="button"
                onClick={() => setFormat('a4')}
                className={`cursor-pointer rounded-[2px] px-3 py-1 transition-colors ${
                  !isA6 ? 'bg-[#132238] text-white' : 'text-[#132238]'
                }`}
              >
                عادي A4
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              <span>طباعة الآن</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[2px] hover:bg-[#132238]/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Pure Black & White High-Contrast Printable Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div
            id="vexa-waybill-print-sheet"
            dir="rtl"
            className={`mx-auto border-[1.5px] border-black bg-white text-black ${
              isA6 ? 'max-w-[390px] p-3 text-[11px]' : 'max-w-[740px] p-6 text-sm'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b-[1.5px] border-black pb-2.5">
              <div>
                <VexaLogo
                  variant="monochrome"
                  className={isA6 ? 'mb-1 h-6 w-auto' : 'mb-1.5 h-8 w-auto'}
                />
                <p className="font-bold">متجر فيكسا للأزياء الشتوية</p>
                {whatsappNumber && (
                  <p className="font-display font-bold" dir="ltr">
                    CS: {whatsappNumber}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-end">
                <div>
                  <p className={`font-display font-black ${isA6 ? 'text-base' : 'text-xl'}`}>
                    {order.order_ref}
                  </p>
                  <p className="text-[10px] font-semibold">{formatDate(order.created_at, 'ar')}</p>
                </div>
                <div className="border border-black p-1">
                  <QRCodeSVG
                    value={trackUrl}
                    size={isA6 ? 48 : 68}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="M"
                  />
                </div>
              </div>
            </div>

            {/* Recipient Box */}
            <div className="mt-2.5 border-[1.5px] border-black p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black pb-1.5">
                <p className={`font-black ${isA6 ? 'text-sm' : 'text-base'}`}>{order.customer_name}</p>
                <p
                  className={`font-display font-black tracking-wide ${
                    isA6 ? 'text-base' : 'text-xl'
                  }`}
                  dir="ltr"
                >
                  {order.phone}
                  {order.phone_secondary ? ` / ${order.phone_secondary}` : ''}
                </p>
              </div>
              <p className="mt-1.5 font-extrabold">
                {order.governorate_name} — {order.city_area}
              </p>
              <p className="mt-0.5 leading-snug font-semibold">{order.address_details}</p>
            </div>

            {/* Order Items Packing Table */}
            <div className="mt-2.5 overflow-hidden border-[1.5px] border-black">
              <table className="w-full border-collapse text-start">
                <thead>
                  <tr className="border-b-[1.5px] border-black bg-black text-white">
                    <th className="p-1.5 font-extrabold">المنتج</th>
                    <th className="p-1.5 font-extrabold">اللون</th>
                    <th className="p-1.5 font-extrabold">المقاس</th>
                    <th className="p-1.5 text-center font-extrabold">الكمية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {(order.order_items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="p-1.5 font-bold">{item.product_title}</td>
                      <td className="p-1.5 font-semibold">{item.color}</td>
                      <td className="p-1.5 font-display font-bold">{item.size}</td>
                      <td className="p-1.5 text-center font-display font-black">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial & Inverted COD Banner */}
            <div className="mt-2.5 border-[1.5px] border-black">
              <div className="grid grid-cols-3 divide-x divide-black border-b-[1.5px] border-black p-1.5 text-center rtl:divide-x-reverse">
                <div>
                  <span className="block text-[10px] font-bold">المنتجات</span>
                  <span className="font-display font-extrabold">
                    {formatEGP(order.subtotal_original, 'ar')}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold">الخصم</span>
                  <span className="font-display font-extrabold">
                    {order.discount_total > 0 ? `-${formatEGP(order.discount_total, 'ar')}` : '0 ج.م'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold">الشحن</span>
                  <span className="font-display font-extrabold">
                    {formatEGP(order.shipping_fee, 'ar')}
                  </span>
                </div>
              </div>
              <div className="bg-black px-3 py-2 text-center text-white">
                <p className={`font-black ${isA6 ? 'text-sm' : 'text-lg'}`}>
                  المبلغ المطلوب تحصيله (كاش): {formatEGP(order.total_cod, 'ar')}
                </p>
              </div>
            </div>

            {/* Notes & Fixed Policy Footer */}
            {order.notes && (
              <div className="mt-2 border border-black p-1.5 font-bold">
                ملاحظات: {order.notes}
              </div>
            )}
            <div className="mt-2.5 border-t border-black pt-1.5 text-center text-[10px] font-bold">
              مسموح بالمعاينة قبل الاستلام • الاستبدال والاسترجاع خلال 14 يوماً
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
