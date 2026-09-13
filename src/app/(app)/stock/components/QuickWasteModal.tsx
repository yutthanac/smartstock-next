'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, DollarSign, Trash2 } from 'lucide-react';
import { Ingredient } from '@/types';
import { Button } from '@/components/Button';
import { useStock } from '@/lib/StockContext';

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
  defaultTier = 'bar',
}) => {
  const { wasteAdjust } = useStock();

  const [tier, setTier] = useState<'bar' | 'backstock'>(defaultTier);
  const [reason, setReason] = useState<string>('หก/เลอะ');
  const [quantity, setQuantity] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset or update tier on open
  React.useEffect(() => {
    if (isOpen) {
      setTier(defaultTier);
      setQuantity('1');
      setReason('หก/เลอะ');
      setNotes('');
    }
  }, [isOpen, defaultTier]);

  if (!isOpen || !ingredient) return null;

  const costPerUnit = Number(ingredient.cost_per_unit || 0);
  const packageSize = Number(ingredient.package_size || 1);
  const isTwoTier = Boolean(ingredient.is_two_tier);
  const numQty = parseFloat(quantity) || 0;

  // Calculate waste cost
  const baseQty = tier === 'backstock' ? numQty * packageSize : numQty;
  const totalCost = baseQty * costPerUnit;

  const currentAvailable = tier === 'backstock'
    ? Number(ingredient.backstock_quantity || 0)
    : Number(ingredient.bar_quantity || (isTwoTier ? 0 : ingredient.quantity));

  const displayUnit = tier === 'backstock'
    ? (ingredient.package_unit || 'แพ็ค')
    : ingredient.unit;

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
        tier,
        notes: notes.trim() || undefined,
      });

      if (ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickPills = tier === 'backstock'
    ? [1, 2, 5]
    : ingredient.unit === 'กรัม' || ingredient.unit === 'มล.'
    ? [10, 50, 100, 250]
    : [1, 2, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center shadow-xs">
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
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tier Switch (Only for Two-Tier items) */}
          {isTwoTier && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-600">ตัดจากคลังไหน?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTier('bar')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
                    tier === 'bar'
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>☕ หน้าบาร์</span>
                  <span className={`text-[10px] font-mono ${tier === 'bar' ? 'text-stone-300' : 'text-stone-400'}`}>
                    เหลือ {Number(ingredient.bar_quantity || 0).toLocaleString()} {ingredient.unit}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTier('backstock')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
                    tier === 'backstock'
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>📦 หลังร้าน</span>
                  <span className={`text-[10px] font-mono ${tier === 'backstock' ? 'text-stone-300' : 'text-stone-400'}`}>
                    เหลือ {Number(ingredient.backstock_quantity || 0).toLocaleString()} {ingredient.package_unit || 'แพ็ค'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Reason Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">สาเหตุของเสีย</label>
            <div className="flex flex-wrap gap-1.5">
              {REASON_CHIPS.map((r) => {
                const active = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-stone-800 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 border border-stone-200/60'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-stone-600">จำนวนที่เสีย / ทิ้ง</label>
              <span className="text-[11px] text-stone-400">
                พร้อมใช้: {currentAvailable.toLocaleString()} {displayUnit}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.001"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="ระบุจำนวน"
                className="w-full pl-3.5 pr-14 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-base font-semibold focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 pointer-events-none">
                {displayUnit}
              </span>
            </div>

            {/* Quick amount increments */}
            <div className="flex items-center gap-1.5 pt-1">
              {quickPills.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuantity(String(val))}
                  className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] font-mono border border-stone-200 transition-colors"
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
                ฿{totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-stone-400">@ ฿{costPerUnit}/{ingredient.unit}</p>
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
