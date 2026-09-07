'use client';

import React, { useState } from 'react';
import { X, Coffee, Sparkles, Plus, Minus, Layers } from 'lucide-react';
import { MenuItem } from '@/types';
import { Button } from '@/components/Button';
import { useStock } from '@/lib/StockContext';

export interface CartItemOption {
  temperature?: string; // 'เย็น' | 'ร้อน' | 'ปั่น (+10฿)'
  sweetness?: string;   // 'ไม่หวาน (0%)' | 'หวานน้อย (50%)' | 'หวาน 100%' | 'หวานมาก'
  diningOption: string; // 'ทานที่ร้าน' | 'กลับบ้าน'
  extraShots: number;   // จำนวนช็อตเพิ่ม (0 = ปกติ, 1+ = +15฿/ช็อต) — replaces isSpecial
  /** @deprecated use extraShots instead */
  isSpecial?: boolean;
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
  const { ingredients } = useStock();
  if (!isOpen || !item) return null;

  // Normalise legacy isSpecial → extraShots
  const initShots = initialOptions?.extraShots ?? (initialOptions?.isSpecial ? 1 : 0);

  const [temperature, setTemperature] = useState<string>(initialOptions?.temperature || 'เย็น');
  const [sweetness, setSweetness] = useState<string>(initialOptions?.sweetness || 'หวาน 100%');
  const [diningOption, setDiningOption] = useState<string>(initialOptions?.diningOption || 'ทานที่ร้าน');
  const [extraShots, setExtraShots] = useState<number>(initShots);
  const [customNote, setCustomNote] = useState<string>(initialOptions?.customNote || '');

  const quickTags = ['แยกน้ำแข็ง', 'วิปครีม', 'ไม่ใส่ไซรัป'];

  const handleToggleTag = (tag: string) => {
    const currentTags = customNote
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (currentTags.includes(tag)) {
      setCustomNote(currentTags.filter((t) => t !== tag).join(', '));
    } else {
      setCustomNote([...currentTags, tag].join(', '));
    }
  };

  const blendExtra = temperature === 'ปั่น (+10฿)' ? 10 : 0;
  const currentPrice = item.price + extraShots * 15 + blendExtra;

  // Real-time BOM stock calculation based on live options
  let sweetnessMultiplier = 1.0;
  if (customNote.includes('ไม่ใส่ไซรัป')) {
    sweetnessMultiplier = 0.0;
  } else if (sweetness.includes('125%') || sweetness.includes('หวานมาก')) {
    sweetnessMultiplier = 1.25;
  } else if (sweetness.includes('100%')) {
    sweetnessMultiplier = 1.0;
  } else if (sweetness.includes('75%')) {
    sweetnessMultiplier = 0.75;
  } else if (sweetness.includes('50%') || sweetness.includes('หวานน้อย')) {
    sweetnessMultiplier = 0.50;
  } else if (sweetness.includes('25%')) {
    sweetnessMultiplier = 0.25;
  } else if (sweetness.includes('0%') || sweetness.includes('ไม่หวาน')) {
    sweetnessMultiplier = 0.0;
  }

  const previewDeductions = (item.recipes || []).map((r) => {
    const ing = ingredients.find((i) => i.id === r.ingredient_id);
    const ingName = ing ? ing.name : (r.ingredient_name || 'วัตถุดิบ');
    const ingUnit = ing ? ing.unit : (r.ingredient_unit || 'หน่วย');
    const ingCurrent = ing ? ing.quantity : 0;
    const baseQty = r.quantity_used || 0;

    const ingNameLower = ingName.toLowerCase();
    const ingCatLower = (ing?.category || '').toLowerCase();

    const isCoffee =
      (ingNameLower.includes('เมล็ดกาแฟ') ||
        ingNameLower.includes('กาแฟคั่ว') ||
        (ingNameLower.includes('กาแฟ') && !ingNameLower.includes('แก้ว'))) ||
      (ingCatLower.includes('เมล็ดกาแฟ') ||
        (ingCatLower.includes('กาแฟ') && !ingCatLower.includes('แก้ว')));
    const isSweetener =
      ingNameLower.includes('ไซรัป') ||
      ingNameLower.includes('syrup') ||
      ingNameLower.includes('นมข้นหวาน') ||
      ingNameLower.includes('น้ำผึ้ง') ||
      ingNameLower.includes('น้ำเชื่อม') ||
      ingCatLower.includes('ไซรัป');

    let mult = 1.0;
    let badgeText = '';
    if (isCoffee && extraShots > 0) {
      mult = 1.0 + extraShots;
      badgeText = `+${extraShots} ช็อต`;
    } else if (isSweetener) {
      mult = sweetnessMultiplier;
      if (sweetnessMultiplier === 0) badgeText = 'ไม่หวาน (0%)';
      else if (sweetnessMultiplier < 1) badgeText = `ลดหวาน (${Math.round(sweetnessMultiplier * 100)}%)`;
      else if (sweetnessMultiplier > 1) badgeText = `เพิ่มหวาน (${Math.round(sweetnessMultiplier * 100)}%)`;
    }

    const ingUnitLower = (ingUnit || '').toLowerCase().trim();
    let unitFactor = 1.0;
    if (['กก.', 'กก', 'kg', 'กิโลกรัม'].includes(ingUnitLower) && baseQty >= 1) {
      unitFactor = 0.001;
    } else if (['ลิตร', 'l', 'liter', 'litre'].includes(ingUnitLower) && baseQty >= 1) {
      unitFactor = 0.001;
    }

    const deductedQty = Number((baseQty * mult * unitFactor).toFixed(3));
    return {
      id: r.ingredient_id,
      name: ingName,
      unit: ingUnit,
      baseQty,
      deductedQty,
      currentQty: ingCurrent,
      remainingQty: Math.max(0, Number((ingCurrent - deductedQty).toFixed(2))),
      isSweetener,
      isCoffee,
      badgeText,
    };
  });

