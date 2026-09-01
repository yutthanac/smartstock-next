'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  PieChart,
} from 'lucide-react';
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar title="รายงานยอดขาย (Sales Reports)" subtitle="รายงานสถิติการขาย รายได้ และบิลออเดอร์" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">ยอดขายสัปดาห์นี้</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">฿133,050</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">+16.4% จากสัปดาห์ก่อน</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">เฉลี่ยต่อบิล (Ticket Size)</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">฿384.30</div>
            <div className="text-xs text-slate-400 mt-1">จาก 346 บิลทั้งหมด</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">ช่วงเวลาขายดีที่สุด</span>
            <div className="text-2xl font-bold text-[#12312d] mt-1">18:00 - 20:30</div>
            <div className="text-xs text-[#4fb0a5] font-semibold mt-1">คิดเป็น 48% ของยอดทั้งวัน</div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#4fb0a5]" />
            แนวโน้มยอดขายรายวัน (Daily Revenue)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.sales_7days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `฿${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, 'ยอดขาย']}
                  contentStyle={{ backgroundColor: '#12312d', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="sales" fill="#4fb0a5" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
