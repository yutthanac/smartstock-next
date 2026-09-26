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

  const totalSales = (dashboard.total_sales ?? 0) > 0 ? (dashboard.total_sales ?? 0) : dashboard.today_sales;
  const totalCost = (dashboard.total_cost ?? 0) > 0 ? (dashboard.total_cost ?? 0) : dashboard.today_cost;
  const totalProfit = (dashboard.total_profit !== undefined) ? dashboard.total_profit : Math.max(0, totalSales - totalCost);
  const totalMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';
  const totalCostPercentage = totalSales > 0 ? ((totalCost / totalSales) * 100).toFixed(1) : '0.0';

  const todaySales = dashboard.today_sales || 0;
  const todayCost = dashboard.today_cost || 0;
  const todayProfit = dashboard.today_profit || 0;
  const todayMargin = dashboard.profit_margin || (todaySales > 0 ? Math.round((todayProfit / todaySales) * 100) : 0);
  const todayCostPercentage =
    todaySales > 0
      ? ((todayCost / todaySales) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="รายงานต้นทุน & กำไร" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Metric Cards (Real Computed Data: All-time & Today) */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2.5 px-0.5">
            ภาพรวมผลกำไรและต้นทุน
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. กำไรทั้งหมด */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">กำไรทั้งหมด (All-time)</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    มาร์จิ้น {totalMargin}%
                  </span>
                </div>
                <div className="text-2xl font-black text-stone-900 mt-2 font-mono tabular-nums tracking-tight">
                  ฿{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-xs text-stone-600 mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between font-mono tabular-nums">
                <span>ยอดขายสะสม</span>
                <span className="font-semibold text-stone-700">฿{totalSales.toLocaleString()}</span>
              </div>
            </div>

            {/* 2. ต้นทุนทั้งหมด */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">ต้นทุนทั้งหมด (All-time)</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                    {totalCostPercentage}% ของยอดขาย
                  </span>
                </div>
                <div className="text-2xl font-black text-stone-900 mt-2 font-mono tabular-nums tracking-tight">
                  ฿{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-xs text-stone-600 mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between font-mono tabular-nums">
                <span>ต้นทุนสูตรอาหารสะสม</span>
                <span className="font-semibold text-stone-700">คำนวณตามจริง</span>
              </div>
            </div>

            {/* 3. กำไรวันนี้ */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">กำไรวันนี้ (Today)</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    มาร์จิ้น {todayMargin}%
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-2 font-mono tabular-nums tracking-tight">
                  ฿{todayProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-xs text-stone-600 mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between font-mono tabular-nums">
                <span>ยอดขายวันนี้</span>
                <span className="font-semibold text-stone-700">฿{todaySales.toLocaleString()}</span>
              </div>
            </div>

            {/* 4. ต้นทุนวันนี้ */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">ต้นทุนวันนี้ (Today)</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    {todayCostPercentage}% ของยอดขาย
                  </span>
                </div>
                <div className="text-2xl font-black text-stone-900 mt-2 font-mono tabular-nums tracking-tight">
                  ฿{todayCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-xs text-stone-600 mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between font-mono tabular-nums">
                <span>มูลค่าสต็อกในคลัง</span>
                <span className="font-semibold text-stone-700">฿{inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
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
