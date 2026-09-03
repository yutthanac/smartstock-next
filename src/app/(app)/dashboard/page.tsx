'use client';

import React from 'react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { KpiCards } from './components/KpiCards';
import { SalesAnalyticsChart } from './components/SalesAnalyticsChart';
import { AiInsightsCard } from './components/AiInsightsCard';
import { LowStockAlertCard } from './components/LowStockAlertCard';
import { MenuProfitabilityTable } from './components/MenuProfitabilityTable';

export default function DashboardPage() {
  const { dashboard } = useStock();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#ebecf0]">
      <Topbar
        title="แดชบอร์ดภาพรวมร้านอาหาร"
        subtitle={`ข้อมูลสรุป ณ วันที่ 1 กันยายน 2026 • ระบบตัดสต็อกอัตโนมัติ BOM`}
      />

      <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* 1. KPI Summary Cards */}
        <KpiCards dashboard={dashboard} />

        {/* 2. 7-Days Sales & Cost Analytics Chart */}
        <SalesAnalyticsChart sales7days={dashboard.sales_7days} />

        {/* 3. 2 Columns: AI Recommendations & Low Stock Alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AiInsightsCard recommendations={dashboard.ai_recommendations} />
          <LowStockAlertCard alerts={dashboard.low_stock_alerts} />
        </section>

        {/* 4. Cost & Profit Margin Per Dish Table */}
        <MenuProfitabilityTable menuProfitability={dashboard.menu_profitability} />
      </main>
    </div>
  );
}
