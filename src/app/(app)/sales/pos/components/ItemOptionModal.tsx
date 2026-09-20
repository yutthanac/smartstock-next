'use client';

import React, { useState } from 'react';
import { X, Coffee, Sparkles, Plus, Minus, Layers } from 'lucide-react';
import { MenuItem, MenuOptionIngredient } from '@/types';
import { Button } from '@/components/Button';
import { useStock } from '@/lib/StockContext';

import { CartItemOption } from '../hooks/useItemOptions';
export type { CartItemOption } from '../hooks/useItemOptions';

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
  const { ingredients, getMenuOptions } = useStock();
  if (!isOpen || !item) return null;

  // Normalise legacy isSpecial → extraShots
  const initShots = initialOptions?.extraShots ?? (initialOptions?.isSpecial ? 1 : 0);

  const [temperature, setTemperature] = useState<string>(initialOptions?.temperature || 'เย็น');
  const [sweetness, setSweetness] = useState<string>(initialOptions?.sweetness || 'หวาน 100%');
  const [diningOption, setDiningOption] = useState<string>(initialOptions?.diningOption || 'ทานที่ร้าน');
  const [extraShots, setExtraShots] = useState<number>(initShots);
  const [customNote, setCustomNote] = useState<string>(initialOptions?.customNote || '');
  const [availableOptions, setAvailableOptions] = useState<MenuOptionIngredient[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<MenuOptionIngredient[]>(initialOptions?.selectedModifiers || []);

  React.useEffect(() => {
    if (isOpen) {
      if (item?.option_ingredients && item.option_ingredients.length > 0) {
        setAvailableOptions(item.option_ingredients);
      } else {
        getMenuOptions().then((opts) => {
          const matching = opts.filter((o) => !o.menu_item_id || o.menu_item_id === item?.id);
          setAvailableOptions(matching);
        });
      }
    }
  }, [isOpen, item]);

  const quickTags = ['แยกน้ำแข็ง', 'วิปครีม'];

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
  const modifierTotal = selectedModifiers.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
  const currentPrice = item.price + extraShots * 15 + blendExtra + modifierTotal;

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
      if (sweetnessMultiplier === 0) badgeText = 'ไม่หวาน';
      else if (sweetnessMultiplier < 1) badgeText = 'หวานน้อย';
      else if (sweetnessMultiplier > 1) badgeText = 'หวานมาก';
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

  const modifierDeductions = selectedModifiers.map((mod) => {
    const ing = ingredients.find((i) => i.id === mod.ingredient_id);
    const ingName = ing ? ing.name : (mod.ingredient_name || 'วัตถุดิบเสริม');
    const ingUnit = ing ? ing.unit : (mod.ingredient_unit || 'หน่วย');
    const ingCurrent = ing ? Number(ing.quantity) : 0;
    const deductQty = Number(mod.quantity) || 1;
    const remaining = Math.max(0, ingCurrent - deductQty);

    return {
      id: `mod-${mod.id}`,
      name: `${ingName} (+${mod.name})`,
      unit: ingUnit,
      baseQty: deductQty,
      deductedQty: deductQty,
      currentQty: ingCurrent,
      remainingQty: Math.round(remaining * 10) / 10,
      badgeText: 'ตัวเลือกเสริม',
      isSweetener: false,
    };
  });

  const allPreviewDeductions = [...previewDeductions, ...modifierDeductions];

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
      selectedModifiers,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-stone-200 animate-scale-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center font-bold">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">{item.name}</h3>
              <p className="text-stone-500 text-xs">เลือกอุณหภูมิ ความหวาน และรายละเอียด</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-base text-stone-900 font-mono tabular-nums">฿{currentPrice.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Option: Temperature */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1">อุณหภูมิ</label>
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
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Option: Sweetness */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1">ระดับความหวาน</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'ไม่หวาน', val: 'ไม่หวาน' },
                { label: 'หวานน้อย', val: 'หวานน้อย' },
                { label: 'ปกติ', val: 'หวาน' },
                { label: 'หวานมาก', val: 'หวานมาก' },
              ].map(({ label, val }) => {
                const isSelected = sweetness === val || (val === 'หวาน' && (sweetness === 'หวาน 100%' || sweetness === 'หวาน'));
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSweetness(val === 'หวาน' ? 'หวาน' : val)}
                    className={`py-2 px-1 rounded-xl font-medium text-xs transition-all border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option: Extra Shots */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1.5 flex items-center gap-1">
              <span>ช็อตเอสเพรสโซ่</span>
              <span className="ml-1 text-stone-400 font-normal">(+15฿ / ช็อตเพิ่ม)</span>
            </label>
            <div className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200 w-fit">
              <button
                type="button"
                onClick={() => setExtraShots(Math.max(0, extraShots - 1))}
                disabled={extraShots === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-stone-200 shadow-xs text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="text-center w-24">
                <span className="font-bold text-stone-900 text-lg font-mono tabular-nums">{extraShots}</span>
                <span className="text-stone-500 ml-1.5 text-xs">
                  {extraShots === 0 ? 'ช็อตปกติ' : `ช็อตเพิ่ม ${extraShots > 0 ? `(+฿${extraShots * 15})` : ''}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExtraShots(Math.min(3, extraShots + 1))}
                disabled={extraShots === 3}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-stone-200 shadow-xs text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Option: Dine-in vs Takeaway */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1">รูปแบบการเสิร์ฟ</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiningOption('ทานที่ร้าน')}
                className={`py-2.5 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                  diningOption === 'ทานที่ร้าน'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                ☕ ทานที่ร้าน
              </button>
              <button
                type="button"
                onClick={() => setDiningOption('กลับบ้าน')}
                className={`py-2.5 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                  diningOption === 'กลับบ้าน'
                    ? 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] shadow-xs font-semibold'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                🥤 กลับบ้าน (Takeaway)
              </button>
            </div>
            {diningOption === 'กลับบ้าน' && (
              <p className="text-xs text-[#78350f] mt-1.5 font-medium">
                ✓ ระบบจะตัดสต็อกแก้ว Takeaway อัตโนมัติ
              </p>
            )}
          </div>

          {/* Dynamic Option Modifiers Chips */}
          {availableOptions.length > 0 && (
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5 text-xs">
                ตัวเลือกเสริม (ตัดสต็อกอัตโนมัติ)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableOptions.map((opt) => {
                  const isSelected = selectedModifiers.some((m) => m.id === opt.id || m.name === opt.name);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedModifiers(selectedModifiers.filter((m) => m.id !== opt.id && m.name !== opt.name));
                        } else {
                          setSelectedModifiers([...selectedModifiers, opt]);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>{opt.name}</span>
                      {opt.price > 0 && (
                        <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                          (+฿{opt.price})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Tags */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1.5">ตัวเลือกเพิ่มเติม</label>
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    customNote.split(',').map((t) => t.trim()).includes(tag)
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
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
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-900 text-xs"
            />
          </div>

          {/* Real-time BOM Stock Deduction Preview */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-800 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-600" />
                <span>Preview</span>
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {allPreviewDeductions.length + (takeawayCup ? 1 : 0)} รายการ
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {allPreviewDeductions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-stone-200/80 shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-stone-900 truncate flex items-center gap-1">
                      <span>{d.name}</span>
                      {d.badgeText && (
                        <span
                          className={`text-xs px-1.5 py-0.2 rounded font-semibold ${
                            d.deductedQty === 0
                              ? 'bg-rose-100 text-rose-700'
                              : d.isSweetener && d.deductedQty < d.baseQty
                              ? 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          {d.badgeText}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 font-mono tabular-nums">
                      เดิม {d.currentQty} {d.unit}{' '}
                      {d.deductedQty !== d.baseQty ? `(สูตร ${d.baseQty} ${d.unit})` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div
                      className={`font-semibold ${
                        d.deductedQty === 0 ? 'text-stone-400 line-through' : 'text-stone-900'
                      }`}
                    >
                      -{d.deductedQty} {d.unit}
                    </div>
                    <div className="text-xs text-stone-500 font-medium">
                      เหลือ {d.remainingQty} {d.unit}
                    </div>
                  </div>
                </div>
              ))}

              {takeawayCup && (
                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-stone-900 truncate flex items-center gap-1">
                      <span>{takeawayCup.name}</span>
                      <span className="text-xs bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-semibold border border-stone-200">
                        🥤 บรรจุภัณฑ์กลับบ้าน
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 font-mono tabular-nums">
                      เดิม {takeawayCup.quantity} {takeawayCup.unit}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="font-semibold text-stone-900">-1 {takeawayCup.unit}</div>
                    <div className="text-xs text-stone-500 font-medium">
                      เหลือ {Math.max(0, takeawayCup.quantity - 1)} {takeawayCup.unit}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <span className="text-xs text-stone-500">
            ราคารวม: <span className="font-bold text-stone-900 font-mono tabular-nums text-sm">฿{currentPrice.toFixed(2)}</span>
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100">
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl bg-stone-900 text-white hover:bg-stone-800">
              ยืนยัน
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
