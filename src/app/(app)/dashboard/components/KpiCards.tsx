import React from 'react';
import { PieChart as PieIcon, TrendingUp, RotateCcw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ThaiBaht } from '@/components/icons/ThaiBaht';
import { DashboardKPI } from '@/types';

interface KpiCardsProps {
  dashboard: DashboardKPI;
  view?: 'all' | 'sales-hero' | 'secondary-metrics' | 'hero-layout';
}

export const KpiCards: React.FC<KpiCardsProps> = ({ dashboard, view = 'hero-layout' }) => {
  const salesHeroCard = (
    <div className="bg-white rounded-3xl p-6 sm:p-8 relative overflow-hidden group w-full h-full flex flex-col justify-between border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm sm:text-base font-semibold text-stone-600">
            ยอดขายวันนี้ (Baht)
          </span>
        </div>
        {/* Minimalist Tactile Icon Well */}
        <div className="w-11 h-11 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
          <ThaiBaht className="w-5 h-5" />
        </div>
      </div>

      {/* Center Hero Number - Crisp, High-Contrast Cafe Monochrome */}
      <div className="my-auto py-8 sm:py-10 flex flex-col items-center justify-center text-center">
        <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-stone-900 tracking-tight leading-none tabular-nums">
          {dashboard.today_sales.toLocaleString()}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="pt-5 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          dashboard.today_sales_change >= 0 
            ? 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]' 
            : 'bg-stone-100 text-stone-700 border border-stone-200'
        }`}>
          {dashboard.today_sales_change >= 0 ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span>
            {dashboard.today_sales_change > 0 ? `+${dashboard.today_sales_change}%` : `${dashboard.today_sales_change}%`} จากเมื่อวาน
          </span>
        </div>
        <span className="text-sm text-stone-500 font-medium">
          ทั้งหมด <span className="font-semibold text-stone-800">{dashboard.total_orders_today}</span> บิล
        </span>
      </div>
    </div>
  );

  const costCard = (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-stone-300 shadow-2xs p-5 relative overflow-hidden group flex items-center justify-between gap-4 w-full transition-all">
      <div className="space-y-1.5">
        <span className="text-sm font-semibold text-stone-600 block">
          ต้นทุนวัตถุดิบวันนี้
        </span>
        <div className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight tabular-nums">
          {dashboard.today_cost.toLocaleString()}
        </div>
        <div className="text-sm text-stone-500 font-medium">
          คิดเป็น {((dashboard.today_cost / (dashboard.today_sales || 1)) * 100).toFixed(1)}% ของยอดขาย
        </div>
      </div>
      {/* Refined Uniform Icon Well */}
      <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center justify-center shrink-0 shadow-2xs">
        <PieIcon className="w-5 h-5" />
      </div>
    </div>
  );

  const profitCard = (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-stone-300 shadow-2xs p-5 relative overflow-hidden group flex items-center justify-between gap-4 w-full transition-all">
      <div className="space-y-1.5">
        <span className="text-sm font-semibold text-stone-600 block">
          กำไรสุทธิโดยประมาณ
        </span>
        <div className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight tabular-nums">
          {dashboard.today_profit.toLocaleString()}
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          {/* Warm Wood / Coffee Accent Badge */}
          <span className="bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] px-2.5 py-0.5 rounded-md font-semibold text-xs">
            Margin {dashboard.profit_margin}%
          </span>
          <span className="text-sm text-stone-500 font-medium">กำไรขั้นต้น</span>
        </div>
      </div>
      {/* Refined Uniform Icon Well */}
      <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center justify-center shrink-0 shadow-2xs">
        <TrendingUp className="w-5 h-5" />
      </div>
    </div>
  );

  const refundCard = (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-stone-300 shadow-2xs p-5 relative overflow-hidden group flex items-center justify-between gap-4 w-full transition-all">
      <div className="space-y-1.5">
        <span className="text-sm font-semibold text-stone-600 block">
          ยอดคืนเงินลูกค้า (Refund)
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-rose-600 tracking-tight tabular-nums font-mono">
            ฿{(dashboard.today_refund ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="bg-[#fef2f2] text-[#991b1b] border border-[#fee2e2] px-2.5 py-0.5 rounded-md font-medium text-xs">
            ยกเลิกแล้ว {dashboard.today_cancelled_count ?? 0} บิล
          </span>
        </div>
      </div>
      {/* Refined Uniform Icon Well */}
      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0 shadow-2xs">
        <RotateCcw className="w-5 h-5" />
      </div>
    </div>
  );

  if (view === 'sales-hero') {
    return salesHeroCard;
  }

  if (view === 'secondary-metrics') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
        {costCard}
        {profitCard}
        {refundCard}
      </div>
    );
  }

  // Hero layout: Today's Sales (Left large) and 3 cards vertically stacked on the Right
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left: Big Hero Sales Today Card */}
      <div className="lg:col-span-7 flex">
        {salesHeroCard}
      </div>

      {/* Right: 3 Metric Cards stacked vertically in 1 column */}
      <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
        {costCard}
        {profitCard}
        {refundCard}
      </div>
    </section>
  );
};
