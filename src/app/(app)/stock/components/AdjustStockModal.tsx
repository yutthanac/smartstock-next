import React from 'react';
import { Sliders, X } from 'lucide-react';
import { Ingredient } from '@/types';

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-slate-200 animate-scale-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">ปรับปรุงสต็อกด้วยมือ</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              {adjustTarget.name} (ปัจจุบัน: <strong className="text-slate-800">{adjustTarget.quantity} {adjustTarget.unit}</strong>)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">การดำเนินการ</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('in')}
                className={`py-2 rounded-xl font-bold transition-all text-xs ${
                  adjustType === 'in'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                + รับเข้า
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('waste')}
                className={`py-2 rounded-xl font-bold transition-all text-xs ${
                  adjustType === 'waste'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                - ของเสีย/ทิ้ง
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('adjust')}
                className={`py-2 rounded-xl font-bold transition-all text-xs ${
                  adjustType === 'adjust'
                    ? 'bg-[#12312d] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                นับสต็อกใหม่
              </button>
            </div>
          </div>

          {/* Smooth Numeric Input: Adjust Amount */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {adjustType === 'adjust' ? 'ยอดที่นับได้จริงใหม่' : 'จำนวนที่ต้องการปรับ'} ({adjustTarget.unit})
            </label>
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
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30 text-sm"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">หมายเหตุ / เหตุผล</label>
            <input
              type="text"
              placeholder="เช่น รับของตาม PO #123, ใบเน่าช้ำ, ปรับยอดประจำสัปดาห์"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl font-bold bg-[#12312d] text-white hover:bg-[#1a423d] shadow-sm"
          >
            ยืนยันปรับสต็อก
          </button>
        </div>
      </form>
    </div>
  );
};
