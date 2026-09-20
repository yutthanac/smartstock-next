import React from 'react';
import { Layers, Plus, Trash2, Sparkles, HelpCircle } from 'lucide-react';
import { Ingredient, RecipeItem } from '@/types';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';

export interface OptionIngredientRow {
  id?: number;
  name: string;
  price?: number;
  ingredient_id: number;
  quantity: number;
}

interface RecipeBuilderProps {
  recipes: RecipeItem[];
  ingredients: Ingredient[];
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateRow: (index: number, field: string, value: any) => void;
  optionIngredients?: OptionIngredientRow[];
  onAddOptionRow?: () => void;
  onRemoveOptionRow?: (index: number) => void;
  onUpdateOptionRow?: (index: number, field: string, value: any) => void;
}

/**
 * Normalizes units like กก. -> กรัม or ลิตร -> มล. for per-glass cafe recipes
 */
function getUnitInfo(unit?: string) {
  const unitLower = (unit || '').toLowerCase().trim();
  if (['กก.', 'กก', 'kg', 'กิโลกรัม'].includes(unitLower)) {
    return {
      factor: 0.001,
      displayUnit: 'กรัม',
      baseUnit: unit || 'กก.',
      isConverted: true,
    };
  }
  if (['ลิตร', 'l', 'liter', 'litre'].includes(unitLower)) {
    return {
      factor: 0.001,
      displayUnit: 'มล.',
      baseUnit: unit || 'ลิตร',
      isConverted: true,
    };
  }
  return {
    factor: 1.0,
    displayUnit: unit || 'หน่วย',
    baseUnit: unit || 'หน่วย',
    isConverted: false,
  };
}

