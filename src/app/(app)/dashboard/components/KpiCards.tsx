import React from 'react';
import { DollarSign, PieChart as PieIcon, TrendingUp, AlertOctagon, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';

interface KpiCardsProps {
  dashboard: DashboardKPI;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ dashboard }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Today's Sales */}
      <div className="skeuo-card-interactive p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            ยอดขายวันนี้
          </span>
          <div className="w-11 h-11 rounded-2xl skeuo-inset flex items-center justify-center text-slate-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-semibold text-slate-900 tracking-tight">
          ฿{dashboard.today_sales.toLocaleString()}
        </div>
        <div className={`flex items-center gap-1.5 mt-3 text-sm font-medium ${
          dashboard.today_sales_change >= 0 ? 'text-slate-800' : 'text-rose-600'
        }`}>
          {dashboard.today_sales_change >= 0 ? (
            <ArrowUpRight className="w-4 h-4 text-slate-700" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          )}
          <span>
            {dashboard.today_sales_change > 0 ? `+${dashboard.today_sales_change}%` : `${dashboard.today_sales_change}%`} จากเมื่อวาน
          </span>
          <span className="text-slate-400 font-normal">({dashboard.total_orders_today} บิล)</span>
        </div>
      </div>

      {/* Card 2: Ingredient Cost */}
      <div className="skeuo-card-interactive p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            ต้นทุนวัตถุดิบวันนี้
          </span>
          <div className="w-11 h-11 rounded-2xl skeuo-inset flex items-center justify-center text-amber-600">
            <PieIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-semibold text-slate-900 tracking-tight">
          ฿{dashboard.today_cost.toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-sm font-normal text-slate-500">
          <span>คิดเป็น {((dashboard.today_cost / (dashboard.today_sales || 1)) * 100).toFixed(1)}% ของยอดขาย</span>
        </div>
      </div>

      {/* Card 3: Net Profit */}
      <div className="skeuo-card-interactive p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            กำไรสุทธิโดยประมาณ
          </span>
          <div className="w-11 h-11 rounded-2xl skeuo-inset flex items-center justify-center text-slate-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-semibold text-slate-900 tracking-tight">
          ฿{dashboard.today_profit.toLocaleString()}
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm">
          <span className="skeuo-badge-green px-3 py-0.5 rounded-full font-medium text-xs">
            Margin {dashboard.profit_margin}%
          </span>
          <span className="text-slate-500 font-normal">กำไรขั้นต้น</span>
        </div>
      </div>

      {/* Card 4: Low Stock Count */}
      <div className="skeuo-card-interactive p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            วัตถุดิบใกล้หมดสต็อก
          </span>
          <div className="w-11 h-11 rounded-2xl skeuo-inset flex items-center justify-center text-rose-600">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-semibold text-rose-600 tracking-tight">
          {dashboard.low_stock_count} <span className="text-base font-normal text-slate-500">รายการ</span>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="skeuo-badge-rose px-2.5 py-0.5 rounded-md font-medium text-xs">ต้องสั่งซื้อด่วน</span>
          <Link href="/stock" className="text-slate-800 hover:text-slate-950 flex items-center font-medium">
            ดูคลัง <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
