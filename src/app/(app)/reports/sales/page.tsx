'use client';

import React from 'react';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';

export default function SalesReportPage() {
  const { dashboard } = useStock();

  const total7DaysSales = (dashboard.sales_7days || []).reduce(
    (sum, d) => sum + (Number(d.sales) || 0),
    0
  );

  const avgDailySales =
    dashboard.sales_7days && dashboard.sales_7days.length > 0
      ? Math.round(total7DaysSales / dashboard.sales_7days.length)
      : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar title="รายงานยอดขาย" subtitle="สถิติยอดขายและรายได้ตามช่วงเวลา" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards (Real Data) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-normal">ยอดขายวันนี้</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 font-mono">
              ฿{dashboard.today_sales.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-normal">จำนวน {dashboard.total_orders_today} ออเดอร์</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-normal">ยอดขายรวม 7 วัน</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 font-mono">
              ฿{total7DaysSales.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-normal">เฉลี่ยวันละ ฿{avgDailySales.toLocaleString()}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-normal">กำไรสุทธิวันนี้</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 font-mono">
              ฿{dashboard.today_profit.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-normal mt-1">
              มาร์จิ้น {dashboard.profit_margin}%
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-700" />
            แนวโน้มยอดขายรายวัน (7 วันล่าสุด)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.sales_7days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `฿${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, 'ยอดขาย']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="sales" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
