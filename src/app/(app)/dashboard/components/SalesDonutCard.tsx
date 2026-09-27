'use client';

import React, { useState } from 'react';
import { DonutChart, DonutChartSegment } from '@/components/ui/donut-chart';
import { PieChart as PieChartIcon, TrendingUp, DollarSign } from 'lucide-react';
import { DashboardKPI } from '@/types';

interface SalesDonutCardProps {
  sales7days: DashboardKPI['sales_7days'];
  totalSales: number;
  totalCost: number;
  totalProfit: number;
}

export const SalesDonutCard: React.FC<SalesDonutCardProps> = ({
  sales7days = [],
  totalSales = 0,
  totalCost = 0,
  totalProfit = 0,
}) => {
  const [hovered, setHovered] = useState<DonutChartSegment | null>(null);

  // Profit Margin ratio
  const marginPercent = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;

  const hasSales = totalSales > 0;

  // Segments: Profit vs Cost (or Empty state)
  const segments: DonutChartSegment[] = hasSales
    ? [
        {
          label: 'กำไรสุทธิ',
          value: Math.max(0, totalProfit),
          color: '#1c1917', // Espresso Black
        },
        {
          label: 'ต้นทุนวัตถุดิบ', 
          value: Math.max(0, totalCost),
          color: '#d6d3d1', // Warm Latte Stone
        },
      ]
    : [
        {
          label: 'ยังไม่มียอดขายวันนี้',
          value: 1,
          color: '#e7e5e4', // Stone 200
        },
      ];

  const totalCalculated = hasSales ? segments.reduce((sum, s) => sum + s.value, 0) : 0;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-semibold text-stone-900 text-base flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-center text-stone-700 shadow-2xs">
            <PieChartIcon className="w-5 h-5 text-stone-700" />
          </div>
          สัดส่วนรายได้ & ต้นทุน
        </h3>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fbf7f0] text-[#78350f] border border-[#f0e6d6]">
          กำไร {marginPercent}%
        </span>
      </div>

      {/* Donut Chart Display */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto py-2">
        <div className="flex justify-center shrink-0">
          <DonutChart
            data={segments}
            size={190}
            strokeWidth={22}
            animationDuration={1.2}
            onSegmentHover={setHovered}
            centerContent={
              <div className="text-center px-2">
                <span className="text-[11px] font-medium text-stone-400 block tracking-tight">
                  {hovered ? hovered.label : 'ยอดขายรวม'}
                </span>
                <span className="text-2xl font-bold text-stone-900 block mt-0.5 font-mono tabular-nums leading-none">
                  ฿{hovered && hasSales ? hovered.value.toLocaleString() : totalCalculated.toLocaleString()}
                </span>
                <span className="text-[11px] text-stone-500 font-medium block mt-1">
                  {hasSales
                    ? hovered
                      ? `${Math.round((hovered.value / (totalCalculated || 1)) * 100)}% ของทั้งหมด`
                      : `อัตรากำไร ${marginPercent}%`
                    : 'ยังไม่มีออเดอร์วันนี้'}
                </span>
              </div>
            }
          />
        </div>

        {/* Legend list - Matches reference design */}
        <div className="space-y-4 w-full sm:w-auto min-w-[140px]">
          {hasSales ? (
            segments.map((seg, idx) => {
              const isHighlighted = hovered?.label === seg.label;
              const pct = totalCalculated > 0 ? Math.round((seg.value / totalCalculated) * 100) : 0;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-4 py-1.5 px-2 rounded-xl transition-all ${
                    isHighlighted ? 'bg-stone-100/80 ring-1 ring-stone-200' : 'hover:bg-stone-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div className="text-xs font-semibold text-stone-900 leading-tight">
                      <div>{seg.label === 'กำไรสุทธิ' ? 'กำไร' : 'ต้นทุน'}</div>
                      <div className="text-stone-700 font-normal">{seg.label === 'กำไรสุทธิ' ? 'สุทธิ' : 'วัตถุดิบ'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono tabular-nums font-bold text-stone-900 block text-sm leading-tight">
                      ฿{seg.value.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">({pct}%)</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-stone-400 text-center p-4">
              ยังไม่มีข้อมูลการขายในวันนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
