import React from 'react';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';

interface LowStockAlertCardProps {
  alerts: DashboardKPI['low_stock_alerts'];
}

export const LowStockAlertCard: React.FC<LowStockAlertCardProps> = ({ alerts }) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-stone-700" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">แจ้งเตือนวัตถุดิบใกล้หมด</h3>
              <p className="text-sm text-stone-500 mt-0.5 font-normal">วัตถุดิบที่ต่ำกว่าจุดสั่งซื้อขั้นต่ำ (Reorder Point)</p>
            </div>
          </div>
          <Link
            href="/stock"
            className="text-xs font-semibold text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/80 border border-stone-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs transition-colors"
          >
            สั่งซื้อด่วน <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        <div className="space-y-3.5 mt-5">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm font-normal">
              วัตถุดิบทุกรายการมีเพียงพอต่อการขาย
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/70 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 text-base">{alert.name}</span>
                  <span className="text-xs font-semibold bg-[#fef2f2] text-[#991b1b] border border-[#fee2e2] px-3 py-1 rounded-md">
                    เหลือ {alert.current_quantity} {alert.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-stone-600">
                  <span className="text-stone-800 font-medium">
                    ทำได้อีกประมาณ ~{alert.plates_left} จาน (พอสำหรับ ~{alert.days_left} วัน)
                  </span>
                  <span className="text-stone-400 font-normal">จุดสั่งซื้อ: {alert.reorder_point} {alert.unit}</span>
                </div>

                <div className="text-sm text-stone-500 truncate font-normal">
                  กระทบเมนู: {alert.impact_dishes.join(', ')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-stone-100">
        <Link
          href="/stock/purchase-orders"
          className="w-full block text-center py-3 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors text-sm font-semibold shadow-xs"
        >
          + สร้างใบสั่งซื้อซัพพลายเออร์ (Purchase Order)
        </Link>
      </div>
    </div>
  );
};
