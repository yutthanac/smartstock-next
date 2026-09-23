'use client';

import React, { useEffect } from 'react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Skeleton } from '@/components/Skeleton';
import { KpiCards } from './components/KpiCards';
import { SalesAnalyticsChart } from './components/SalesAnalyticsChart';
import { DashboardCalendarDropdown } from './components/DashboardCalendarDropdown';
import { DashboardKPI } from '@/types';

interface DashboardClientViewProps {
  initialDashboard?: DashboardKPI | null;
}

export function DashboardClientView({ initialDashboard }: DashboardClientViewProps) {
  const { dashboard, isLoading, hydrateData } = useStock();

  useEffect(() => {
    if (initialDashboard) {
      hydrateData({ dashboard: initialDashboard });
    }
  }, [initialDashboard, hydrateData]);

  // Use initial server data if context is still loading
  const currentDashboard = initialDashboard || dashboard;
  const isWaiting = isLoading && !initialDashboard;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="ภาพรวมร้านค้า" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Page Sub-Header with Top-Right Revenue Calendar Dropdown Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
          <div className="self-end sm:self-auto">
            <DashboardCalendarDropdown />
          </div>
        </div>

        {isWaiting ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200/90 space-y-4">
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
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200/90 space-y-4">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-200/90 space-y-4">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Section 1: KPI Cards */}
            <KpiCards dashboard={currentDashboard} view="hero-layout" />

            {/* Section 2: Chart สถิติยอดขาย & ต้นทุน */}
            <section className="w-full">
              <SalesAnalyticsChart
                sales7days={currentDashboard.sales_7days}
                salesWeekly={currentDashboard.sales_weekly}
                salesMonthly={currentDashboard.sales_monthly}
                salesYearly={currentDashboard.sales_yearly}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
