import React from 'react';
import { DollarSign, PieChart as PieIcon, TrendingUp, AlertOctagon, ArrowUpRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';

interface KpiCardsProps {
  dashboard: DashboardKPI;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ dashboard }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Today's Sales */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-28 h-28 bg-[#4fb0a5]/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ยอดขายวันนี้
          </span>
          <div className="w-10 h-10 rounded-xl bg-[#4fb0a5]/10 text-[#4fb0a5] flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          ฿{dashboard.today_sales.toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
          <ArrowUpRight className="w-4 h-4" />
          <span>+{dashboard.today_sales_change}% จากเมื่อวาน</span>
          <span className="text-slate-400 font-normal">({dashboard.total_orders_today} บิล)</span>
        </div>
      </div>

      {/* Card 2: Ingredient Cost */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-28 h-28 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ต้นทุนวัตถุดิบวันนี้
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <PieIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          ฿{dashboard.today_cost.toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
          <span>คิดเป็น {((dashboard.today_cost / (dashboard.today_sales || 1)) * 100).toFixed(1)}% ของยอดขาย</span>
        </div>
      </div>

      {/* Card 3: Net Profit */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-28 h-28 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            กำไรสุทธิโดยประมาณ
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-700 tracking-tight">
          ฿{dashboard.today_profit.toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
            Margin {dashboard.profit_margin}%
          </span>
          <span className="text-slate-400 font-normal">กำไรขั้นต้น</span>
        </div>
      </div>

      {/* Card 4: Low Stock Count */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-28 h-28 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            วัตถุดิบใกล้หมดสต็อก
          </span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-600 tracking-tight">
          {dashboard.low_stock_count} <span className="text-sm font-normal text-slate-500">รายการ</span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-rose-600 font-medium">ต้องสั่งซื้อด่วน</span>
          <Link href="/stock" className="text-[#4fb0a5] hover:underline flex items-center font-semibold">
            ดูคลัง <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
};
