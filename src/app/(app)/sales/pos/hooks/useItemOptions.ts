'use client';

import { useState, useEffect } from 'react';
import { MenuItem, MenuOptionIngredient, Ingredient } from '@/types';

export interface CartItemOption {
  temperature?: string;
  sweetness?: string;
  diningOption: string;
  extraShots: number;
  /** @deprecated use extraShots */
  isSpecial?: boolean;
  spiciness?: string;
  customNote: string;
  selectedModifiers?: MenuOptionIngredient[];
}

export interface ItemPreviewDeduction {
  id: string;
  name: string;
  unit: string;
  baseQty: number;
  deductedQty: number;
  currentQty: number;
  remainingQty: number;
  badgeText: string;
  isSweetener: boolean;
  isCoffee: boolean;
  isModifier?: boolean;
}

// Shared sweetener keyword detector
export function checkIsSweetener(name: string, category?: string): boolean {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  return (
    n.includes('ไซรัป') || n.includes('syrup') ||
    n.includes('นมข้น') || n.includes('ข้นหวาน') ||
    n.includes('น้ำตาล') || n.includes('น้ำเชื่อม') ||
    n.includes('น้ำผึ้ง') || n.includes('honey') ||
    n.includes('คาราเมล') || n.includes('caramel') ||
    n.includes('วานิลลา') || n.includes('vanilla') ||
    n.includes('มะลิ') || n.includes('mali') ||
    n.includes('คาร์เนชัน') || n.includes('carnation') ||
    n.includes('ทีพอท') || n.includes('teapot') ||
    n.includes('falcon') || n.includes('นกเหยี่ยว') ||
    n.includes('condensed') || n.includes('sweetener') ||
    n.includes('stevia') || n.includes('หญ้าหวาน') ||
    n.includes('หล่อฮังก๊วย') ||
    c.includes('ไซรัป') || c.includes('syrup') ||
    c.includes('สารให้ความหวาน') || c.includes('ความหวาน')
  );
}

export function checkIsCoffee(name: string, category?: string): boolean {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  return (
    n.includes('เมล็ดกาแฟ') || n.includes('กาแฟคั่ว') ||
    (n.includes('กาแฟ') && !n.includes('แก้ว')) ||
    n.includes('espresso') || n.includes('เอสเพรสโซ') ||
    c.includes('เมล็ดกาแฟ') ||
    (c.includes('กาแฟ') && !c.includes('แก้ว'))
  );
}

export function getSweetnessMultiplier(sweetness: string, customNote: string): number {
  if (customNote.includes('ไม่ใส่ไซรัป')) return 0.0;
  if (sweetness.includes('125%') || sweetness.includes('หวานมาก')) return 1.25;
  if (sweetness.includes('100%') || sweetness === 'หวาน') return 1.0;
  if (sweetness.includes('75%')) return 0.75;
  if (sweetness.includes('50%') || sweetness.includes('หวานน้อย')) return 0.5;
  if (sweetness.includes('25%')) return 0.25;
  if (sweetness.includes('0%') || sweetness.includes('ไม่หวาน')) return 0.0;
  return 1.0;
}

interface UseItemOptionsArgs {
  item: MenuItem | null;
  initialOptions?: CartItemOption;
  ingredients: Ingredient[];
  getMenuOptions: () => Promise<MenuOptionIngredient[]>;
  isActive?: boolean; // only load when open
}

