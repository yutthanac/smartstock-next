'use client';

import React, { useState } from 'react';
import { X, Coffee, Sparkles } from 'lucide-react';
import { MenuItem } from '@/types';
import { Button } from '@/components/Button';

export interface CartItemOption {
  temperature?: string; // 'เย็น' | 'ร้อน' | 'ปั่น'
  sweetness?: string;   // '100%' | '50%' | '25%' | '0%'
  diningOption: string; // 'ทานที่ร้าน' | 'กลับบ้าน'
  isSpecial: boolean;   // เพิ่มช็อต (+15฿)
  spiciness?: string;
  customNote: string;
}

interface ItemOptionModalProps {
  item: MenuItem | null;
  initialOptions?: CartItemOption;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: CartItemOption) => void;
}

export const ItemOptionModal: React.FC<ItemOptionModalProps> = ({
  item,
  initialOptions,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  const [temperature, setTemperature] = useState<string>(initialOptions?.temperature || 'เย็น');
  const [sweetness, setSweetness] = useState<string>(initialOptions?.sweetness || 'หวาน 100%');
  const [diningOption, setDiningOption] = useState<string>(initialOptions?.diningOption || 'ทานที่ร้าน');
  const [isSpecial, setIsSpecial] = useState<boolean>(initialOptions?.isSpecial || false);
  const [customNote, setCustomNote] = useState<string>(initialOptions?.customNote || '');

  const quickTags = ['หวานน้อย (50%)', 'ไม่หวาน (0%)', 'เพิ่มช็อต (+15฿)', 'แยกน้ำแข็ง', 'นมโอ๊ต (+15฿)', 'วิปครีม', 'ไม่ใส่ไซรัป'];

  const handleToggleTag = (tag: string) => {
    if (customNote.includes(tag)) {
      setCustomNote(customNote.replace(new RegExp(`${tag},?\\s*`, 'g'), '').trim());
    } else {
      setCustomNote(customNote ? `${customNote}, ${tag}` : tag);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      temperature,
      sweetness,
      diningOption,
      isSpecial,
      customNote: customNote.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-slate-200 animate-scale-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">{item.name}</h3>
              <p className="text-slate-500 text-[11px]">เลือกอุณหภูมิ ความหวาน และรายละเอียด</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Option: Temperature */}
          <div>
            <label className="font-medium text-slate-700 block mb-1">อุณหภูมิ</label>
            <div className="grid grid-cols-3 gap-2">
              {['เย็น', 'ร้อน', 'ปั่น (+10฿)'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemperature(t)}
                  className={`py-2 px-2 rounded-xl font-medium transition-all border text-center cursor-pointer ${
                    temperature === t
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Option: Sweetness */}
          <div>
            <label className="font-medium text-slate-700 block mb-1">ระดับความหวาน</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['ไม่หวาน (0%)', 'หวานน้อย (50%)', 'หวาน 100%', 'หวานมาก'].map((sw) => (
                <button
                  key={sw}
                  type="button"
                  onClick={() => setSweetness(sw)}
                  className={`py-2 px-1 rounded-xl font-medium text-[10.5px] transition-all border text-center cursor-pointer ${
                    sweetness === sw
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sw}
                </button>
              ))}
            </div>
          </div>

          {/* Option: Extra Shot / Size */}
          <div>
            <label className="font-medium text-slate-700 block mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>เพิ่มช็อต / พิเศษ</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsSpecial(false)}
                className={`py-2 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                  !isSpecial
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                เพิ่มช็อต (+15฿)
              </button>
            </div>
          </div>

          {/* Option: Dine-in vs Takeaway */}
          <div>
            <label className="font-medium text-slate-700 block mb-1">รูปแบบการเสิร์ฟ</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiningOption('ทานที่ร้าน')}
                className={`py-2 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                  diningOption === 'ทานที่ร้าน'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🥤 ใส่แก้วกลับ (Takeaway)
              </button>
            </div>
          </div>

          {/* Quick Tags */}
          <div>
            <label className="font-medium text-slate-700 block mb-1.5">ตัวเลือกเพิ่มเติม</label>
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium border transition-colors cursor-pointer ${
                    customNote.includes(tag)
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            ยืนยัน
          </Button>
        </div>
      </form>
    </div>
  );
};
