'use client';

import React from 'react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { KpiCards } from './components/KpiCards';
import { SalesAnalyticsChart } from './components/SalesAnalyticsChart';
import { SalesDonutCard } from './components/SalesDonutCard';
import { DashboardCalendarDropdown } from './components/DashboardCalendarDropdown';
import { AiInsightsCard } from './components/AiInsightsCard';
import { LowStockAlertCard } from './components/LowStockAlertCard';
import { MenuProfitabilityTable } from './components/MenuProfitabilityTable';

export default function DashboardPage() {
  const { dashboard } = useStock();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#ebecf0]">
      <Topbar
        title="ภาพรวมร้านค้า"
        subtitle="สรุปยอดขาย ต้นทุน และสต็อกสินค้าวันนี้"
      />

      <main className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto w-full">
        {/* Page Sub-Header with Top-Right Revenue Calendar Dropdown Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ภาพรวมสถิติร้านค้า</h1>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              สรุปยอดขาย ต้นทุน วัตถุดิบ และความเคลื่อนไหวประจำวัน
            </p>
          </div>

          {/* Top-Right Calendar Bar */}
          <div className="self-end sm:self-auto">
            <DashboardCalendarDropdown />
          </div>
        </div>

        {/* 1. KPI Summary Cards */}
        <KpiCards dashboard={dashboard} />

        {/* 2. Visual Charts: Recharts Period Filter Chart & Framer-Motion DonutChart */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <SalesAnalyticsChart
              sales7days={dashboard.sales_7days}
              salesWeekly={dashboard.sales_weekly}
              salesMonthly={dashboard.sales_monthly}
              salesYearly={dashboard.sales_yearly}
            />
          </div>
          <div className="lg:col-span-5">
            <SalesDonutCard
              sales7days={dashboard.sales_7days}
              totalSales={dashboard.today_sales}
              totalCost={dashboard.today_cost}
              totalProfit={dashboard.today_profit}
            />
          </div>
        </section>

        {/* 3. AI Insights & Low Stock Alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <AiInsightsCard recommendations={dashboard.ai_recommendations} />
          <LowStockAlertCard alerts={dashboard.low_stock_alerts} />
        </section>

        {/* 4. Cost & Profit Margin Per Dish Table */}
        <MenuProfitabilityTable menuProfitability={dashboard.menu_profitability} />
      </main>
    </div>
  );
}