export function useItemOptions({
  item,
  initialOptions,
  ingredients,
  getMenuOptions,
  isActive = true,
}: UseItemOptionsArgs) {
  const initShots = initialOptions?.extraShots ?? (initialOptions?.isSpecial ? 1 : 0);

  const [temperature, setTemperature] = useState(initialOptions?.temperature || 'เย็น');
  const [sweetness, setSweetness] = useState(initialOptions?.sweetness || 'หวาน 100%');
  const [diningOption, setDiningOption] = useState(initialOptions?.diningOption || 'ทานที่ร้าน');
  const [extraShots, setExtraShots] = useState(initShots);
  const [customNote, setCustomNote] = useState(initialOptions?.customNote || '');
  const [availableOptions, setAvailableOptions] = useState<MenuOptionIngredient[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<MenuOptionIngredient[]>(
    initialOptions?.selectedModifiers || []
  );

  // Reset when item/initialOptions change
  useEffect(() => {
    if (!item) return;
    const shots = initialOptions?.extraShots ?? (initialOptions?.isSpecial ? 1 : 0);
    setTemperature(initialOptions?.temperature || 'เย็น');
    setSweetness(initialOptions?.sweetness || 'หวาน 100%');
    setDiningOption(initialOptions?.diningOption || 'ทานที่ร้าน');
    setExtraShots(shots);
    setCustomNote(initialOptions?.customNote || '');
    setSelectedModifiers(initialOptions?.selectedModifiers || []);
  }, [item, initialOptions]);

  // Load add-on modifiers
  useEffect(() => {
    if (!item || !isActive) return;
    if (item.option_ingredients && item.option_ingredients.length > 0) {
      setAvailableOptions(item.option_ingredients);
    } else {
      getMenuOptions().then((opts) => {
        const matching = opts.filter((o) => !o.menu_item_id || o.menu_item_id === item.id);
        setAvailableOptions(matching);
      });
    }
  }, [item, isActive]);

  // Quick tags
  const quickTags = ['แยกน้ำแข็ง', 'วิปครีม'];
  const handleToggleTag = (tag: string) => {
    const current = customNote.split(',').map((t) => t.trim()).filter(Boolean);
    if (current.includes(tag)) {
      setCustomNote(current.filter((t) => t !== tag).join(', '));
    } else {
      setCustomNote([...current, tag].join(', '));
    }
  };

  // Modifier toggle
  const handleToggleModifier = (opt: MenuOptionIngredient) => {
    setSelectedModifiers((prev) => {
      const exists = prev.some((m) => m.id === opt.id || m.name === opt.name);
      return exists
        ? prev.filter((m) => m.id !== opt.id && m.name !== opt.name)
        : [...prev, opt];
    });
  };

  // Price calculation
  const blendExtra = temperature === 'ปั่น (+10฿)' ? 10 : 0;
  const modifierTotal = selectedModifiers.reduce((s, m) => s + (Number(m.price) || 0), 0);
  const currentPrice = (item?.price ?? 0) + extraShots * 15 + blendExtra + modifierTotal;

  // Sweetness multiplier
  const sweetnessMultiplier = getSweetnessMultiplier(sweetness, customNote);

  // Sweeteners in recipe
  const recipeSweeteners: string[] = [];
  (item?.recipes || []).forEach((r) => {
    const ing = ingredients.find((i) => i.id === r.ingredient_id);
    const ingName = ing?.name ?? r.ingredient_name ?? '';
    const ingCat = ing?.category ?? '';
    if (checkIsSweetener(ingName, ingCat) && !recipeSweeteners.includes(ingName)) {
      recipeSweeteners.push(ingName);
    }
  });

  // BOM preview deductions
  const previewDeductions: ItemPreviewDeduction[] = (item?.recipes || []).map((r) => {
    const ing = ingredients.find((i) => i.id === r.ingredient_id);
    const ingName = ing?.name ?? r.ingredient_name ?? 'วัตถุดิบ';
    const ingUnit = ing?.unit ?? r.ingredient_unit ?? 'หน่วย';
    const ingCurrent = ing?.quantity ?? 0;
    const baseQty = r.quantity_used || 0;

    const isCoffee = checkIsCoffee(ingName, ing?.category);
    const isSweetener = checkIsSweetener(ingName, ing?.category);

    let mult = 1.0;
    let badgeText = '';
    if (isCoffee && extraShots > 0) {
      mult = 1.0 + extraShots;
      badgeText = `+${extraShots} ช็อต`;
    } else if (isSweetener) {
      mult = sweetnessMultiplier;
      if (mult === 0) badgeText = 'ไม่หวาน';
      else if (mult < 1) badgeText = 'หวานน้อย';
      else if (mult > 1) badgeText = 'หวานมาก';
    }

    // Unit conversion guard
    const ingUnitLower = ingUnit.toLowerCase().trim();
    let unitFactor = 1.0;
    if (['กก.', 'กก', 'kg', 'กิโลกรัม'].includes(ingUnitLower) && baseQty >= 1) unitFactor = 0.001;
    else if (['ลิตร', 'l', 'liter', 'litre'].includes(ingUnitLower) && baseQty >= 1) unitFactor = 0.001;

    const deductedQty = Number((baseQty * mult * unitFactor).toFixed(3));

    return {
      id: `base-${r.ingredient_id}`,
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

  const modifierDeductions: ItemPreviewDeduction[] = selectedModifiers.map((mod) => {
    const ing = ingredients.find((i) => i.id === mod.ingredient_id);
    const ingName = ing?.name ?? mod.ingredient_name ?? 'วัตถุดิบเสริม';
    const ingUnit = ing?.unit ?? mod.ingredient_unit ?? 'หน่วย';
    const ingCurrent = ing ? Number(ing.quantity) : 0;
    const deductQty = Number(mod.quantity) || 1;

    return {
      id: `mod-${mod.id}-${mod.name}`,
      name: `${ingName} (+${mod.name})`,
      unit: ingUnit,
      baseQty: deductQty,
      deductedQty: deductQty,
      currentQty: ingCurrent,
      remainingQty: Math.max(0, Math.round((ingCurrent - deductQty) * 10) / 10),
      badgeText: `+฿${mod.price}`,
      isSweetener: false,
      isCoffee: false,
      isModifier: true,
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

  const buildResult = (): CartItemOption => ({
    temperature,
    sweetness,
    extraShots,
    diningOption,
    customNote: customNote.trim(),
    selectedModifiers,
  });

  return {
    // State
    temperature, setTemperature,
    sweetness, setSweetness,
    diningOption, setDiningOption,
    extraShots, setExtraShots,
    customNote, setCustomNote,
    availableOptions,
    selectedModifiers,
    // Handlers
    handleToggleTag,
    handleToggleModifier,
    quickTags,
    // Computed
    currentPrice,
    sweetnessMultiplier,
    recipeSweeteners,
    allPreviewDeductions,
    isTakeaway,
    takeawayCup,
    buildResult,
  };
}
