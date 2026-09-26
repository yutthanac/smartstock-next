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
    n.includes('นมผสม') ||
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

// Shared milk & liquid base detector
export function checkIsMilk(name: string, category?: string): boolean {
  if (checkIsSweetener(name, category)) return false;
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('วิปครีม') || n.includes('whipping') || n.includes('ผง')) return false;
  return (
    n.includes('นมสด') || n.includes('นมจืด') ||
    n.includes('นมโอ๊ต') || n.includes('oat') ||
    n.includes('อัลมอนด์') || n.includes('almond') ||
    n.includes('ถั่วเหลือง') || n.includes('soy') ||
    n.includes('พาสเจอร์') || n.includes('meiji') || n.includes('เมจิ') ||
    n.includes('fresh milk') ||
    (n.includes('นม') && !n.includes('ข้น')) ||
    (c.includes('นม') && !c.includes('ข้น'))
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

export function getSweetnessMultiplier(sweetness: string, customNote: string = ''): number {
  const combined = `${sweetness || ''} ${customNote || ''}`;
  if (combined.includes('ไม่ใส่ไซรัป')) return 0.0;
  if (combined.includes('125%') || combined.includes('หวานมาก') || combined === 'มาก') return 1.25;
  if (combined.includes('100%')) return 1.0;
  if (combined.includes('75%')) return 0.75;
  if (combined.includes('50%') || combined.includes('หวานน้อย') || combined === 'น้อย') return 0.50;
  if (combined.includes('25%')) return 0.25;
  if (combined.includes('0%') || combined.includes('ไม่หวาน')) return 0.0;
  if (combined.includes('หวาน') || combined.includes('ปกติ')) return 1.0;
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
  const [diningOption, setDiningOption] = useState(initialOptions?.diningOption || 'ตัดแก้วพลาสติก');
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
    setDiningOption(initialOptions?.diningOption || 'ตัดแก้วพลาสติก');
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

  // Quick options dynamically matched against store inventory
  const quickOptionList: {
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

  // Candidates for beverage toppings / add-ons (ONLY added if the store actually has this ingredient in inventory)
  const TOPPING_CANDIDATES = [
    { name: 'วิปครีม', price: 15, keywords: ['วิปครีม', 'วิปปิ้งครีม', 'whipping', 'whip'] },
    { name: 'ซอสคาราเมล', price: 10, keywords: ['ซอสคาราเมล', 'ไซรัปคาราเมล', 'คาราเมล', 'caramel'] },
    { name: 'บุกคริสตัล', price: 10, keywords: ['บุกคริสตัล', 'บุก', 'crystal'] },
    { name: 'ไข่มุก', price: 10, keywords: ['ไข่มุก', 'boba', 'pearl'] },
    { name: 'ซอสช็อกโกแลต', price: 10, keywords: ['ซอสช็อกโกแลต', 'ซอสช็อค', 'chocolate sauce'] },
    { name: 'น้ำผึ้งแท้', price: 10, keywords: ['น้ำผึ้ง', 'honey'] },
    { name: 'นมโอ๊ต', price: 15, keywords: ['นมโอ๊ต', 'oatly', 'oat milk'] },
    { name: 'น้ำเชื่อมวานิลลา', price: 10, keywords: ['น้ำเชื่อมวานิลลา', 'ไซรัปวานิลลา', 'vanilla syrup'] },
  ];

  TOPPING_CANDIDATES.forEach((cand) => {
    // Check if ingredient exists in store inventory
    const matched = ingredients.find((ing) => {
      const lower = (ing.name || '').toLowerCase();
      return cand.keywords.some((kw) => lower.includes(kw.toLowerCase()));
    });

    if (matched) {
      // Check stock sufficiency
      const stockQty = Number(matched.quantity) || 0;
      const inStock = stockQty > 0 && matched.status !== 'out';
      quickOptionList.push({
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

  // Also include any ingredient classified as topping/modifier in store's stock
  ingredients.forEach((ing) => {
    const cat = (ing.category || '').toLowerCase();
    if (['topping', 'ท็อปปิ้ง', 'modifier', 'ส่วนผสมเสริม', 'ท็อปปิ้งเครื่องดื่ม'].includes(cat)) {
      if (!quickOptionList.some((q) => q.ingredientId === ing.id || q.name === ing.name)) {
        const stockQty = Number(ing.quantity) || 0;
        const inStock = stockQty > 0 && ing.status !== 'out';
        quickOptionList.push({
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

  const quickTags = quickOptionList.map((q) => q.name);

  const handleToggleTag = (tag: string) => {
    const opt = quickOptionList.find((q) => q.name === tag);
    if (!opt) return;

    // Check if ingredient has enough stock
    if (!opt.isService && !opt.inStock) {
      return; // Cannot toggle out-of-stock items
    }

    if (opt.price > 0) {
      // Toggle modifier to add price and BOM deduction
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
      // Zero price: toggle in customNote
      const current = customNote.split(',').map((t) => t.trim()).filter(Boolean);
      if (current.includes(tag)) {
        setCustomNote(current.filter((t) => t !== tag).join(', '));
      } else {
        setCustomNote([...current, tag].join(', '));
      }
    }
  };

  const isTagSelected = (tag: string): boolean => {
    const inModifiers = selectedModifiers.some((m) => m.name === tag);
    const inNote = customNote.split(',').map((t) => t.trim()).includes(tag);
    return inModifiers || inNote;
  };

  // Modifier toggle with stock sufficiency check
  const handleToggleModifier = (opt: MenuOptionIngredient) => {
    const linkedIng = ingredients.find((i) => i.id === opt.ingredient_id);
    const stockQty = Number(linkedIng?.quantity) || 0;
    const inStock = linkedIng ? (stockQty >= (opt.quantity || 1) && linkedIng.status !== 'out') : true;
    if (!inStock) return; // Prevent selecting out of stock modifier

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

  // 1. Calculate total sweetener volume reduction & find primary milk ingredient
  let totalSweetenerReduction = 0;
  let primaryMilkRecipeId: number | null = null;
  let maxMilkQty = 0;
  const recipeSweeteners: string[] = [];

  (item?.recipes || []).forEach((r) => {
    const ing = ingredients.find((i) => String(i.id) === String(r.ingredient_id));
    const ingName = ing?.name || (r as any).ingredient?.name || r.ingredient_name || '';
    const ingCat = ing?.category || (r as any).ingredient?.category || '';
    const baseQty = Number(r.quantity_used) || 0;

    if (checkIsSweetener(ingName, ingCat)) {
      if (!recipeSweeteners.includes(ingName)) {
        recipeSweeteners.push(ingName);
      }
      totalSweetenerReduction += baseQty * (1.0 - sweetnessMultiplier);
    } else if (checkIsMilk(ingName, ingCat)) {
      if (baseQty > maxMilkQty) {
        maxMilkQty = baseQty;
        primaryMilkRecipeId = Number(r.ingredient_id);
      }
    }
  });

  // 2. BOM preview deductions
  const previewDeductions: ItemPreviewDeduction[] = (item?.recipes || []).map((r) => {
    const ing = ingredients.find((i) => String(i.id) === String(r.ingredient_id));
    const ingName = ing?.name || (r as any).ingredient?.name || r.ingredient_name || 'วัตถุดิบ';
    const ingUnit = ing?.unit || (r as any).ingredient?.unit || r.ingredient_unit || 'หน่วย';
    const ingCat = ing?.category || (r as any).ingredient?.category || '';
    const ingCurrent = ing?.quantity ?? (r as any).ingredient?.quantity ?? 0;
    const baseQty = Number(r.quantity_used) || 0;

    const isCoffee = checkIsCoffee(ingName, ingCat);
    const isSweetener = checkIsSweetener(ingName, ingCat);
    const isPrimaryMilk = (Number(r.ingredient_id) === primaryMilkRecipeId);

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
      if (mult === 0) badgeText = 'ไม่หวาน (0%)';
      else if (mult < 1) badgeText = `หวานน้อย (${Math.round(mult * 100)}%)`;
      else if (mult > 1) badgeText = `หวานมาก (${Math.round(mult * 100)}%)`;
    } else if (isPrimaryMilk && Math.abs(totalSweetenerReduction) > 0.001) {
      effectiveQty = Math.max(0, baseQty + totalSweetenerReduction);
      const diffSign = totalSweetenerReduction > 0 ? '+' : '';
      const diffRound = Math.round(totalSweetenerReduction * 10) / 10;
      badgeText = totalSweetenerReduction > 0
        ? `เติมนมสด ${diffSign}${diffRound} ${ingUnit}`
        : `ลดนมสด ${diffRound} ${ingUnit}`;
    }

    // Unit conversion guard
    const ingUnitLower = ingUnit.toLowerCase().trim();
    let unitFactor = 1.0;
    if (['กก.', 'กก', 'kg', 'กิโลกรัม'].includes(ingUnitLower) && effectiveQty >= 1) unitFactor = 0.001;
    else if (['ลิตร', 'l', 'liter', 'litre'].includes(ingUnitLower) && effectiveQty >= 1) unitFactor = 0.001;

    const deductedQty = Number((effectiveQty * unitFactor).toFixed(3));

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

  // If no milk in recipe but drink has milky sweetener (e.g. นมผสม) and sweetener was reduced,
  // compensate with store's primary fresh milk so user sees milk added!
  if (!primaryMilkRecipeId && Math.abs(totalSweetenerReduction) > 0.001) {
    const hasMilkySweetener = (item?.recipes || []).some((r) => {
      const ing = ingredients.find((i) => String(i.id) === String(r.ingredient_id));
      const n = (ing?.name || (r as any).ingredient?.name || r.ingredient_name || '').toLowerCase();
      return n.includes('นมผสม') || n.includes('นมข้น');
    });
    if (hasMilkySweetener) {
      const fallbackMilk = ingredients.find((i) => checkIsMilk(i.name, i.category));
      if (fallbackMilk) {
        const diffSign = totalSweetenerReduction > 0 ? '+' : '';
        const diffRound = Math.round(totalSweetenerReduction * 10) / 10;
        const deductQty = Number((Math.abs(totalSweetenerReduction)).toFixed(3));
        previewDeductions.push({
          id: `fallback-milk-${fallbackMilk.id}`,
          name: fallbackMilk.name,
          unit: fallbackMilk.unit,
          baseQty: 0,
          deductedQty: totalSweetenerReduction > 0 ? deductQty : 0,
          currentQty: fallbackMilk.quantity,
          remainingQty: Math.max(0, Number((fallbackMilk.quantity - deductQty).toFixed(2))),
          isSweetener: false,
          isCoffee: false,
          badgeText: `ชดเชยเติมนมสด ${diffSign}${diffRound} ${fallbackMilk.unit}`,
        });
      }
    }
  }

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
    quickOptionList,
    isTagSelected,
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
