'use client';

import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import { Ingredient } from '@/types';
import { Button } from '@/components/Button';
import { formatStockUnits, formatInteger } from '@/lib/cafePresets';

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

  const packSize = Number(adjustTarget.package_size || 0);
  const packUnit = adjustTarget.package_unit || '';
  const formattedCurrent = formatStockUnits(
    adjustTarget.quantity,
    adjustTarget.package_size,
    adjustTarget.package_unit,
    adjustTarget.unit
  );

  const numAmount = Math.round(parseFloat(String(adjustAmount || 0)) || 0);
  const equivPacks = packSize > 0 ? Math.floor(numAmount / packSize) : 0;
  const equivRemainder = packSize > 0 ? numAmount % packSize : 0;

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
              {adjustTarget.name}
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

        {/* Current Stock Banner */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
          <span className="text-stone-500 font-medium">สต็อกคงเหลือปัจจุบัน:</span>
          <div className="text-right font-mono">
            <span className="font-bold text-stone-900 text-sm">{formattedCurrent.packText}</span>{' '}
            <span className="text-stone-500 text-xs">({formattedCurrent.baseText})</span>
          </div>
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

          {/* Quick Package Multipliers (if packageSize exists) */}
          {Boolean(packSize > 0 && packUnit) && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-stone-500" />
                  ปรับด่วนตามจำนวน {packUnit}:
                </span>
                <span className="font-mono text-stone-500">1 {packUnit} = {formatInteger(packSize)} {adjustTarget.unit}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 5, 10].map((multiplier) => {
                  const qtyToAdd = multiplier * packSize;
                  return (
                    <button
                      key={multiplier}
                      type="button"
                      onClick={() => setAdjustAmount(qtyToAdd)}
                      className="py-1.5 px-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-100/80 hover:border-stone-400 text-stone-800 text-[11px] font-mono font-semibold cursor-pointer transition-all shadow-2xs text-center"
                    >
                      {multiplier} {packUnit}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700">
                {adjustType === 'adjust' ? 'ยอดที่นับได้จริงใหม่' : 'จำนวนที่ต้องการปรับ'} ({adjustTarget.unit})
              </label>
            </div>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="จำนวนเต็ม เช่น 2000, 4000"
              value={adjustAmount === 0 ? '' : adjustAmount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*$/.test(val)) {
                  setAdjustAmount(val === '' ? '' : parseInt(val, 10));
                }
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                setAdjustAmount(isNaN(val) || val <= 0 ? 1 : val);
              }}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 text-sm"
            />

            {Boolean(packSize > 0 && packUnit && numAmount > 0) && (
              <p className="text-[11px] text-stone-500 mt-1.5 font-mono">
                💡 เทียบเท่ากับ:{' '}
                <strong className="text-stone-900 font-bold">
                  {equivPacks.toLocaleString()} {packUnit}
                </strong>
              </p>
            )}
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">หมายเหตุ / เหตุผล</label>
            <input
              type="text"
              placeholder="เช่น รับของใหม่ 5 ขวด, ชงหก, ปรับยอดตรวจนับประจำสัปดาห์"
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