export const RecipeBuilder: React.FC<RecipeBuilderProps> = ({
  recipes,
  ingredients,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  optionIngredients,
  onAddOptionRow,
  onRemoveOptionRow,
  onUpdateOptionRow,
}) => {
  return (
    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-200/80 flex items-center justify-center text-stone-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-xs">วัตถุดิบและสูตรชงต่อแก้ว / เสิร์ฟ</h4>
            <p className="text-[11px] text-stone-500 font-normal">
              ระบุปริมาณที่ใช้ต่อแก้ว เพื่อตัดสต็อกและคำนวณต้นทุนต่อแก้วอัตโนมัติ
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onAddRow}
          className="bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 rounded-xl text-xs font-semibold px-3 py-1.5 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" /> เพิ่มวัตถุดิบ
        </Button>
      </div>

      {/* Column Headers (Desktop/Tablet) */}
      <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 text-[11px] font-bold text-stone-500 uppercase tracking-wide">
        <div className="flex-1">วัตถุดิบที่ใช้ในสูตร</div>
        <div className="w-40 text-center">ปริมาณต่อแก้ว</div>
        <div className="w-28 text-right">ต้นทุนต่อแก้ว</div>
        <div className="w-8 text-center" />
      </div>

      {/* Recipe Rows List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {recipes.map((row, index) => {
          const selectedIng = ingredients.find((i) => i.id === Number(row.ingredient_id));
          const unitInfo = getUnitInfo(selectedIng?.unit);
          const rawQty = typeof row.quantity_used === 'number'
            ? row.quantity_used
            : parseFloat(row.quantity_used as any) || 0;
          const rowCost = (selectedIng?.cost_per_unit || 0) * rawQty * unitInfo.factor;

          return (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white p-2.5 rounded-xl border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-colors"
            >
              {/* Ingredient Dropdown */}
              <div className="flex-1 min-w-0">
                <Dropdown
                  value={row.ingredient_id}
                  onChange={(val) => onUpdateRow(index, 'ingredient_id', Number(val))}
                  options={ingredients.map((ing) => {
                    const ingUnit = getUnitInfo(ing.unit);
                    const effectivePrice = ingUnit.isConverted
                      ? (ing.cost_per_unit * ingUnit.factor)
                      : ing.cost_per_unit;

                    return {
                      value: ing.id,
                      label: `${ing.tracking_type === 'bulk_expense' ? '🧴' : '☕'} ${ing.name} (฿${effectivePrice.toFixed(effectivePrice < 1 ? 3 : 2)}/${ingUnit.displayUnit})`,
                      badge: ing.tracking_type === 'bulk_expense' ? 'ของใช้' : undefined,
                    };
                  })}
                  size="sm"
                  className="w-full"
                  buttonClassName="py-2 px-2.5 bg-stone-50 rounded-xl text-xs font-semibold text-stone-800 border border-stone-200 hover:bg-stone-100/70"
                />
              </div>

              {/* Quantity Input with Prominent Attached Unit */}
              <div className="w-full sm:w-40 shrink-0">
                <div className="flex items-center rounded-xl border border-stone-300 bg-white focus-within:border-stone-600 focus-within:ring-2 focus-within:ring-stone-200 transition-all overflow-hidden shadow-2xs">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={row.quantity_used === 0 || row.quantity_used === undefined ? '' : row.quantity_used}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        onUpdateRow(index, 'quantity_used', val === '' ? '' : val);
                      }
                    }}
                    onBlur={(e) => {
                      const num = parseFloat(e.target.value);
                      onUpdateRow(index, 'quantity_used', isNaN(num) || num <= 0 ? 0 : num);
                    }}
                    className="w-full py-1.5 px-3 text-sm font-bold text-stone-900 text-right bg-transparent focus:outline-none font-mono tabular-nums placeholder:text-stone-300"
                    title={`ระบุปริมาณ (${unitInfo.displayUnit})`}
                  />
                  <span className="px-3 py-2 bg-stone-100/90 text-xs font-bold text-stone-700 border-l border-stone-200 select-none whitespace-nowrap min-w-[50px] text-center">
                    {unitInfo.displayUnit}
                  </span>
                </div>
              </div>

              {/* Calculated Cost Per Glass */}
              <div className="w-full sm:w-28 text-right px-1 shrink-0 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                <span className="text-xs text-stone-400 sm:hidden">ต้นทุน/แก้ว:</span>
                <div>
                  <div className="text-sm font-bold text-stone-900 font-mono tabular-nums">
                    ฿{rowCost.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium leading-tight">
                    {selectedIng ? (
                      unitInfo.isConverted ? (
                        <span>แปลงจาก {unitInfo.baseUnit}</span>
                      ) : (
                        <span>฿{Number(selectedIng.cost_per_unit).toFixed(2)}/{unitInfo.displayUnit}</span>
                      )
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete row button */}
              <button
                type="button"
                onClick={() => onRemoveRow(index)}
                disabled={recipes.length <= 1}
                className="self-center p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-20 transition-colors cursor-pointer"
                title="ลบวัตถุดิบนี้ออกจากสูตร"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Option Modifiers Section (ตัวเลือกเสริมตัดสต็อก) */}
      {optionIngredients && onAddOptionRow && (
        <div className="pt-3 border-t border-stone-200/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-stone-600" />
              <span className="font-bold text-stone-800 text-xs">ตัวเลือกเสริมตัดสต็อก (Dynamic Modifier BOM)</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onAddOptionRow}
              className="bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 rounded-xl text-xs font-medium h-7 px-2.5 shadow-2xs"
            >
              <Plus className="w-3 h-3" /> เพิ่มตัวเลือกเสริม
            </Button>
          </div>
          <p className="text-[11px] text-stone-500">
            เช่น เพิ่มช็อต (+18 กรัม, +15 ฿), นมโอ๊ต (+150 มล., +20 ฿), วิปครีม (+30 กรัม, +15 ฿)
          </p>

          {optionIngredients.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {optionIngredients.map((opt, optIdx) => {
                const optIng = ingredients.find((i) => i.id === Number(opt.ingredient_id));
                const optUnitInfo = getUnitInfo(optIng?.unit);

                return (
                  <div
                    key={optIdx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs"
                  >
                    {/* Modifier Name */}
                    <div className="flex-1 min-w-[120px]">
                      <input
                        type="text"
                        placeholder="ชื่อ เช่น เพิ่มช็อตกาแฟ"
                        value={opt.name}
                        onChange={(e) => onUpdateOptionRow!(optIdx, 'name', e.target.value)}
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:bg-white focus:border-stone-500"
                      />
                    </div>

                    {/* Ingredient Selector */}
                    <div className="w-full sm:w-44">
                      <Dropdown
                        value={opt.ingredient_id}
                        onChange={(val) => onUpdateOptionRow!(optIdx, 'ingredient_id', Number(val))}
                        options={ingredients.map((ing) => ({
                          value: ing.id,
                          label: `${ing.name} (${getUnitInfo(ing.unit).displayUnit})`,
                        }))}
                        size="sm"
                        className="w-full"
                        buttonClassName="py-2 px-2 bg-stone-50 rounded-xl text-xs font-medium border border-stone-200"
                      />
                    </div>

                    {/* Modifier Quantity with Attached Unit */}
                    <div className="w-full sm:w-32">
                      <div className="flex items-center rounded-xl border border-stone-200 bg-white focus-within:border-stone-500 overflow-hidden shadow-2xs">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={opt.quantity === 0 || opt.quantity === undefined ? '' : opt.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              onUpdateOptionRow!(optIdx, 'quantity', val === '' ? 0 : parseFloat(val));
                            }
                          }}
                          className="w-full py-1.5 px-2.5 text-xs font-bold text-stone-900 text-right font-mono tabular-nums bg-transparent focus:outline-none"
                        />
                        <span className="px-2 py-1.5 bg-stone-100 text-[11px] font-bold text-stone-600 border-l border-stone-200 select-none whitespace-nowrap min-w-[38px] text-center">
                          {optUnitInfo.displayUnit}
                        </span>
                      </div>
                    </div>

                    {/* Additional Price */}
                    <div className="w-full sm:w-28">
                      <div className="flex items-center rounded-xl border border-stone-200 bg-white focus-within:border-stone-500 overflow-hidden shadow-2xs">
                        <span className="px-2 py-1.5 bg-stone-100 text-xs font-bold text-stone-500 border-r border-stone-200 select-none">
                          +฿
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={opt.price === 0 || opt.price === undefined ? '' : opt.price}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              onUpdateOptionRow!(optIdx, 'price', val === '' ? 0 : parseFloat(val));
                            }
                          }}
                          className="w-full py-1.5 px-2 text-xs font-bold text-stone-900 text-right font-mono tabular-nums bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Delete Option */}
                    <button
                      type="button"
                      onClick={() => onRemoveOptionRow!(optIdx)}
                      className="self-center p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="ลบตัวเลือกเสริมนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
