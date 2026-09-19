'use client';

import React, { useState } from 'react';
import { X, DollarSign, Trash2, Package } from 'lucide-react';
import { Ingredient } from '@/types';
import { Button } from '@/components/Button';
import { useStock } from '@/lib/StockContext';
import { formatStockUnits, formatInteger } from '@/lib/cafePresets';

interface QuickWasteModalProps {
  ingredient: Ingredient | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTier?: 'bar' | 'backstock';
}

const REASON_CHIPS = ['หก/เลอะ', 'เสีย/บูด', 'หมดอายุ', 'ชงผิด', 'อื่นๆ'];

export const QuickWasteModal: React.FC<QuickWasteModalProps> = ({
  ingredient,
  isOpen,
  onClose,
}) => {
  const { wasteAdjust } = useStock();

  const [reason, setReason] = useState<string>('หก/เลอะ');
  const [quantity, setQuantity] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity('1');
      setReason('หก/เลอะ');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen || !ingredient) return null;

  const costPerUnit = Number(ingredient.cost_per_unit || 0);
  const packSize = Number(ingredient.package_size || 0);
  const packUnit = ingredient.package_unit || '';
  const numQty = Math.round(parseFloat(quantity) || 0);
  const totalCost = numQty * costPerUnit;

  const formattedStock = formatStockUnits(
    ingredient.quantity,
    ingredient.package_size,
    ingredient.package_unit,
    ingredient.unit
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      alert('กรุณาระบุจำนวนที่มากกว่า 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await wasteAdjust(ingredient.id, {
        quantity: numQty,
        reason,
        notes: notes.trim() || undefined,
      });

      if (ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickPills = ingredient.unit === 'กรัม' || ingredient.unit === 'มล.'
    ? [20, 50, 100, 250, 500]
    : [1, 2, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-700 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-4 h-4 text-stone-200" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">บันทึกของเสีย / ตัดทิ้ง</h3>
              <p className="text-xs text-stone-500 truncate max-w-60 font-medium">{ingredient.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current Stock Banner */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <span className="text-stone-600 font-medium">สต็อกคงเหลือปัจจุบัน:</span>
            <div className="text-right font-mono">
              <span className="font-bold text-stone-900 text-xs">{formattedStock.packText}</span>{' '}
              <span className="text-stone-500 text-[11px]">({formattedStock.baseText})</span>
            </div>
          </div>

          {/* Reason Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">สาเหตุของเสีย</label>
            <div className="flex flex-wrap gap-1.5">
              {REASON_CHIPS.map((r) => {
                const active = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/60'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Package pills if available */}
          {Boolean(packSize > 0 && packUnit) && (
            <div className="space-y-1">
              <label className="text-[11px] text-stone-600 font-medium flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-stone-400" />
                ตัดทิ้งเป็น {packUnit} เต็ม:
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuantity(String(p * packSize))}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-mono font-medium border border-stone-200 transition-colors cursor-pointer"
                  >
                    {p} {packUnit} ({formatInteger(p * packSize)} {ingredient.unit})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">จำนวนที่เสีย / ทิ้ง ({ingredient.unit})</label>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*$/.test(val)) {
                    setQuantity(val);
                  }
                }}
                placeholder="ระบุจำนวนเต็ม"
                className="w-full pl-3.5 pr-14 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-base font-semibold focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 pointer-events-none">
                {ingredient.unit}
              </span>
            </div>

            {/* Quick amount increments */}
            <div className="flex items-center gap-1.5 pt-1">
              {quickPills.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuantity(String(val))}
                  className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] font-mono border border-stone-200 transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Live Waste Valuation Preview Card */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 text-stone-700 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-stone-600">มูลค่าความเสียหาย</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-sm font-bold text-stone-900">
                ฿{Math.round(totalCost).toLocaleString()}
              </span>
              <p className="text-[10px] text-stone-400">@ ฿{ingredient.cost_per_unit}/{ingredient.unit}</p>
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-stone-500">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ทำหกระหว่างเท, บูดคาก้นขวด"
              className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || numQty <= 0}
              className="flex-1 py-2 rounded-xl text-xs bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกตัดของเสีย'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
