import React from 'react';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';

interface LowStockAlertCardProps {
  alerts: DashboardKPI['low_stock_alerts'];
}

export const LowStockAlertCard: React.FC<LowStockAlertCardProps> = ({ alerts }) => {
  return (
    <div className="skeuo-card rounded-3xl p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">แจ้งเตือนวัตถุดิบใกล้หมด</h3>
              <p className="text-sm text-slate-500 mt-0.5 font-normal">วัตถุดิบที่ต่ำกว่าจุดสั่งซื้อขั้นต่ำ (Reorder Point)</p>
            </div>
          </div>
          <Link
            href="/stock"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 skeuo-btn-secondary px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs"
          >
            สั่งซื้อด่วน <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        <div className="space-y-3.5 mt-5">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm font-normal">
              ✅ วัตถุดิบทุกรายการมีเพียงพอต่อการขาย
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl skeuo-inset flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-base">{alert.name}</span>
                  <span className="text-xs font-medium skeuo-badge-rose px-3 py-0.5 rounded-md">
                    เหลือ {alert.current_quantity} {alert.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span className="text-rose-700 font-medium">
                    ⚡ ทำได้อีกประมาณ ~{alert.plates_left} จาน (พอสำหรับ ~{alert.days_left} วัน)
                  </span>
                  <span className="text-slate-400 font-normal">จุดสั่งซื้อ: {alert.reorder_point} {alert.unit}</span>
                </div>

                <div className="text-xs text-slate-500 truncate font-normal">
                  กระทบเมนู: {alert.impact_dishes.join(', ')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100">
        <Link
          href="/stock/purchase-orders"
          className="w-full block text-center py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-medium shadow-xs"
        >
          + สร้างใบสั่งซื้อซัพพลายเออร์ (Purchase Order)
        </Link>
      </div>
    </div>
  );
};
