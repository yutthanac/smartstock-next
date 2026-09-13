import React from 'react';
import { X } from 'lucide-react';
import { Ingredient } from '@/types';
import { Button } from '@/components/Button';

interface AdjustStockModalProps {
  adjustTarget: Ingredient | null;
  adjustType: 'in' | 'waste' | 'adjust';
  adjustAmount: number | string;
  adjustNote: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setAdjustType: (type: 'in' | 'waste' | 'adjust') => void;
  setAdjustAmount: (val: any) => void;
  setAdjustNote: (note: string) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  adjustTarget,
  adjustType,
  adjustAmount,
  adjustNote,
  onClose,
  onSubmit,
  setAdjustType,
  setAdjustAmount,
  setAdjustNote,
}) => {
  if (!adjustTarget) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-stone-200 animate-scale-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-stone-900 text-base">ปรับปรุงสต็อกด้วยมือ</h3>
            <p className="text-stone-500 text-xs mt-0.5 font-normal">
              {adjustTarget.name} (ปัจจุบัน: <strong className="text-stone-800 font-mono tabular-nums">{adjustTarget.quantity} {adjustTarget.unit}</strong>)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="font-semibold text-stone-700 block mb-1.5">การดำเนินการ</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('in')}
                className={`py-2 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                  adjustType === 'in'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                + รับเข้า
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('waste')}
                className={`py-2 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                  adjustType === 'waste'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                - ของเสีย/ทิ้ง
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('adjust')}
                className={`py-2 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                  adjustType === 'adjust'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                นับสต็อกใหม่
              </button>
            </div>
          </div>

          {/* Smooth Numeric Input: Adjust Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700">
                {adjustType === 'adjust' ? 'ยอดที่นับได้จริงใหม่' : 'จำนวนที่ต้องการปรับ'} ({adjustTarget.unit})
              </label>
              {Boolean(adjustTarget.package_unit && adjustTarget.package_size && adjustTarget.package_size > 0) && (
                <span className="text-[11px] text-stone-500 font-medium">
                  1 {adjustTarget.package_unit} = {adjustTarget.package_size} {adjustTarget.unit}
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="จำนวน"
              value={adjustAmount === 0 ? '' : adjustAmount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setAdjustAmount(val === '' ? '' : val);
                }
              }}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                setAdjustAmount(isNaN(val) || val <= 0 ? 1 : val);
              }}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 text-sm"
            />

            {Boolean(adjustTarget.package_unit && adjustTarget.package_size && adjustTarget.package_size > 0) && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-stone-500">ปรับทีละ {adjustTarget.package_unit}:</span>
                {[1, 2, 5].map((multiplier) => {
                  const qtyToAdd = multiplier * (adjustTarget.package_size || 1);
                  return (
                    <button
                      key={multiplier}
                      type="button"
                      onClick={() => setAdjustAmount(qtyToAdd)}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-mono cursor-pointer transition-colors"
                    >
                      {multiplier} {adjustTarget.package_unit} ({qtyToAdd.toLocaleString()} {adjustTarget.unit})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">หมายเหตุ / เหตุผล</label>
            <input
              type="text"
              placeholder="เช่น รับของตาม PO #123, ใบเน่าช้ำ, ปรับยอดประจำสัปดาห์"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10 text-stone-900 text-xs"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"
          >
            ยืนยันปรับสต็อก
          </Button>
        </div>
      </form>
    </div>
  );
};
