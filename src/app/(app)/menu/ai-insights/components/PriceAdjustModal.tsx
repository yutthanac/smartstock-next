'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Check, AlertCircle } from 'lucide-react';
import { MenuItem } from '@/types';
import { Button } from '@/components/Button';

interface PriceAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  recommendedPrice?: number;
  reason?: string;
  onConfirm: (menuId: number, newPrice: number) => Promise<boolean>;
}

export function PriceAdjustModal({
  isOpen,
  onClose,
  menuItem,
  recommendedPrice,
  reason,
  onConfirm,
}: PriceAdjustModalProps) {
  const [priceInput, setPriceInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (menuItem) {
      setPriceInput(String(recommendedPrice ?? menuItem.price));
      setError(null);
    }
  }, [menuItem, recommendedPrice]);

  if (!isOpen || !menuItem) return null;

  const currentPrice = menuItem.price || 0;
  const targetPrice = parseFloat(priceInput) || 0;
  const recipeCost = menuItem.recipe_cost || 0;

  const currentMargin = currentPrice > 0 ? ((currentPrice - recipeCost) / currentPrice) * 100 : 0;
  const newMargin = targetPrice > 0 ? ((targetPrice - recipeCost) / targetPrice) * 100 : 0;
  const priceDiff = targetPrice - currentPrice;

  // Estimated monthly volume (orders * 30 days projection)
  const estMonthlyVolume = (menuItem.order_count && menuItem.order_count > 0 ? menuItem.order_count : 20) * 3;
  const estProfitGainMonthly = priceDiff * estMonthlyVolume;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(targetPrice) || targetPrice <= 0) {
      setError('กรุณาระบุราคาที่มากกว่า 0 บาท');
      return;
    }
    if (targetPrice === currentPrice) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const success = await onConfirm(menuItem.id, targetPrice);
      if (success) {
        onClose();
      } else {
        setError('ไม่สามารถปรับปรุงราคาได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-800">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">ปรับราคาเมนู (Price Optimization)</h3>
              <p className="text-xs text-stone-500">{menuItem.name} • {menuItem.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {reason && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-2xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">เหตุผลจาก AI & Sweet Spot:</strong>
                <span>{reason}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Price Comparison Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-[11px] font-medium text-stone-500 block mb-1">ราคาปัจจุบัน</span>
              <div className="text-lg font-bold text-stone-700 font-mono">฿{currentPrice.toFixed(0)}</div>
              <span className="text-[10px] text-stone-400">มาร์จิ้น {currentMargin.toFixed(1)}%</span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200">
              <label htmlFor="target-price-input" className="text-[11px] font-semibold text-emerald-800 block mb-1">
                ราคาใหม่ที่แนะนำ
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">฿</span>
                <input
                  id="target-price-input"
                  type="number"
                  step="1"
                  min="1"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-lg font-bold text-emerald-950 font-mono bg-white rounded-xl border border-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
              </div>
              <span className="text-[10px] text-emerald-700 mt-1 block font-medium">
                มาร์จิ้นใหม่ {newMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Impact Projection */}
          <div className="p-4 bg-stone-900 text-white rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-300">
              <span>ส่วนต่างราคาต่อแก้ว:</span>
              <span className={`font-mono font-bold ${priceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {priceDiff >= 0 ? `+฿${priceDiff.toFixed(0)}` : `-฿${Math.abs(priceDiff).toFixed(0)}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-300">
              <span>ต้นทุนสูตรอาหาร (BOM):</span>
              <span className="font-mono text-stone-200">฿{recipeCost.toFixed(2)} / แก้ว</span>
            </div>
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-200">กำไรสุทธิคาดการณ์เพิ่มขึ้น:</span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {estProfitGainMonthly >= 0 ? `+฿${Math.round(estProfitGainMonthly).toLocaleString()} / เดือน` : `-฿${Math.round(Math.abs(estProfitGainMonthly)).toLocaleString()} / เดือน`}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-stone-400 text-center leading-relaxed">
            *เมื่อกดยืนยัน ราคาใหม่จะอัปเดตลงระบบขายหน้าร้าน POS และฐานข้อมูลทันที 100%
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              icon={<Check className="w-3.5 h-3.5" />}
              className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs"
            >
              ยืนยันและอัปเดตราคา
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
