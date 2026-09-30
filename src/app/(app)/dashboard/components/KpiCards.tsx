'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Coffee,
  TrendingUp,
} from 'lucide-react';
import { ThaiBaht } from '@/components/icons/ThaiBaht';
import { useAuth } from '@/lib/AuthContext';
import {
  getStoredBreakEvenConfig,
  calculateBreakEven,
  BEP_UPDATED_EVENT,
  isBreakEvenTabEnabled,
  BEP_TAB_TOGGLE_EVENT,
} from '@/lib/breakEven';
import { DashboardKPI } from '@/types';

interface KpiCardsProps {
  dashboard: DashboardKPI;
  view?: 'all' | 'sales-hero' | 'secondary-metrics' | 'hero-layout';
}

export const KpiCards: React.FC<KpiCardsProps> = ({ dashboard, view = 'hero-layout' }) => {
  const { activeStore } = useAuth();
  const storeId = activeStore?.id || 'default';

  // Check if Break-Even feature is published / enabled in settings
  const [isBepEnabled, setIsBepEnabled] = useState<boolean>(() =>
    isBreakEvenTabEnabled(activeStore?.id, activeStore?.menu_config)
  );

  useEffect(() => {
    setIsBepEnabled(isBreakEvenTabEnabled(activeStore?.id, activeStore?.menu_config));
  }, [activeStore?.id, activeStore?.menu_config]);

  useEffect(() => {
    const handleToggle = () => {
      setIsBepEnabled(isBreakEvenTabEnabled(activeStore?.id, activeStore?.menu_config));
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(BEP_TAB_TOGGLE_EVENT, handleToggle);
      window.addEventListener('storage', handleToggle);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(BEP_TAB_TOGGLE_EVENT, handleToggle);
        window.removeEventListener('storage', handleToggle);
      }
    };
  }, [activeStore?.id, activeStore?.menu_config]);

  // Load and listen for Break-Even configuration updates
  const [bepConfig, setBepConfig] = useState(() => getStoredBreakEvenConfig(storeId));

  useEffect(() => {
    const handleUpdate = () => {
      setBepConfig(getStoredBreakEvenConfig(storeId));
    };

    handleUpdate();

    if (typeof window !== 'undefined') {
      window.addEventListener(BEP_UPDATED_EVENT, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(BEP_UPDATED_EVENT, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [storeId]);

  // Break-even calculation
  const { breakEvenCupsDaily } = useMemo(
    () => calculateBreakEven(bepConfig),
    [bepConfig]
  );

  // Exact cup count calculation (sum of item quantities sold today, NOT just bill count)
  const actualCupsToday = useMemo(() => {
    if (typeof dashboard.today_cups_sold === 'number') {
      return dashboard.today_cups_sold;
    }
    if (dashboard.menu_profitability && dashboard.menu_profitability.length > 0) {
      return dashboard.menu_profitability.reduce(
        (sum, item) => sum + (Number(item.sales_count) || 0),
        0
      );
    }
    return dashboard.total_orders_today ?? 0;
  }, [dashboard]);

  const isBreakEvenReached = breakEvenCupsDaily > 0 && actualCupsToday >= breakEvenCupsDaily;
  const progressPercent =
    breakEvenCupsDaily > 0
      ? Math.min(100, Math.round((actualCupsToday / breakEvenCupsDaily) * 100))
      : 0;

  const avgCupsPerOrder =
    (dashboard.total_orders_today ?? 0) > 0
      ? (actualCupsToday / (dashboard.total_orders_today || 1)).toFixed(1)
      : '0';

  // Left Hero Card: ยอดขายวันนี้
  const salesHeroCard = (
    <div className="bg-white rounded-3xl p-6 sm:p-8 relative overflow-hidden group w-full h-full flex flex-col justify-between border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm sm:text-base font-semibold text-stone-700">
            ยอดขายวันนี้
          </span>
        </div>
        {/* Minimalist Tactile Icon Well */}
        <div className="w-11 h-11 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
          <ThaiBaht className="w-5 h-5" />
        </div>
      </div>

      {/* Center Hero Number */}
      <div className="my-auto py-5 sm:py-8 flex flex-col items-center justify-center text-center">
        <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-stone-900 tracking-tight leading-none tabular-nums break-all font-mono">
          {(dashboard.today_sales ?? 0).toLocaleString()}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="pt-5 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            (dashboard.today_sales_change ?? 0) >= 0
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-stone-100 text-stone-700 border border-stone-200'
          }`}
        >
          {(dashboard.today_sales_change ?? 0) >= 0 ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span>
            {(dashboard.today_sales_change ?? 0) > 0
              ? `+${dashboard.today_sales_change}%`
              : `${dashboard.today_sales_change ?? 0}%`}{' '}
            จากเมื่อวาน
          </span>
        </div>
        <span className="text-sm text-stone-500 font-medium font-mono tabular-nums">
          ทั้งหมด <span className="font-semibold text-stone-800">{dashboard.total_orders_today ?? 0}</span> บิล
        </span>
      </div>
    </div>
  );

  // Card 1 (When BEP Enabled): ความคืบหน้าจุดคุ้มทุน
  const progressCard = (
    <div className="bg-white rounded-3xl p-5 sm:p-6 relative overflow-hidden group w-full flex-1 flex flex-col justify-between border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-semibold text-stone-700">
          ความคืบหน้าจุดคุ้มทุน
        </span>
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
            isBreakEvenReached
              ? 'bg-emerald-600 text-white'
              : 'bg-stone-900 text-stone-100'
          }`}
        >
          <Target className="w-5 h-5" />
        </div>
      </div>

      {/* Center Number & Progress Bar */}
      <div className="my-auto py-2">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 font-mono tracking-tight tabular-nums">
            {progressPercent}%
          </span>
          <span className="text-xs font-mono font-medium text-stone-500">
            {actualCupsToday} / {breakEvenCupsDaily} แก้ว
          </span>
        </div>

        {/* Clean Progress Bar */}
        <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200/80 mt-3">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isBreakEvenReached ? 'bg-emerald-600' : 'bg-stone-900'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );

  // Card 2 (When BEP Enabled): จำนวนแก้ววันนี้ (เทียบกับเป้าหมาย BEP)
  const cupsCountCard = (
    <div className="bg-white rounded-3xl p-5 sm:p-6 relative overflow-hidden group w-full flex-1 flex flex-col justify-between border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-semibold text-stone-700">
          จำนวนแก้ววันนี้
        </span>
        <div className="w-10 h-10 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
          <Coffee className="w-5 h-5" />
        </div>
      </div>

      {/* Center Number */}
      <div className="my-auto py-2 flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 font-mono tracking-tight tabular-nums">
          {actualCupsToday}
        </span>
        <span className="text-base sm:text-lg font-bold text-stone-400 font-mono">
          / {breakEvenCupsDaily} แก้ว
        </span>
      </div>

      <div className="text-xs text-stone-400 font-mono">
        เป้าหมายจุดคุ้มทุน {breakEvenCupsDaily} แก้ว
      </div>
    </div>
  );

  // Card 1 (When BEP Disabled): กำไรสุทธิวันนี้
  const profitCard = (
    <div className="bg-white rounded-3xl p-5 sm:p-6 relative overflow-hidden group w-full flex-1 flex flex-col justify-between border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-semibold text-stone-700">
          กำไรสุทธิวันนี้
        </span>
        <div className="w-10 h-10 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Center Number */}
      <div className="my-auto py-2">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 font-mono tracking-tight tabular-nums">
          ฿{(dashboard.today_profit ?? 0).toLocaleString()}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 flex-wrap gap-2">
        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold font-mono tabular-nums">
          มาร์จิ้น {dashboard.profit_margin ?? 0}%
        </span>
        <span className="font-mono tabular-nums text-stone-500">
          ต้นทุน ฿{(dashboard.today_cost ?? 0).toLocaleString()}
        </span>
      </div>
    </div>
  );

  // Card 2 (When BEP Disabled): จำนวนแก้วที่ขายได้วันนี้ (โหมดปกติ)
  const regularCupsCard = (
    <div className="bg-white rounded-3xl p-5 sm:p-6 relative overflow-hidden group w-full flex-1 flex flex-col justify-between border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-semibold text-stone-700">
          จำนวนแก้ววันนี้
        </span>
        <div className="w-10 h-10 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
          <Coffee className="w-5 h-5 text-stone-100" />
        </div>
      </div>

      {/* Center Number */}
      <div className="my-auto py-2 flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 font-mono tracking-tight tabular-nums">
          {actualCupsToday.toLocaleString()}
        </span>
        <span className="text-base sm:text-lg font-bold text-stone-500 font-medium">
          แก้ว
        </span>
      </div>

      {/* Bottom Summary Bar */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 flex-wrap gap-2">
        <span className="bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-0.5 rounded-full font-medium font-mono tabular-nums">
          เฉลี่ย {avgCupsPerOrder} แก้ว/บิล
        </span>
        <span className="font-mono tabular-nums text-stone-500">
          ทั้งหมด <strong className="text-stone-800 font-semibold">{dashboard.total_orders_today ?? 0}</strong> บิล
        </span>
      </div>
    </div>
  );

  if (view === 'sales-hero') {
    return salesHeroCard;
  }

  if (view === 'secondary-metrics') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
        {isBepEnabled ? (
          <>
            {progressCard}
            {cupsCountCard}
          </>
        ) : (
          <>
            {profitCard}
            {regularCupsCard}
          </>
        )}
      </div>
    );
  }

  // Hero layout: Left (Sales Hero) & Right (Card 1 & Card 2)
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <div className="flex">{salesHeroCard}</div>
      <div className="flex flex-col gap-4 sm:gap-5 justify-between">
        {isBepEnabled ? (
          <>
            {progressCard}
            {cupsCountCard}
          </>
        ) : (
          <>
            {profitCard}
            {regularCupsCard}
          </>
        )}
      </div>
    </section>
  );
};

