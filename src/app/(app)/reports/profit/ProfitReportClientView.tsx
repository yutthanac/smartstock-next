'use client';

import React, { useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { DashboardKPI, Ingredient } from '@/types';

interface ProfitReportClientViewProps {
  initialDashboard?: DashboardKPI | null;
  initialIngredients?: Ingredient[];
}

export function ProfitReportClientView({
  initialDashboard,
  initialIngredients,
}: ProfitReportClientViewProps) {
  const { dashboard: ctxDashboard, ingredients: ctxIngredients, hydrateData } = useStock();

  useEffect(() => {
    if (initialDashboard || initialIngredients) {
      hydrateData({
        dashboard: initialDashboard || undefined,
        ingredients: initialIngredients || undefined,
      });
    }
  }, [initialDashboard, initialIngredients, hydrateData]);

  const dashboard = ctxDashboard || initialDashboard || {
    today_sales: 0,
    today_cost: 0,
    today_profit: 0,
    profit_margin: 0,
    menu_profitability: [],
  };
  const ingredients = ctxIngredients && ctxIngredients.length > 0 ? ctxIngredients : initialIngredients || [];

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
      <Topbar title="รายงานต้นทุน & กำไร" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">
        {/* Metric Cards (Real Computed Data) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs text-stone-500 font-medium">สัดส่วนต้นทุน</span>
            <div className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums">{costPercentage}%</div>
            <div className="text-xs text-stone-400 mt-1 font-mono tabular-nums">จากยอดขาย ฿{dashboard.today_sales.toLocaleString()}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs text-stone-500 font-medium">กำไรวันนี้</span>
            <div className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums">฿{dashboard.today_profit.toLocaleString()}</div>
            <div className="text-xs text-emerald-700 font-semibold mt-1 font-mono tabular-nums">มาร์จิ้น {dashboard.profit_margin}%</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-xs text-stone-500 font-medium">มูลค่าวัตถุดิบคงคลัง</span>
            <div className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums">฿{inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-stone-400 mt-1 font-mono tabular-nums">สต็อกทั้งหมด {ingredients.length} รายการ</div>
          </div>
        </div>

        {/* Profitability Table */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 space-y-4">
          <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-stone-600" />
            สรุปกำไรและต้นทุนรายเมนู
          </h3>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-stone-200 hover:bg-transparent">
                  <TableHead className="text-stone-900 font-semibold">เมนู</TableHead>
                  <TableHead className="text-stone-900 font-semibold">หมวดหมู่</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">ราคาขาย</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">ต้นทุน</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">กำไร</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">มาร์จิ้น</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">ยอดขาย</TableHead>
                  <TableHead className="text-right text-stone-900 font-semibold">กำไรรวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.menu_profitability.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-stone-400">
                      ไม่มีข้อมูลการขายวันนี้
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
                        <TableCell className="text-right font-semibold text-stone-900 font-mono tabular-nums">฿{item.profit}</TableCell>
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
