import React from 'react';
import { ShoppingBag } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardKPI } from '@/types';

interface SalesAnalyticsChartProps {
  sales7days: DashboardKPI['sales_7days'];
}

export const SalesAnalyticsChart: React.FC<SalesAnalyticsChartProps> = ({ sales7days }) => {
  return (
    <section className="skeuo-card rounded-3xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl skeuo-inset flex items-center justify-center text-emerald-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
            สถิติยอดขาย & ต้นทุน 7 วันล่าสุด
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เปรียบเทียบยอดขายรวมกับต้นทุนวัตถุดิบที่ตัดจากสูตรอาหาร (BOM)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 skeuo-badge-green px-3 py-1.5 rounded-xl font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-xs"></span>
            ยอดขาย (Sales)
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 skeuo-btn-secondary px-3 py-1.5 rounded-xl font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            ต้นทุน (Cost)
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sales7days}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `฿${val / 1000}k`} />
            <Tooltip
              formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, '']}
              contentStyle={{
                backgroundColor: '#12312d',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="sales" name="ยอดขาย" fill="#4fb0a5" radius={[6, 6, 0, 0]} maxBarSize={36} />
            <Bar dataKey="cost" name="ต้นทุน" fill="#cbd5e1" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
