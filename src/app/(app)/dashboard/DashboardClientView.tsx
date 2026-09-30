'use client';

import React, { useEffect } from 'react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Skeleton } from '@/components/Skeleton';
import { KpiCards } from './components/KpiCards';
import { SalesAnalyticsChart } from './components/SalesAnalyticsChart';
import { DashboardCalendarDropdown } from './components/DashboardCalendarDropdown';
import { SlidingClock } from '@/components/ui/sliding-number';
import { Clock } from 'lucide-react';
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

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 mx-auto w-full">
        {/* Page Sub-Header: Live Sliding Clock & Calendar Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="h-10 inline-flex items-center gap-2.5 px-3.5 bg-white text-stone-800 border border-stone-200/90 rounded-xl shadow-2xs w-fit">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center text-stone-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="h-4 w-px bg-stone-200" />
            <SlidingClock className="text-sm font-semibold tracking-wider text-stone-900" showSeconds={true} />
          </div>

          <div className="self-end sm:self-auto shrink-0">
            <DashboardCalendarDropdown />
          </div>
        </div>

        {isWaiting ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 space-y-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-48 mx-auto" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 space-y-6">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-16 w-56 mx-auto" />
                <Skeleton className="h-4 w-40" />
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
