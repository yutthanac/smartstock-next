'use client';

import React from 'react';
import { ShoppingBag, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { DashboardKPI } from '@/types';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

interface SalesAnalyticsChartProps {
  sales7days: DashboardKPI['sales_7days'];
}

const chartConfig = {
  sales: {
    label: 'ยอดขาย',
    color: '#059669', // Emerald 600
  },
  cost: {
    label: 'ต้นทุนวัตถุดิบ',
    color: '#94a3b8', // Slate 400
  },
  profit: {
    label: 'กำไร (Profit)',
    color: '#10b981', // Emerald 500
  },
} satisfies ChartConfig;

export const SalesAnalyticsChart: React.FC<SalesAnalyticsChartProps> = ({ sales7days }) => {
  return (
    <section className="skeuo-card rounded-3xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl skeuo-inset flex items-center justify-center text-slate-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
            สถิติยอดขาย & ต้นทุน 7 วันล่าสุด
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-normal ml-11.5">
            แนวโน้มยอดขาย ต้นทุนวัตถุดิบ และกำไรรายวัน
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
          <BarChart
            data={sales7days}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `฿${val / 1000}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value) => [
                    `฿${Number(value).toLocaleString()}`,
                    '',
                  ]}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="sales"
              fill="var(--color-sales)"
              radius={[6, 6, 0, 0]}
              maxBarSize={38}
            />
            <Bar
              dataKey="cost"
              fill="var(--color-cost)"
              radius={[6, 6, 0, 0]}
              maxBarSize={38}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  );
};
