'use client';

import React from 'react';
import {
  TrendingUp,
  PieChart,
  Percent,
  Download,
  AlertCircle,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';

export default function ProfitReportPage() {
  const { dashboard } = useStock();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar title="รายงานต้นทุน & กำไร (Cost & Profit Margin)" subtitle="วิเคราะห์ต้นทุนวัตถุดิบ (COGS) และอัตรากำไรต่อเมนู" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">ต้นทุนวัตถุดิบเฉลี่ย (Food Cost %)</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">34.1%</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">เกณฑ์มาตรฐานร้านอาหาร (ไม่เกิน 35%)</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">กำไรขั้นต้นรวม (Gross Profit)</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">฿87,650</div>
            <div className="text-xs text-slate-400 mt-1">มาร์จิ้น 65.9%</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">มูลค่าวัตถุดิบคงเหลือในคลัง</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">฿28,490</div>
            <div className="text-xs text-slate-400 mt-1">หมุนเวียนคลังทุก 4.2 วัน</div>
          </div>
        </div>

        {/* Profitability Breakdown Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#4fb0a5]" />
            สรุปกำไร-ขาดทุนรายเมนู (Dish Profitability Breakdown)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">เมนูอาหาร</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4 text-right">ราคาขาย</th>
                  <th className="py-3 px-4 text-right">ต้นทุนต่อจาน</th>
                  <th className="py-3 px-4 text-right">กำไรต่อจาน</th>
                  <th className="py-3 px-4 text-right">% Margin</th>
                  <th className="py-3 px-4 text-right">ยอดขายสะสม (เดือนนี้)</th>
                  <th className="py-3 px-4 text-right">กำไรรวมสะสม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.menu_profitability.map((item) => {
                  const monthlyQty = item.sales_count * 22;
                  const totalProfit = item.profit * monthlyQty;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{item.category}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">฿{item.price}</td>
                      <td className="py-3.5 px-4 text-right text-amber-700 font-medium">฿{item.cost}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">฿{item.profit}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{item.margin}%</td>
                      <td className="py-3.5 px-4 text-right text-slate-700">{monthlyQty} จาน</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">฿{totalProfit.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
