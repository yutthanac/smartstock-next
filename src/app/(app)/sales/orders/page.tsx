'use client';

import React from 'react';
import {
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { TableSkeleton } from '@/components/Skeleton';

export default function OrdersHistoryPage() {
  const { orders, isLoading } = useStock();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="ประวัติออเดอร์ (Order History)" subtitle="รายการบิลสั่งซื้อและบันทึกการตัดสต็อกอัตโนมัติ" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700 shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <span>รายการคำสั่งซื้อทั้งหมด (<span className="font-mono tabular-nums font-bold">{orders.length}</span> บิล)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-transparent border-b border-stone-200 text-stone-900 text-sm font-semibold">
                  <th className="py-3.5 px-4 font-semibold">เลขที่บิล</th>
                  <th className="py-3.5 px-4 font-semibold">โต๊ะ</th>
                  <th className="py-3.5 px-4 font-semibold">เวลา</th>
                  <th className="py-3.5 px-4 font-semibold">รายการสินค้า/เครื่องดื่ม</th>
                  <th className="py-3.5 px-4 text-right font-semibold">ยอดรวม</th>
                  <th className="py-3.5 px-4 text-center font-semibold">วิธีชำระ</th>
                  <th className="py-3.5 px-4 text-center font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <TableSkeleton rows={6} cols={6} />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      ยังไม่มีรายการสั่งซื้อใหม่
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-stone-900 font-mono tabular-nums">{order.order_number}</td>
                      <td className="py-3.5 px-4 font-semibold text-stone-700">{order.table_no}</td>
                      <td className="py-3.5 px-4 text-stone-500 font-mono tabular-nums text-xs">{order.created_at}</td>
                      <td className="py-3.5 px-4 text-stone-800">
                        <div className="space-y-1">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-stone-900">{i.name}</span>
                              <span className="text-stone-500 font-bold font-mono tabular-nums">x{i.quantity}</span>
                              {i.note && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] font-medium">
                                  {i.note}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-stone-900 font-mono tabular-nums text-sm">
                        ฿{order.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200/60 font-medium text-stone-700 text-xs">
                          {order.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ชำระ & ตัดสต็อกแล้ว
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
