'use client';

import React from 'react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Skeleton, CardSkeleton } from '@/components/Skeleton';
import { KpiCards } from './components/KpiCards';
import { SalesAnalyticsChart } from './components/SalesAnalyticsChart';
import { DashboardCalendarDropdown } from './components/DashboardCalendarDropdown';
import { AiInsightsCard } from './components/AiInsightsCard';
import { LowStockAlertCard } from './components/LowStockAlertCard';
import { MenuProfitabilityTable } from './components/MenuProfitabilityTable';

export default function DashboardPage() {
  const { dashboard, isLoading } = useStock();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar
        title="ภาพรวมร้านค้า"
        subtitle="สรุปยอดขาย ต้นทุน และสต็อกสินค้าวันนี้"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Page Sub-Header with Top-Right Revenue Calendar Dropdown Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
          <div className="self-end sm:self-auto">
            <DashboardCalendarDropdown />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Skeleton className="h-36 rounded-3xl" />
                <Skeleton className="h-36 rounded-3xl" />
                <Skeleton className="h-36 rounded-3xl" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Section 1: KPI Cards (ยอดขายวันนี้ใบใหญ่ซ้าย + ต้นทุน/กำไร/สต็อก เรียงด้านขวา) */}
            <KpiCards dashboard={dashboard} view="hero-layout" />

            {/* Section 2: Chart สถิติยอดขาย & ต้นทุน 7 วันล่าสุด เต็มความกว้าง */}
            <section className="w-full">
              <SalesAnalyticsChart
                sales7days={dashboard.sales_7days}
                salesWeekly={dashboard.sales_weekly}
                salesMonthly={dashboard.sales_monthly}
                salesYearly={dashboard.sales_yearly}
              />
            </section>

            {/* Section 3: AI Insights & Low Stock Alerts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <AiInsightsCard recommendations={dashboard.ai_recommendations} />
              <LowStockAlertCard alerts={dashboard.low_stock_alerts} />
            </section>

            {/* Section 4: Cost & Profit Margin Per Dish Table */}
            <MenuProfitabilityTable menuProfitability={dashboard.menu_profitability} />
          </>
        )}
      </main>
    </div>
  );
}