  const isTakeaway = diningOption === 'กลับบ้าน' || customNote.includes('กลับบ้าน');
  const takeawayCup = isTakeaway
    ? ingredients.find(
        (i) =>
          i.name.toLowerCase().includes('แก้ว') &&
          !i.name.toLowerCase().includes('เมล็ด')
      )
    : null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      temperature,
      sweetness,
      diningOption,
      extraShots,
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
          <div className="text-right">
            <span className="font-semibold text-base text-slate-900">฿{currentPrice.toFixed(2)}</span>
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
              {[
                { label: '🧊 เย็น', value: 'เย็น' },
                { label: '☕ ร้อน', value: 'ร้อน' },
                { label: '🥤 ปั่น (+10฿)', value: 'ปั่น (+10฿)' },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTemperature(value)}
                  className={`py-2.5 px-2 rounded-xl font-medium transition-all border text-center cursor-pointer ${
                    temperature === value
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
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

          {/* Option: Extra Shots */}
          <div>
            <label className="font-medium text-slate-700 block mb-1.5 flex items-center gap-1">
              <span>ช็อตเอสเพรสโซ่</span>
              <span className="ml-1 text-slate-400 font-normal">(+15฿ / ช็อตเพิ่ม)</span>
            </label>
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 w-fit">
              <button
                type="button"
                onClick={() => setExtraShots(Math.max(0, extraShots - 1))}
                disabled={extraShots === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="text-center w-24">
                <span className="font-bold text-slate-900 text-lg font-mono">{extraShots}</span>
                <span className="text-slate-500 ml-1.5 text-xs">
                  {extraShots === 0 ? 'ช็อตปกติ' : `ช็อตเพิ่ม ${extraShots > 0 ? `(+฿${extraShots * 15})` : ''}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExtraShots(Math.min(3, extraShots + 1))}
                disabled={extraShots === 3}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
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
                className={`py-2.5 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
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
                className={`py-2.5 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                  diningOption === 'กลับบ้าน'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🥤 กลับบ้าน (Takeaway)
              </button>
            </div>
            {diningOption === 'กลับบ้าน' && (
              <p className="text-[10px] text-emerald-700 mt-1.5 font-medium">
                ✓ ระบบจะตัดสต็อกแก้ว Takeaway อัตโนมัติ
              </p>
            )}
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
                    customNote.split(',').map((t) => t.trim()).includes(tag)
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

          {/* Real-time BOM Stock Deduction Preview */}
          <div className="p-3 rounded-2xl bg-slate-100/90 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span>ตัดสต็อกแก้วนี้ (Preview)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {previewDeductions.length + (takeawayCup ? 1 : 0)} รายการ
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {previewDeductions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-slate-900 truncate flex items-center gap-1">
                      <span>{d.name}</span>
                      {d.badgeText && (
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold ${
                            d.deductedQty === 0
                              ? 'bg-rose-100 text-rose-700'
                              : d.isSweetener && d.deductedQty < d.baseQty
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {d.badgeText}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      เดิม {d.currentQty} {d.unit}{' '}
                      {d.deductedQty !== d.baseQty ? `(สูตร ${d.baseQty} ${d.unit})` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <div
                      className={`font-semibold ${
                        d.deductedQty === 0 ? 'text-slate-400 line-through' : 'text-rose-600'
                      }`}
                    >
                      -{d.deductedQty} {d.unit}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      เหลือ {d.remainingQty} {d.unit}
                    </div>
                  </div>
                </div>
              ))}

              {takeawayCup && (
                <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-slate-900 truncate flex items-center gap-1">
                      <span>{takeawayCup.name}</span>
                      <span className="text-[9.5px] bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded font-semibold">
                        🥤 บรรจุภัณฑ์กลับบ้าน
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      เดิม {takeawayCup.quantity} {takeawayCup.unit}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <div className="font-semibold text-rose-600">-1 {takeawayCup.unit}</div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      เหลือ {Math.max(0, takeawayCup.quantity - 1)} {takeawayCup.unit}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">
            ราคารวม: <span className="font-bold text-slate-900 font-mono">฿{currentPrice.toFixed(2)}</span>
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary">
              ยืนยัน
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
