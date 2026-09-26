'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Order } from '@/types';

interface CancelOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string, restoreStock: boolean) => Promise<void>;
}

const QUICK_REASONS = [
  'ชงผิด',
  'ทำหก / เสียหาย',
  'ลูกค้าเปลี่ยนใจ',
  'คีย์ผิด',
];

export function CancelOrderModal({
  order,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  const [refundReason, setRefundReason] = useState('');
  const [restoreStock, setRestoreStock] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setRefundReason('');
      setRestoreStock(true);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    await onConfirm(refundReason.trim(), restoreStock);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200/90 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-sm">
              ยืนยันการยกเลิกคำสั่งซื้อ
            </h4>
            <p className="text-xs text-stone-500 font-mono">
              บิล #{order.order_number}
            </p>
          </div>
        </div>

        {/* Refund Box */}
        <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">ยอดเงินคืน:</span>
            <span className="font-mono font-bold text-base text-rose-600">
              ฿{(Number(order.total) || 0).toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-rose-700">
            วิธีชำระเดิม:{' '}
            <strong className="font-medium">
              {order.payment_method === 'cash'
                ? 'เงินสด'
                : order.payment_method === 'qr_promptpay'
                ? 'QR PromptPay'
                : 'บัตรเครดิต'}
            </strong>
          </p>
        </div>

        {/* Stock Handling Option: Restore vs Cut as Waste */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700 block">
            การจัดการสต็อกวัตถุดิบ
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRestoreStock(true)}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                restoreStock
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-2xs font-semibold'
                  : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>คืนสต็อก</span>
              </div>
              <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                ยังไม่ได้ชง / คืนของกลับเข้าคลัง
              </p>
            </button>
            <button
              type="button"
              onClick={() => setRestoreStock(false)}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                !restoreStock
                  ? 'border-rose-600 bg-rose-50/70 text-rose-900 shadow-2xs font-semibold'
                  : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>ตัดทิ้งเป็นของเสีย</span>
              </div>
              <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                ชงไปแล้ว เสียของ ไม่คืนสต็อก
              </p>
            </button>
          </div>
        </div>

        {/* Stock Summary Box */}
        <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
          restoreStock
            ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-900'
            : 'bg-amber-50/40 border-amber-200/80 text-amber-900'
        }`}>
          <span className="font-semibold block">
            {restoreStock
              ? '✓ ระบบจะคืนสต็อกวัตถุดิบตามสูตรให้อัตโนมัติ:'
              : '⚠️ ระบบจะไม่คืนสต็อก และจะบันทึกเป็นของเสีย (Waste) เนื่องจากทำเครื่องดื่มไปแล้ว:'}
          </span>
          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] opacity-80">
            {order.items?.map((it, idx) => (
              <li key={idx}>
                {it.name} <span className="font-mono">x{it.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Refund Reason Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-700 block">
              เหตุผลการยกเลิก
            </label>
          </div>

          {/* Quick reason chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setRefundReason(chip)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  refundReason === chip
                    ? 'bg-stone-900 text-white font-semibold shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/80'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="ระบุเหตุผล หรือเลือกจากด้านบน..."
            rows={2}
            className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors font-normal resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันยกเลิก'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
