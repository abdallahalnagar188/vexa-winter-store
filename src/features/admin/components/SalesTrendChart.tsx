import { useState } from 'react';
import { formatEGP } from '@/lib/format';
import type { DashboardAnalytics } from '@/shared/types/domain';
import { cn } from '@/shared/components/ui/cn';

interface SalesTrendChartProps {
  series: DashboardAnalytics['series'];
}

function shortDayLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

export function SalesTrendChart({ series }: SalesTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (series.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-[2px] border border-dashed border-[#132238]/15 bg-[#F4F2EC]/50 text-xs font-bold text-[#132238]/60">
        لا توجد بيانات زمنية متاحة لهذه الفترة
      </div>
    );
  }

  const maxRev = Math.max(1, ...series.map((d) => d.total_revenue));
  const maxOrders = Math.max(1, ...series.map((d) => d.orders_count));

  const W = 680;
  const H = 220;
  const padL = 12;
  const padR = 12;
  const padT = 18;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const slotW = innerW / series.length;
  const barW = Math.min(28, Math.max(6, slotW * 0.56));

  const orderPoints = series
    .map((d, idx) => {
      const cx = padL + idx * slotW + slotW / 2;
      const cy = padT + innerH - (d.orders_count / maxOrders) * innerH;
      return `${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(' ');

  const activePoint = hoveredIdx !== null ? series[hoveredIdx] : null;
  const showEveryNthLabel = series.length > 14 ? Math.ceil(series.length / 8) : 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 font-bold text-[#132238]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-[#132238]" />
            <span>المبيعات اليومية (ج.م)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-[#FF6B1A]" />
            <span>عدد الطلبات</span>
          </span>
        </div>

        {activePoint ? (
          <div className="flex flex-wrap items-center gap-3 rounded-[2px] border border-[#132238]/15 bg-[#F4F2EC] px-2.5 py-1 font-display text-[11px] font-bold text-[#132238]">
            <span>{activePoint.date}</span>
            <span className="text-[#132238]">{formatEGP(activePoint.total_revenue, 'ar')}</span>
            <span className="text-[#FF6B1A]">{activePoint.orders_count} طلب</span>
            <span className="text-[#132238]/70">{activePoint.unique_visits} زيارة</span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-[#132238]/55">
            مرر المؤشر على الأعمدة لعرض تفاصيل كل يوم
          </span>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-56 w-full select-none"
          role="img"
          aria-label="مخطط المبيعات والطلبات"
        >
          {/* Horizontal guide lines */}
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const y = padT + innerH * (1 - frac);
            return (
              <line
                key={frac}
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="#132238"
                strokeOpacity="0.08"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Baseline */}
          <line
            x1={padL}
            y1={padT + innerH}
            x2={W - padR}
            y2={padT + innerH}
            stroke="#132238"
            strokeOpacity="0.18"
          />

          {/* Bars (Revenue) */}
          {series.map((d, idx) => {
            const cx = padL + idx * slotW + slotW / 2;
            const barH = d.total_revenue > 0 ? Math.max(3, (d.total_revenue / maxRev) * innerH) : 0;
            const x = cx - barW / 2;
            const y = padT + innerH - barH;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={d.date}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Invisible full-height hover hit zone */}
                <rect x={padL + idx * slotW} y={padT} width={slotW} height={innerH} fill="transparent" />

                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="1"
                  fill={isHovered ? '#FF6B1A' : '#132238'}
                  fillOpacity={isHovered ? 1 : 0.88}
                />

                {idx % showEveryNthLabel === 0 && (
                  <text
                    x={cx}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#132238"
                    fillOpacity={isHovered ? 1 : 0.6}
                  >
                    {shortDayLabel(d.date)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Orders trend polyline */}
          {series.length > 1 && (
            <polyline
              fill="none"
              stroke="#FF6B1A"
              strokeWidth="2.2"
              strokeLinecap="square"
              strokeLinejoin="miter"
              points={orderPoints}
              className="pointer-events-none"
            />
          )}

          {/* Orders count markers */}
          {series.map((d, idx) => {
            const cx = padL + idx * slotW + slotW / 2;
            const cy = padT + innerH - (d.orders_count / maxOrders) * innerH;
            const isHovered = hoveredIdx === idx;
            return (
              <circle
                key={`pt-${d.date}`}
                cx={cx}
                cy={cy}
                r={isHovered ? 4.5 : 3}
                fill={cn(isHovered ? '#132238' : '#FFFFFF')}
                stroke="#FF6B1A"
                strokeWidth="2"
                className="pointer-events-none"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
