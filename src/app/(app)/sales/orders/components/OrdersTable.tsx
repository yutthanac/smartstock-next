'use client';

import React from 'react';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  Banknote,
  QrCode,
  CreditCard,
  Edit,
  ShoppingBag,
} from 'lucide-react';
import { TableSkeleton } from '@/components/Skeleton';
import { Order } from '@/types';

export type StatusTab = 'all' | 'completed' | 'cancelled';
export type PaymentFilter = 'all' | 'cash' | 'qr_promptpay' | 'credit_card';

export interface TabCounts {
  totalCount: number;
  completedCount: number;
  cancelledCount: number;
  cancelledAmount: number;
}

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  statusTab: StatusTab;
  onStatusTabChange: (tab: StatusTab) => void;
  tabCounts: TabCounts;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  paymentFilter: PaymentFilter;
  onPaymentFilterChange: (filter: PaymentFilter) => void;
  formattedDateTitle: string;
  onOpenEdit: (order: Order) => void;
  onOpenCancel: (order: Order) => void;
}

export function OrdersTable({
  orders,
  isLoading,
  statusTab,
  onStatusTabChange,
  tabCounts,
  searchQuery,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  formattedDateTitle,
  onOpenEdit,
  onOpenCancel,
}: OrdersTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
      {/* Status Filter Tabs & Search / Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => onStatusTabChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'all'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>บิลทั้งหมด</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono bg-stone-200/70 text-stone-700">
              {tabCounts.totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusTabChange('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'completed'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ชำระแล้ว</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-100/70 text-emerald-800">
              {tabCounts.completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusTabChange('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'cancelled'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-stone-600 hover:text-rose-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>ยกเลิกแล้ว</span>
            {tabCounts.cancelledCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono bg-rose-100 text-rose-700 font-bold">
                {tabCounts.cancelledCount}
              </span>
            )}
          </button>
        </div>

        {/* Search & Payment Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาเลขบิล, ชื่อสินค้า..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => onPaymentFilterChange(e.target.value as PaymentFilter)}
            className="py-1.5 px-3 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 cursor-pointer"
          >
            <option value="all">วิธีชำระทั้งหมด</option>
            <option value="cash">เงินสด</option>
            <option value="qr_promptpay">QR PromptPay</option>
            <option value="credit_card">บัตรเครดิต</option>
          </select>
        </div>
      </div>

      {/* Table Header Details */}
      <div className="flex items-center justify-between text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-stone-500" />
          <span>
            {statusTab === 'all' && 'บิลทั้งหมด'}
            {statusTab === 'completed' && 'บิลชำระแล้ว'}
            {statusTab === 'cancelled' && 'บิลยกเลิกแล้ว'}
            {' '}({formattedDateTitle}){' '}
            <span className="text-stone-300">|</span>{' '}
            <span className="font-mono tabular-nums font-bold text-stone-900">{orders.length}</span> บิล
          </span>
        </div>
        {statusTab === 'cancelled' && tabCounts.cancelledAmount > 0 && (
          <span className="text-rose-700 font-semibold text-xs font-mono tabular-nums">
            ยอดคืนเงิน: ฿{tabCounts.cancelledAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[760px]">
          <thead>
            <tr className="bg-transparent border-b border-stone-200 text-stone-900 text-xs font-semibold">
              <th className="py-3 px-4 whitespace-nowrap min-w-[150px]">เลขที่บิล</th>
              <th className="py-3 px-4 whitespace-nowrap min-w-[130px]">วัน-เวลา</th>
              <th className="py-3 px-4 min-w-[240px]">รายการสินค้า</th>
              <th className="py-3 px-4 text-right whitespace-nowrap min-w-[90px]">ยอดรวม</th>
              <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">วิธีชำระ</th>
              <th className="py-3 px-4 text-center whitespace-nowrap min-w-[140px]">สถานะ</th>
              <th className="py-3 px-4 text-center whitespace-nowrap min-w-[90px]">จัดการ</th>
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
                <td colSpan={7} className="py-16 text-center text-stone-400 space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 stroke-1" />
                  <div className="text-sm font-medium text-stone-600">ไม่พบรายการคำสั่งซื้อ</div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const formattedTime = (() => {
                  try {
                    const date = new Date(order.created_at);
                    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                  } catch {
                    return order.created_at;
                  }
                })();

                const isCancelled = order.status === 'cancelled';

                return (
                  <tr
                    key={order.id}
                    className={`transition-colors ${
                      isCancelled ? 'bg-rose-50/40 text-stone-400' : 'hover:bg-stone-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold font-mono tabular-nums whitespace-nowrap">
                      <span className={isCancelled ? 'line-through text-stone-400' : 'text-stone-900'}>
                        {order.order_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono tabular-nums text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{order.created_at?.substring(0, 10)}</span>
                        <span className="text-stone-400 font-medium">({formattedTime})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-800">
                      <div className="space-y-1.5">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`font-semibold ${
                                isCancelled ? 'line-through text-stone-400' : 'text-stone-900'
                              }`}
                            >
                              {i.name}
                            </span>
                            <span className="text-stone-500 font-bold font-mono tabular-nums text-xs">
                              x{i.quantity}
                            </span>
                            {i.note && (
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] font-medium whitespace-nowrap">
                                {i.note}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono tabular-nums text-sm whitespace-nowrap">
                      <span className={isCancelled ? 'line-through text-stone-400' : 'text-stone-900'}>
                        ฿{(Number(order.total) || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200/60 font-medium text-stone-700 text-xs">
                        {order.payment_method === 'cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                        {order.payment_method === 'qr_promptpay' && <QrCode className="w-3.5 h-3.5 text-blue-600" />}
                        {order.payment_method === 'credit_card' && <CreditCard className="w-3.5 h-3.5 text-purple-600" />}
                        <span>
                          {order.payment_method === 'cash'
                            ? 'เงินสด'
                            : order.payment_method === 'qr_promptpay'
                            ? 'QR PromptPay'
                            : order.payment_method === 'credit_card'
                            ? 'บัตรเครดิต'
                            : order.payment_method}
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isCancelled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" /> ยกเลิกแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ชำระแล้ว
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(order)}
                          title="แก้ไขข้อมูล"
                          className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => onOpenCancel(order)}
                            title="ยกเลิกบิล"
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
