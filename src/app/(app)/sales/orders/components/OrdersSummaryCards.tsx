'use client';

import React from 'react';
import { Banknote, QrCode, CreditCard } from 'lucide-react';

export interface OrderViewStats {
  totalRevenue: number;
  refundedRevenue: number;
  completedBills: number;
  cancelledBills: number;
  totalBills: number;
  avgTicket: number;
  cashCount: number;
  qrCount: number;
  cardCount: number;
}

interface OrdersSummaryCardsProps {
  stats: OrderViewStats;
}

export function OrdersSummaryCards({ stats }: OrdersSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
      {/* Net Revenue */}
      <div className="bg-stone-50/80 rounded-xl p-3.5 border border-stone-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
          <span>ยอดขายสุทธิ</span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
            ชำระแล้ว
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-lg sm:text-xl font-bold text-stone-900 font-mono tabular-nums">
            ฿{stats.totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Refunds */}
      <div className="bg-stone-50/80 rounded-xl p-3.5 border border-stone-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
          <span>ยอดคืนเงิน</span>
          <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
            ยกเลิกแล้ว
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-lg sm:text-xl font-bold text-rose-600 font-mono tabular-nums">
            ฿{stats.refundedRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-stone-400 font-normal font-mono tabular-nums">({stats.cancelledBills})</span>
        </div>
      </div>

      {/* Average Ticket */}
      <div className="bg-stone-50/80 rounded-xl p-3.5 border border-stone-200/80 flex flex-col justify-between">
        <span className="text-xs text-stone-500 font-medium">เฉลี่ยต่อบิล</span>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-lg sm:text-xl font-bold text-stone-900 font-mono tabular-nums">
            ฿{stats.avgTicket.toFixed(2)}
          </span>
          <span className="text-xs text-stone-400 font-normal font-mono tabular-nums">({stats.completedBills})</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-stone-50/80 rounded-xl p-3.5 border border-stone-200/80 flex flex-col justify-between">
        <span className="text-xs text-stone-500 font-medium">ช่องทางชำระ</span>
        <div className="mt-1 flex items-center gap-2.5 text-xs font-semibold text-stone-700">
          <span className="inline-flex items-center gap-1 font-mono tabular-nums" title="เงินสด">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" /> {stats.cashCount}
          </span>
          <span className="inline-flex items-center gap-1 font-mono tabular-nums" title="QR PromptPay">
            <QrCode className="w-3.5 h-3.5 text-blue-600" /> {stats.qrCount}
          </span>
          <span className="inline-flex items-center gap-1 font-mono tabular-nums" title="บัตรเครดิต">
            <CreditCard className="w-3.5 h-3.5 text-purple-600" /> {stats.cardCount}
          </span>
        </div>
      </div>
    </div>
  );
}
