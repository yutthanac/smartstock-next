'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';

export default function ProfitReportPage() {
  const { dashboard, ingredients } = useStock();

  const inventoryValue = ingredients.reduce(
    (sum, ing) => sum + (Number(ing.quantity) || 0) * (Number(ing.cost_per_unit) || 0),
    0
  );

  const costPercentage =
    dashboard.today_sales > 0
      ? ((dashboard.today_cost / dashboard.today_sales) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="รายงานต้นทุน & กำไร" subtitle="สรุปต้นทุนวัตถุดิบและกำไรรายเมนู" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Metric Cards (Real Computed Data) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs text-stone-500 font-normal">สัดส่วนต้นทุนวัตถุดิบ</span>
            <div className="text-2xl font-bold text-[#78350f] mt-1 font-mono tabular-nums">{costPercentage}%</div>
            <div className="text-xs text-stone-400 mt-1 font-normal">จากยอดขายวันนี้ ฿<span className="font-mono tabular-nums">{dashboard.today_sales.toLocaleString()}</span></div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs text-stone-500 font-normal">กำไรขั้นต้นวันนี้</span>
            <div className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums">฿{dashboard.today_profit.toLocaleString()}</div>
            <div className="text-xs text-[#78350f] font-medium mt-1">อัตรากำไรเฉลี่ย {dashboard.profit_margin}%</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs text-stone-500 font-normal">มูลค่าวัตถุดิบในคลังปัจจุบัน</span>
            <div className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums">฿{inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-stone-400 mt-1 font-normal">คำนวณจากสต็อกจริง <span className="font-mono tabular-nums">{ingredients.length}</span> รายการ</div>
          </div>
        </div>

        {/* Profitability Table */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 space-y-4">
          <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span>สรุปกำไรและต้นทุนรายเมนู</span>
          </h3>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-stone-200 hover:bg-transparent">
                  <TableHead className="text-stone-900 font-semibold">เมนู</TableHead>
                  <TableHead className="text-stone-900 font-semibold">หมวดหมู่</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">ราคาขาย</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">ต้นทุน/เสิร์ฟ</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">กำไร/เสิร์ฟ</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">มาร์จิ้น</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">ขายได้วันนี้</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">กำไรรวมวันนี้</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.menu_profitability.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-stone-400">
                      ยังไม่มีข้อมูลการขายในวันนี้
                    </TableCell>
                  </TableRow>
                ) : (
                  dashboard.menu_profitability.map((item) => {
                    const todayTotalProfit = item.profit * item.sales_count;

                    return (
                      <TableRow key={item.id} className="hover:bg-stone-50/80 transition-colors">
                        <TableCell className="font-semibold text-stone-900">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="neutral" className="border-stone-200 bg-stone-100 text-stone-700">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-stone-900 font-mono tabular-nums">฿{item.price}</TableCell>
                        <TableCell className="text-right text-stone-500 font-normal font-mono tabular-nums">฿{item.cost}</TableCell>
                        <TableCell className="text-right font-medium text-[#78350f] font-mono tabular-nums">฿{item.profit}</TableCell>
                        <TableCell className="text-right font-semibold text-stone-800 font-mono tabular-nums">{item.margin}%</TableCell>
                        <TableCell className="text-right text-stone-600 font-normal font-mono tabular-nums">{item.sales_count}</TableCell>
                        <TableCell className="text-right font-bold text-stone-900 font-mono tabular-nums">฿{todayTotalProfit.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
