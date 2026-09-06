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
          color: '#059669', // Emerald 600
        },
        {
          label: 'ต้นทุนวัตถุดิบ',
          value: Math.max(0, totalCost),
          color: '#f59e0b', // Amber 500
        },
      ]
    : [
        {
          label: 'ยังไม่มียอดขายวันนี้',
          value: 1,
          color: '#cbd5e1', // Slate 300
        },
      ];

  const totalCalculated = hasSales ? segments.reduce((sum, s) => sum + s.value, 0) : 0;

  return (
    <div className="skeuo-card rounded-3xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl skeuo-inset flex items-center justify-center text-slate-700">
              <PieChartIcon className="w-5 h-5" />
            </div>
            สัดส่วนรายได้ & ต้นทุน
          </h3>
        </div>
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold skeuo-badge-green">
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
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                {hovered ? hovered.label.split(' ')[0] : 'ยอดขายรวม'}
              </span>
              <span className="text-2xl font-bold text-slate-900 block mt-0.5 font-mono">
                ฿{hovered && hasSales ? hovered.value.toLocaleString() : totalCalculated.toLocaleString()}
              </span>
              <span className="text-xs text-slate-600 font-medium block mt-0.5">
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
                  className={`p-3 rounded-2xl transition-all ${
                    isHighlighted ? 'skeuo-inset scale-[1.02]' : 'hover:bg-slate-200/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="font-medium text-slate-800">{seg.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-slate-900 block text-sm">
                        ฿{seg.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-normal">({pct}%)</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-slate-400 text-center p-4">
              ยังไม่มีข้อมูลการขายในวันนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
