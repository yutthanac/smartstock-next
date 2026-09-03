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
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl neu-raised text-slate-500 hover:text-slate-800 transition-colors"
            title="กลับไปที่บิล"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h3 className="font-black text-slate-900 text-base truncate">{item.name}</h3>
            <p className="text-xs text-slate-500 font-medium">เลือกรายละเอียดก่อนลงบิล</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-black text-base text-emerald-800">฿{currentPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Options Body */}
      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-0.5">
        {/* Special or Regular */}
        <div>
          <label className="font-bold text-slate-800 block mb-2 flex items-center gap-1.5 text-sm">
            <span>ขนาด / ปริมาณ</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsSpecial(false)}
              className={`py-2.5 px-3 rounded-2xl font-normal text-xs transition-all ${
                !isSpecial
                  ? 'neu-pressed border border-slate-900/30 '
                  : 'neu-raised text-slate-700 hover:text-slate-900'
              }`}
            >
              ธรรมดา
            </button>
            <button
              type="button"
              onClick={() => setIsSpecial(true)}
              className={`py-2.5 px-3 rounded-2xl font-normal text-xs transition-all ${
                isSpecial
                  ? 'neu-pressed border border-amber-500/40'
                  : 'neu-raised text-slate-700 hover:text-slate-900'
              }`}
            >
              พิเศษ (+10฿)
            </button>
          </div>
        </div>

        {/* Dining in vs Takeaway */}
        <div>
          <label className="font-bold text-slate-800 block mb-2 text-sm">รูปแบบการทาน</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDiningOption('ทานที่ร้าน')}
              className={`py-2.5 px-3 rounded-2xl font-normal text-xs transition-all ${
                diningOption === 'ทานที่ร้าน'
                  ? 'neu-pressed border border-emerald-500/30'
                  : 'neu-raised text-slate-700 hover:text-slate-900'
              }`}
            >
              ทานที่ร้าน
            </button>
            <button
              type="button"
              onClick={() => setDiningOption('กลับบ้าน')}
              className={`py-2.5 px-3 rounded-2xl font-normal text-xs transition-all ${
                diningOption === 'กลับบ้าน'
                  ? 'neu-pressed border border-emerald-500/30'
                  : 'neu-raised text-slate-700 hover:text-slate-900'
              }`}
            >
              🥡 ใส่กล่องกลับบ้าน
            </button>
          </div>
        </div>

        {/* Spiciness */}
        <div>
          <label className="font-bold text-slate-800 block mb-2 flex items-center gap-1.5 text-sm">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>ระดับความเผ็ด</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {['ไม่เผ็ด', 'เผ็ดน้อย', 'เผ็ดปกติ', 'เผ็ดมาก 🔥'].map((lvl) => {
              const isSelected = spiciness === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSpiciness(lvl)}
                  className={`py-2.5 px-1 rounded-xl text-center font-normal text-xs transition-all ${
                    isSelected
                      ? 'neu-pressed text-rose-700 border border-rose-500/30 font-black'
                      : 'neu-raised text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Tags */}
        <div>
          <label className="font-bold text-slate-800 block mb-2 text-sm">ตัวเลือกเพิ่มเติมที่พบบ่อย</label>
          <div className="flex flex-wrap gap-2">
            {quickTags.map((tag) => {
              const isSelected = customNote.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-all ${
                    isSelected
                      ? 'neu-pressed border border-emerald-500/30'
                      : 'neu-raised text-slate-600 hover:text-slate-900'
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
          <label className="font-bold text-slate-800 block mb-1.5 text-sm">ระบุหมายเหตุเพิ่มเติม</label>
          <input
            type="text"
            placeholder="เช่น ไม่ใส่พริกไทย, ขอน้ำปลาพริก..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full p-3 skeuo-input rounded-xl focus:outline-none text-xs text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-2 border-t border-slate-300/60 flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl skeuo-btn-secondary font-normal text-sm "
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-2xl skeuo-btn-primary font-normal text-sm flex items-center justify-center gap-1.5"
        >
          บันทึกตัวเลือก
        </button>
      </div>
    </form>
  );
};
