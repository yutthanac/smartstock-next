import React, { useState } from 'react';
import { X, Check, Flame, MessageSquarePlus, UtensilsCrossed, Sparkles } from 'lucide-react';
import { MenuItem } from '@/types';

export interface CartItemOption {
  spiciness: string; // 'ไม่เผ็ด' | 'เผ็ดน้อย' | 'เผ็ดปกติ' | 'เผ็ดมาก'
  diningOption: string; // 'ทานที่ร้าน' | 'กลับบ้าน'
  isSpecial: boolean; // ธรรมดา vs พิเศษ
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

  const [spiciness, setSpiciness] = useState<string>(initialOptions?.spiciness || 'เผ็ดปกติ');
  const [diningOption, setDiningOption] = useState<string>(initialOptions?.diningOption || 'ทานที่ร้าน');
  const [isSpecial, setIsSpecial] = useState<boolean>(initialOptions?.isSpecial || false);
  const [customNote, setCustomNote] = useState<string>(initialOptions?.customNote || '');

  const quickTags = ['ไม่ใส่ผัก', 'ไม่ใส่กระเทียม', 'ไม่ใส่ชูรส', 'หวานน้อย', 'เค็มน้อย', 'แยกน้ำซุป', 'ขอน้ำจิ้มเพิ่ม'];

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
      spiciness,
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
            <div className="w-9 h-9 rounded-2xl bg-[#4fb0a5]/10 text-[#12312d] flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5 text-[#4fb0a5]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
              <p className="text-slate-500 text-[11px]">ปรับแต่งตัวเลือกพิเศษ & รายละเอียดความต้องการ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Option: Special or Regular */}
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
                    ? 'bg-[#12312d] text-white border-[#12312d] shadow-sm'
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
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                พิเศษ (+10฿)
              </button>
            </div>
          </div>

          {/* Option: Dining in vs Takeaway */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">รูปแบบการทาน</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiningOption('ทานที่ร้าน')}
                className={`py-2 px-3 rounded-2xl font-bold transition-all border ${
                  diningOption === 'ทานที่ร้าน'
                    ? 'bg-[#12312d] text-white border-[#12312d] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🍽️ ทานที่ร้าน (Dine-in)
              </button>
              <button
                type="button"
                onClick={() => setDiningOption('กลับบ้าน')}
                className={`py-2 px-3 rounded-2xl font-bold transition-all border ${
                  diningOption === 'กลับบ้าน'
                    ? 'bg-[#4fb0a5] text-slate-950 border-[#4fb0a5] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🥡 ใส่กล่องกลับบ้าน (Takeaway)
              </button>
            </div>
          </div>

          {/* Option: Spiciness */}
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
                  className={`py-2 px-1 rounded-xl text-center font-bold text-[11px] transition-all border ${
                    spiciness === lvl
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Option Tags */}
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
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#4fb0a5]/20 text-[#12312d] border-[#4fb0a5] font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tag} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Note input */}
          <div>
            <label className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5 text-slate-500" />
              <span>ระบุหมายเหตุเพิ่มเติม</span>
            </label>
            <input
              type="text"
              placeholder="เช่น ขอไม่ใส่พริกไทย, ขอน้ำปลาพริกเพิ่ม, ใส่ไข่ดาวไม่สุก"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30 text-slate-800"
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
            className="px-5 py-2 rounded-xl font-bold bg-[#12312d] text-white hover:bg-[#1a423d] shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> บันทึกตัวเลือก
          </button>
        </div>
      </form>
    </div>
  );
};
