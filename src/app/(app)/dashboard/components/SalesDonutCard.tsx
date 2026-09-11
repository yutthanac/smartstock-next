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
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-stone-900 text-base flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700">
              <PieChartIcon className="w-5 h-5" />
            </div>
            สัดส่วนรายได้ & ต้นทุน
          </h3>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
          กำไร {marginPercent}%
        </span>
      </div>

      {/* Donut Chart Display */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        <DonutChart
          data={segments}
          size={210}
          strokeWidth={22}
          animationDuration={1.2}
          onSegmentHover={setHovered}
          centerContent={
            <div className="text-center">
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wider block">
                {hovered ? hovered.label.split(' ')[0] : 'ยอดขายรวม'}
              </span>
              <span className="text-2xl font-bold text-stone-900 block mt-0.5 font-mono tabular-nums">
                ฿{hovered && hasSales ? hovered.value.toLocaleString() : totalCalculated.toLocaleString()}
              </span>
              <span className="text-xs text-stone-600 font-medium block mt-0.5">
                {hasSales
                  ? hovered
                    ? `${Math.round((hovered.value / (totalCalculated || 1)) * 100)}% ของทั้งหมด`
                    : `อัตรากำไร ${marginPercent}%`
                  : 'ยังไม่มีออเดอร์วันนี้'}
              </span>
            </div>
          }
        />

        {/* Legend list */}
        <div className="space-y-3 w-full sm:w-auto">
          {hasSales ? (
            segments.map((seg, idx) => {
              const isHighlighted = hovered?.label === seg.label;
              const pct = totalCalculated > 0 ? Math.round((seg.value / totalCalculated) * 100) : 0;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl transition-all ${
                    isHighlighted ? 'bg-stone-100/90 ring-1 ring-stone-300' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="font-medium text-stone-800">{seg.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono tabular-nums font-semibold text-stone-900 block text-sm">
                        ฿{seg.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-stone-400 font-normal">({pct}%)</span>
                    </div>
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
