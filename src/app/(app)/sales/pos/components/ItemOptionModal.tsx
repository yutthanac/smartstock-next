'use client';

import React, { useState } from 'react';
import { X, Coffee, Sparkles, Plus, Minus, Layers } from 'lucide-react';
import { MenuItem, MenuOptionIngredient } from '@/types';
import { Button } from '@/components/Button';
import { useStock } from '@/lib/StockContext';

import { CartItemOption, checkIsCoffee, checkIsSweetener, checkIsMilk } from '../hooks/useItemOptions';
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
  const [diningOption, setDiningOption] = useState<string>(initialOptions?.diningOption || 'ตัดแก้วพลาสติก');
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

  // Quick options dynamically matched against store inventory
  const quickOptionList: {
    name: string;
    price: number;
    isService?: boolean;
    ingredientId?: number;
    inStock: boolean;
    stockQty?: number;
    unit?: string;
  }[] = React.useMemo(() => {
    const list: {
      name: string;
      price: number;
      isService?: boolean;
      ingredientId?: number;
      inStock: boolean;
      stockQty?: number;
      unit?: string;
    }[] = [
      { name: 'แยกน้ำแข็ง', price: 0, isService: true, inStock: true },
    ];

    const ADDON_CANDIDATES = [
      { name: 'วิปครีม', price: 15, keywords: ['วิปครีม', 'whipping', 'วิปปิ้งครีม', 'whip'] },
      { name: 'ซอสคาราเมล', price: 10, keywords: ['คาราเมล', 'caramel'] },
      { name: 'บุกคริสตัล', price: 10, keywords: ['บุก', 'คริสตัล', 'crystal'] },
      { name: 'ไข่มุก', price: 10, keywords: ['ไข่มุก', 'boba', 'pearl'] },
      { name: 'ผงโกโก้', price: 10, keywords: ['โกโก้', 'cocoa'] },
      { name: 'ซอสช็อกโกแลต', price: 10, keywords: ['ช็อกโกแลต', 'chocolate'] },
    ];

    ADDON_CANDIDATES.forEach((cand) => {
      const matched = ingredients.find((ing) => {
        const lower = (ing.name || '').toLowerCase();
        return cand.keywords.some((kw) => lower.includes(kw.toLowerCase()));
      });

      if (matched) {
        const stockQty = Number(matched.quantity) || 0;
        const inStock = stockQty > 0 && matched.status !== 'out';
        list.push({
          name: cand.name,
          price: cand.price,
          isService: false,
          ingredientId: matched.id,
          inStock,
          stockQty,
          unit: matched.unit,
        });
      }
    });

    ingredients.forEach((ing) => {
      const cat = (ing.category || '').toLowerCase();
      if (['topping', 'ท็อปปิ้ง', 'modifier', 'ส่วนผสมเสริม'].includes(cat)) {
        if (!list.some((q) => q.ingredientId === ing.id || q.name === ing.name)) {
          const stockQty = Number(ing.quantity) || 0;
          const inStock = stockQty > 0 && ing.status !== 'out';
          list.push({
            name: ing.name,
            price: ing.cost_per_unit > 0 ? Math.ceil(Number(ing.cost_per_unit) * 1.5 / 5) * 5 || 10 : 10,
            isService: false,
            ingredientId: ing.id,
            inStock,
            stockQty,
            unit: ing.unit,
          });
        }
      }
    });

    return list;
  }, [ingredients]);

  const quickTags = quickOptionList.map((q) => q.name);

  const handleToggleTag = (tag: string) => {
    const opt = quickOptionList.find((q) => q.name === tag);
    if (!opt) return;

    if (!opt.isService && !opt.inStock) {
      return; // Cannot toggle out-of-stock items
    }

    if (opt.price > 0) {
      setSelectedModifiers((prev) => {
        const exists = prev.some((m) => m.name === opt.name);
        if (exists) {
          return prev.filter((m) => m.name !== opt.name);
        } else {
          return [
            ...prev,
            {
              id: opt.ingredientId ?? (99000 + Math.abs(opt.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))),
              ingredient_id: opt.ingredientId,
              name: opt.name,
              price: opt.price,
              quantity: 1,
              ingredient_name: opt.name,
              ingredient_unit: opt.unit || 'ที่',
            } as MenuOptionIngredient,
          ];
        }
      });
    } else {
      const currentTags = customNote
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (currentTags.includes(tag)) {
        setCustomNote(currentTags.filter((t) => t !== tag).join(', '));
      } else {
        setCustomNote([...currentTags, tag].join(', '));
      }
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

  // 1. Calculate total sweetener volume reduction & find primary milk ingredient
  let totalSweetenerReduction = 0;
  let primaryMilkRecipeId: number | null = null;
  let maxMilkQty = 0;

  (item.recipes || []).forEach((r) => {
    const ing = ingredients.find((i) => i.id === r.ingredient_id);
    const ingName = ing ? ing.name : (r.ingredient_name || '');
    const ingCat = ing?.category || '';
    const baseQty = r.quantity_used || 0;

    if (checkIsSweetener(ingName, ingCat)) {
      totalSweetenerReduction += baseQty * (1.0 - sweetnessMultiplier);
    } else if (checkIsMilk(ingName, ingCat)) {
      if (baseQty > maxMilkQty) {
        maxMilkQty = baseQty;
        primaryMilkRecipeId = r.ingredient_id;
      }
    }
  });

  // 2. Map preview deductions
  const previewDeductions = (item.recipes || []).map((r) => {
    const ing = ingredients.find((i) => i.id === r.ingredient_id);
    const ingName = ing ? ing.name : (r.ingredient_name || 'วัตถุดิบ');
    const ingUnit = ing ? ing.unit : (r.ingredient_unit || 'หน่วย');
    const ingCat = ing?.category || '';
    const ingCurrent = ing ? ing.quantity : 0;
    const baseQty = r.quantity_used || 0;

    const isCoffee = checkIsCoffee(ingName, ingCat);
    const isSweetener = checkIsSweetener(ingName, ingCat);
    const isPrimaryMilk = (r.ingredient_id === primaryMilkRecipeId);

    let mult = 1.0;
    let badgeText = '';
    let effectiveQty = baseQty;

    if (isCoffee && extraShots > 0) {
      mult = 1.0 + extraShots;
      effectiveQty = baseQty * mult;
      badgeText = `+${extraShots} ช็อต`;
    } else if (isSweetener) {
      mult = sweetnessMultiplier;
      effectiveQty = baseQty * mult;
      if (sweetnessMultiplier === 0) badgeText = 'ไม่หวาน (0%)';
      else if (sweetnessMultiplier < 1) badgeText = `หวานน้อย (${Math.round(sweetnessMultiplier * 100)}%)`;
      else if (sweetnessMultiplier > 1) badgeText = `หวานมาก (${Math.round(sweetnessMultiplier * 100)}%)`;
    } else if (isPrimaryMilk && Math.abs(totalSweetenerReduction) > 0.001) {
      effectiveQty = Math.max(0, baseQty + totalSweetenerReduction);
      const diffSign = totalSweetenerReduction > 0 ? '+' : '';
      const diffRound = Math.round(totalSweetenerReduction * 10) / 10;
      badgeText = totalSweetenerReduction > 0
        ? `เติมนมสด ${diffSign}${diffRound} ${ingUnit}`
        : `ลดนมสด ${diffRound} ${ingUnit}`;
    }

    const ingUnitLower = (ingUnit || '').toLowerCase().trim();
    let unitFactor = 1.0;
    if (['กก.', 'กก', 'kg', 'กิโลกรัม'].includes(ingUnitLower) && effectiveQty >= 1) {
      unitFactor = 0.001;
    } else if (['ลิตร', 'l', 'liter', 'litre'].includes(ingUnitLower) && effectiveQty >= 1) {
      unitFactor = 0.001;
    }

    const deductedQty = Number((effectiveQty * unitFactor).toFixed(3));
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

  const isTakeaway =
    diningOption === 'ตัดแก้วพลาสติก' ||
    diningOption === 'ตัดแก้ว' ||
    diningOption === 'กลับบ้าน' ||
    diningOption.includes('ตัดแก้ว') ||
    customNote.includes('กลับบ้าน') ||
    customNote.includes('ตัดแก้ว');
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
                { label: 'เย็น', value: 'เย็น' },
                { label: 'ร้อน', value: 'ร้อน' },
                { label: 'ปั่น (+10฿)', value: 'ปั่น (+10฿)' },
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

          {/* Option: Cup / Plastic cup deduction */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1">การใช้แก้ว / รูปแบบการเสิร์ฟ</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiningOption('ตัดแก้วพลาสติก')}
                className={`py-2.5 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                  diningOption === 'ตัดแก้วพลาสติก' || diningOption === 'กลับบ้าน'
                    ? 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] shadow-xs font-semibold'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                ตัดแก้วพลาสติก
              </button>
              <button
                type="button"
                onClick={() => setDiningOption('ไม่ตัดแก้ว')}
                className={`py-2.5 px-3 rounded-xl font-medium transition-all border cursor-pointer ${
                  diningOption === 'ไม่ตัดแก้ว' || diningOption === 'ทานที่ร้าน'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                ไม่ตัดแก้ว (แก้วร้าน)
              </button>
            </div>
          </div>
          {/* Dynamic Option Modifiers Chips with Stock Check */}
          {availableOptions.length > 0 && (
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5 text-xs">
                ตัวเลือกเสริม (ตัดสต็อกอัตโนมัติ)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableOptions.map((opt) => {
                  const linkedIng = ingredients.find((i) => i.id === opt.ingredient_id);
                  const stockQty = Number(linkedIng?.quantity) || 0;
                  const inStock = linkedIng ? (stockQty >= (opt.quantity || 1) && linkedIng.status !== 'out') : true;
                  const isSelected = selectedModifiers.some((m) => m.id === opt.id || m.name === opt.name);

                  if (!inStock) {
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={true}
                        title={`วัตถุดิบหมด (คงเหลือ: ${stockQty} ${linkedIng?.unit || ''})`}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium border bg-stone-100/70 text-stone-400 border-stone-200 cursor-not-allowed opacity-50 flex items-center gap-1.5"
                      >
                        <span className="line-through">{opt.name}</span>
                        <span className="text-[10px] text-rose-500 font-semibold">(หมด)</span>
                      </button>
                    );
                  }

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

          {/* Quick Tags / Options with Stock Check */}
          {quickOptionList.length > 0 && (
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5">ตัวเลือกด่วน</label>
              <div className="flex flex-wrap gap-1.5">
                {quickOptionList.map((q) => {
                  const isSelected = selectedModifiers.some((m) => m.name === q.name) || customNote.split(',').map((t) => t.trim()).includes(q.name);

                  if (!q.isService && !q.inStock) {
                    return (
                      <button
                        key={q.name}
                        type="button"
                        disabled={true}
                        title={`วัตถุดิบหมด (คงเหลือ: ${q.stockQty || 0} ${q.unit || ''})`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-stone-100/70 text-stone-400 border-stone-200 cursor-not-allowed opacity-50 flex items-center gap-1.5"
                      >
                        <span className="line-through">{q.name}</span>
                        <span className="text-[10px] text-rose-500 font-semibold">(หมด)</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={q.name}
                      type="button"
                      onClick={() => handleToggleTag(q.name)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>{q.name}</span>
                      {q.price > 0 && (
                        <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-amber-200' : 'text-amber-700'}`}>
                          (+฿{q.price})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                        บรรจุภัณฑ์ / แก้วพลาสติก
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
