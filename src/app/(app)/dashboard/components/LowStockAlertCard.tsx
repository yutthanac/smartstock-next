import React from 'react';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';

interface LowStockAlertCardProps {
  alerts: DashboardKPI['low_stock_alerts'];
}

export const LowStockAlertCard: React.FC<LowStockAlertCardProps> = ({ alerts }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">แจ้งเตือนวัตถุดิบใกล้หมด</h3>
              <p className="text-xs text-slate-500">วัตถุดิบที่ต่ำกว่าจุดสั่งซื้อขั้นต่ำ (Reorder Point)</p>
            </div>
          </div>
          <Link
            href="/stock"
            className="text-xs font-semibold text-rose-600 hover:underline flex items-center"
          >
            สั่งซื้อด่วน <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3 mt-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              ✅ วัตถุดิบทุกรายการมีเพียงพอต่อการขาย
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{alert.name}</span>
                  <span className="text-xs font-bold text-rose-600 bg-white px-2.5 py-1 rounded-md border border-rose-200 shadow-2xs">
                    เหลือ {alert.current_quantity} {alert.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="text-rose-700 font-medium">
                    ⚡ ทำได้อีกประมาณ ~{alert.plates_left} จาน (พอสำหรับ ~{alert.days_left} วัน)
                  </span>
                  <span className="text-slate-400">จุดสั่งซื้อ: {alert.reorder_point} {alert.unit}</span>
                </div>

                <div className="text-[11px] text-slate-500 truncate">
                  กระทบเมนู: {alert.impact_dishes.join(', ')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <Link
          href="/stock/purchase-orders"
          className="w-full block text-center py-2.5 rounded-xl bg-[#12312d] text-white hover:bg-[#1a423d] transition-colors text-xs font-bold shadow-sm"
        >
          + สร้างใบสั่งซื้อซัพพลายเออร์ (Purchase Order)
        </Link>
      </div>
    </div>
  );
};
