'use client';

import React from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  DollarSign,
  Utensils,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';

export default function OrdersHistoryPage() {
  const { orders } = useStock();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar title="ประวัติออเดอร์ (Order History)" subtitle="รายการบิลสั่งซื้อและบันทึกการตัดสต็อกอัตโนมัติ" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#4fb0a5]" />
              รายการคำสั่งซื้อทั้งหมด ({orders.length} บิล)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">เลขที่บิล</th>
                  <th className="py-3 px-4">โต๊ะ</th>
                  <th className="py-3 px-4">เวลา</th>
                  <th className="py-3 px-4">รายการอาหาร</th>
                  <th className="py-3 px-4 text-right">ยอดรวม</th>
                  <th className="py-3 px-4 text-center">วิธีชำระ</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ยังไม่มีรายการสั่งซื้อใหม่
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{order.order_number}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{order.table_no}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{order.created_at}</td>
                      <td className="py-3.5 px-4 text-slate-800">
                        <div className="space-y-1">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{i.name}</span>
                              <span className="text-slate-500 font-bold">x{i.quantity}</span>
                              {i.note && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                  {i.note}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ฿{order.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 font-medium text-slate-700 text-[11px]">
                          {order.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> ชำระ & ตัดสต็อกแล้ว
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
