'use client';

import React from 'react';
import { TrendingUp, PieChart, Layers } from 'lucide-react';
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
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar title="รายงานต้นทุน & กำไร" subtitle="สรุปต้นทุนวัตถุดิบและกำไรรายเมนู" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Metric Cards (Real Computed Data) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-normal">สัดส่วนต้นทุนวัตถุดิบ</span>
            <div className="text-2xl font-semibold text-amber-700 mt-1 font-mono">{costPercentage}%</div>
            <div className="text-xs text-slate-400 mt-1 font-normal">จากยอดขายวันนี้ ฿{dashboard.today_sales.toLocaleString()}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-normal">กำไรขั้นต้นวันนี้</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 font-mono">฿{dashboard.today_profit.toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-normal mt-1">อัตรากำไรเฉลี่ย {dashboard.profit_margin}%</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-normal">มูลค่าวัตถุดิบในคลังปัจจุบัน</span>
            <div className="text-2xl font-semibold text-slate-900 mt-1 font-mono">฿{inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-slate-400 mt-1 font-normal">คำนวณจากสต็อกจริง {ingredients.length} รายการ</div>
          </div>
        </div>

        {/* Profitability Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-700" />
            สรุปกำไรและต้นทุนรายเมนู
          </h3>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เมนู</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead className="text-right">ราคาขาย</TableHead>
                  <TableHead className="text-right">ต้นทุน/เสิร์ฟ</TableHead>
                  <TableHead className="text-right">กำไร/เสิร์ฟ</TableHead>
                  <TableHead className="text-right">มาร์จิ้น</TableHead>
                  <TableHead className="text-right">ขายได้วันนี้</TableHead>
                  <TableHead className="text-right">กำไรรวมวันนี้</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.menu_profitability.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-slate-400">
                      ยังไม่มีข้อมูลการขายในวันนี้
                    </TableCell>
                  </TableRow>
                ) : (
                  dashboard.menu_profitability.map((item) => {
                    const todayTotalProfit = item.profit * item.sales_count;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-normal text-slate-900">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="neutral">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-normal text-slate-800 font-mono">฿{item.price}</TableCell>
                        <TableCell className="text-right text-slate-500 font-normal font-mono">฿{item.cost}</TableCell>
                        <TableCell className="text-right font-normal text-slate-800 font-mono">฿{item.profit}</TableCell>
                        <TableCell className="text-right font-normal text-slate-700 font-mono">{item.margin}%</TableCell>
                        <TableCell className="text-right text-slate-600 font-normal font-mono">{item.sales_count}</TableCell>
                        <TableCell className="text-right font-normal text-slate-900 font-mono">฿{todayTotalProfit.toLocaleString()}</TableCell>
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
