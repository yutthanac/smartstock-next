'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Flame, Sparkles, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { MenuItem } from '@/types';
import { CartItemOption } from './ItemOptionModal';

interface ItemOptionPanelProps {
  item: MenuItem;
  initialOptions?: CartItemOption;
  onCancel: () => void;
  onConfirm: (options: CartItemOption) => void;
}

export const ItemOptionPanel: React.FC<ItemOptionPanelProps> = ({
  item,
  initialOptions,
  onCancel,
  onConfirm,
}) => {
  const [spiciness, setSpiciness] = useState<string>(initialOptions?.spiciness || 'เผ็ดปกติ');
  const [diningOption, setDiningOption] = useState<string>(initialOptions?.diningOption || 'ทานที่ร้าน');
  const [isSpecial, setIsSpecial] = useState<boolean>(initialOptions?.isSpecial || false);
  const [customNote, setCustomNote] = useState<string>(initialOptions?.customNote || '');

  useEffect(() => {
    setSpiciness(initialOptions?.spiciness || 'เผ็ดปกติ');
    setDiningOption(initialOptions?.diningOption || 'ทานที่ร้าน');
    setIsSpecial(initialOptions?.isSpecial || false);
    setCustomNote(initialOptions?.customNote || '');
  }, [item, initialOptions]);

  const quickTags = ['ไม่ใส่ผัก', 'ไม่ใส่กระเทียม', 'ไม่ใส่ชูรส', 'หวานน้อย', 'เค็มน้อย', 'แยกน้ำซุป', 'ขอน้ำจิ้มเพิ่ม'];

  const handleToggleTag = (tag: string) => {
    if (customNote.includes(tag)) {
      setCustomNote(customNote.replace(new RegExp(`${tag},?\\s*`, 'g'), '').trim());
    } else {
      setCustomNote(customNote ? `${customNote}, ${tag}` : tag);
    }
  };

  const currentPrice = item.price + (isSpecial ? 10 : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      spiciness,
      diningOption,
      isSpecial,
      customNote: customNote.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-3.5 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="กลับไปที่บิล"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate">{item.name}</h3>
            <p className="text-[11px] text-slate-400">เลือกรายละเอียดก่อนลงบิล</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-extrabold text-sm text-emerald-800">฿{currentPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Options Body */}
      <div className="space-y-3.5 flex-1 overflow-y-auto no-scrollbar pr-0.5">
        {/* Special or Regular */}
        <div>
          <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ขนาด / ปริมาณ</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsSpecial(false)}
              className={`py-2 px-3 rounded-2xl font-bold transition-all border ${
                !isSpecial
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ธรรมดา
            </button>
            <button
              type="button"
              onClick={() => setIsSpecial(true)}
              className={`py-2 px-3 rounded-2xl font-bold transition-all border ${
                isSpecial
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              พิเศษ (+10฿)
            </button>
          </div>
        </div>

        {/* Dining in vs Takeaway */}
        <div>
          <label className="font-bold text-slate-800 block mb-1.5">รูปแบบการทาน</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDiningOption('ทานที่ร้าน')}
              className={`py-2 px-3 rounded-2xl font-bold transition-all border ${
                diningOption === 'ทานที่ร้าน'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🍽️ ทานที่ร้าน
            </button>
            <button
              type="button"
              onClick={() => setDiningOption('กลับบ้าน')}
              className={`py-2 px-3 rounded-2xl font-bold transition-all border ${
                diningOption === 'กลับบ้าน'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🥡 ใส่กล่องกลับบ้าน
            </button>
          </div>
        </div>

        {/* Spiciness */}
        <div>
          <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>ระดับความเผ็ด</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {['ไม่เผ็ด', 'เผ็ดน้อย', 'เผ็ดปกติ', 'เผ็ดมาก 🔥'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSpiciness(lvl)}
                className={`py-1.5 px-1 rounded-xl text-center font-bold text-[11px] transition-all border ${
                  spiciness === lvl
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tags */}
        <div>
          <label className="font-bold text-slate-800 block mb-1.5">ตัวเลือกเพิ่มเติมที่พบบ่อย</label>
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((tag) => {
              const isSelected = customNote.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2 py-1 rounded-xl text-[10px] font-semibold transition-all border ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? `✓ ${tag}` : tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Note input */}
        <div>
          <label className="font-bold text-slate-800 block mb-1">ระบุหมายเหตุเพิ่มเติม</label>
          <input
            type="text"
            placeholder="เช่น ไม่ใส่พริกไทย, ขอน้ำปลาพริก..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Check className="w-3.5 h-3.5" />
          บันทึกตัวเลือก
        </button>
      </div>
    </form>
  );
};
