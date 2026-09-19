'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Order } from '@/types';

interface CancelOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
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

  useEffect(() => {
    if (isOpen) {
      setRefundReason('');
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    await onConfirm(refundReason.trim());
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

        {/* Stock Return Box */}
        <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-700 leading-relaxed">
          <span className="font-semibold text-stone-900">ระบบจะคืนสต็อกวัตถุดิบตามสูตรให้อัตโนมัติ:</span>
          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-stone-600">
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
