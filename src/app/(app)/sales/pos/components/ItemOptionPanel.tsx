'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Coffee } from 'lucide-react';
import { MenuItem } from '@/types';
import { Button } from '@/components/Button';
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
  const [temperature, setTemperature] = useState<string>(initialOptions?.temperature || 'เย็น');
  const [sweetness, setSweetness] = useState<string>(initialOptions?.sweetness || 'หวาน 100%');
  const [diningOption, setDiningOption] = useState<string>(initialOptions?.diningOption || 'ทานที่ร้าน');
  const [isSpecial, setIsSpecial] = useState<boolean>(initialOptions?.isSpecial || false);
  const [customNote, setCustomNote] = useState<string>(initialOptions?.customNote || '');

  useEffect(() => {
    setTemperature(initialOptions?.temperature || 'เย็น');
    setSweetness(initialOptions?.sweetness || 'หวาน 100%');
    setDiningOption(initialOptions?.diningOption || 'ทานที่ร้าน');
    setIsSpecial(initialOptions?.isSpecial || false);
    setCustomNote(initialOptions?.customNote || '');
  }, [item, initialOptions]);

  const quickTags = ['หวานน้อย (50%)', 'ไม่หวาน (0%)', 'เพิ่มช็อต (+15฿)', 'แยกน้ำแข็ง', 'นมโอ๊ต (+15฿)', 'วิปครีม', 'ไม่ใส่ไซรัป'];

  const handleToggleTag = (tag: string) => {
    if (customNote.includes(tag)) {
      setCustomNote(customNote.replace(new RegExp(`${tag},?\\s*`, 'g'), '').trim());
    } else {
      setCustomNote(customNote ? `${customNote}, ${tag}` : tag);
    }
  };

  const currentPrice = item.price + (isSpecial ? 15 : 0) + (temperature === 'ปั่น (+10฿)' ? 10 : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      temperature,
      sweetness,
      diningOption,
      isSpecial,
      customNote: customNote.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl neu-raised text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="กลับไปที่บิล"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm truncate">{item.name}</h3>
            <p className="text-[11px] text-slate-400">เลือกอุณหภูมิและความหวาน</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-semibold text-base text-slate-900">฿{currentPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Options Body */}
      <div className="space-y-3.5 flex-1 overflow-y-auto no-scrollbar pr-0.5">
        {/* Temperature */}
        <div>
          <label className="font-medium text-slate-700 block mb-1.5">อุณหภูมิ</label>
          <div className="grid grid-cols-3 gap-2">
            {['เย็น', 'ร้อน', 'ปั่น (+10฿)'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTemperature(t)}
                className={`py-2 px-2 rounded-xl font-medium transition-all border text-center cursor-pointer ${
                  temperature === t
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Sweetness */}
        <div>
          <label className="font-medium text-slate-700 block mb-1.5">ระดับความหวาน</label>
          <div className="grid grid-cols-4 gap-1.5">
            {['ไม่หวาน (0%)', 'หวานน้อย (50%)', 'หวาน 100%', 'หวานมาก'].map((sw) => (
              <button
                key={sw}
                type="button"
                onClick={() => setSweetness(sw)}
                className={`py-2 px-1 rounded-xl font-medium text-[10.5px] transition-all border text-center cursor-pointer ${
                  sweetness === sw
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sw}
              </button>
            ))}
          </div>
        </div>

        {/* Special or Regular */}
        <div>
          <label className="font-medium text-slate-700 block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ขนาด / ช็อต</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsSpecial(false)}
              className={`py-2 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                !isSpecial
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ปกติ
            </button>
            <button
              type="button"
              onClick={() => setIsSpecial(true)}
              className={`py-2 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                isSpecial
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              เพิ่มช็อต (+15฿)
            </button>
          </div>
        </div>

        {/* Dining in vs Takeaway */}
        <div>
          <label className="font-medium text-slate-700 block mb-1.5">รูปแบบการเสิร์ฟ</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDiningOption('ทานที่ร้าน')}
              className={`py-2 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                diningOption === 'ทานที่ร้าน'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ☕ ทานที่ร้าน
            </button>
            <button
              type="button"
              onClick={() => setDiningOption('กลับบ้าน')}
              className={`py-2 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                diningOption === 'กลับบ้าน'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🥤 ใส่แก้วกลับ (Takeaway)
            </button>
          </div>
        </div>

        {/* Quick Tags */}
        <div>
          <label className="font-medium text-slate-700 block mb-1">ตัวเลือกเพิ่มเติม</label>
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium border transition-colors cursor-pointer ${
                  customNote.includes(tag)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Note */}
        <div>
          <input
            type="text"
            placeholder="หมายเหตุเพิ่มเติม..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Footer Confirm */}
      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          ยกเลิก
        </Button>
        <Button
          type="submit"
          variant="primary"
        >
          บันทึกลงบิล
        </Button>
      </div>
    </form>
  );
};
