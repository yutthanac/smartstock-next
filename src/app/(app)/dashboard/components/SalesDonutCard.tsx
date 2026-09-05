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

  // Segments: Profit vs Cost (or Breakdown)
  const segments: DonutChartSegment[] = [
    {
      label: 'กำไรสุทธิ',
      value: totalProfit > 0 ? totalProfit : 32500,
      color: '#059669', // Emerald 600
    },
    {
      label: 'ต้นทุนวัตถุดิบ',
      value: totalCost > 0 ? totalCost : 16200,
      color: '#f59e0b', // Amber 500
    },
    {
      label: 'ค่าดำเนินการ & จิปาถะ',
      value: 5800,
      color: '#64748b', // Slate 500
    },
  ];

  const totalCalculated = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="skeuo-card rounded-3xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl skeuo-inset flex items-center justify-center text-emerald-700">
              <PieChartIcon className="w-4 h-4" />
            </div>
            สัดส่วนรายได้ & ต้นทุน
          </h3>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold skeuo-badge-green">
          กำไร {marginPercent || 62}%
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
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {hovered ? hovered.label.split(' ')[0] : 'ยอดขายรวม'}
              </span>
              <span className="text-xl font-black text-slate-900 block mt-0.5 font-mono">
                ฿{hovered ? hovered.value.toLocaleString() : totalCalculated.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                {hovered
                  ? `${Math.round((hovered.value / totalCalculated) * 100)}% ของทั้งหมด`
                  : `อัตรากำไร ~${marginPercent || 62}%`}
              </span>
            </div>
          }
        />

        {/* Legend list */}
        <div className="space-y-3 w-full sm:w-auto">
          {segments.map((seg, idx) => {
            const isHighlighted = hovered?.label === seg.label;
            const pct = Math.round((seg.value / totalCalculated) * 100);
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-2xl transition-all ${
                  isHighlighted ? 'skeuo-inset scale-[1.02]' : 'hover:bg-slate-200/40'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="font-bold text-slate-800">{seg.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 block">
                      ฿{seg.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">({pct}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
