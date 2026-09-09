import React from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { Ingredient, RecipeItem } from '@/types';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';

interface RecipeBuilderProps {
  recipes: RecipeItem[];
  ingredients: Ingredient[];
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateRow: (index: number, field: string, value: any) => void;
}

export const RecipeBuilder: React.FC<RecipeBuilderProps> = ({
  recipes,
  ingredients,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}) => {
  return (
    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-stone-600" />
          <span className="font-semibold text-stone-800 text-xs">วัตถุดิบและสูตรชงต่อแก้ว/เสิร์ฟ</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onAddRow}
          className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 rounded-xl text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> เพิ่มวัตถุดิบ
        </Button>
      </div>

      <p className="text-xs text-stone-400 font-normal">
        ระบุปริมาณเมล็ดกาแฟ ชา หรือวัตถุดิบที่ใช้ต่อแก้ว เพื่อตัดสต็อกและคำนวณต้นทุน
      </p>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {recipes.map((row, index) => {
          const selectedIng = ingredients.find((i) => i.id === Number(row.ingredient_id));

          return (
            <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-stone-200 shadow-2xs">
              {/* Ingredient select */}
              <div className="flex-1">
                <Dropdown
                  value={row.ingredient_id}
                  onChange={(val) => onUpdateRow(index, 'ingredient_id', Number(val))}
                  options={ingredients.map((ing) => ({
                    value: ing.id,
                    label: `${ing.tracking_type === 'bulk_expense' ? '🧴' : '☕'} ${ing.name} (${ing.cost_per_unit} ฿/${ing.unit})`,
                    badge: ing.tracking_type === 'bulk_expense' ? 'ของใช้' : 'วัตถุดิบหลัก',
                  }))}
                  size="sm"
                  className="w-full"
                  buttonClassName="py-1.5 px-2 bg-stone-50 rounded-lg text-xs font-medium border border-stone-200"
                />
              </div>

              {/* Quantity text input with smooth blank typing */}
              <div className="w-20">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="จำนวน"
                  value={row.quantity_used === 0 ? '' : row.quantity_used}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      onUpdateRow(index, 'quantity_used', val === '' ? '' : val);
                    }
                  }}
                  onBlur={(e) => {
                    const num = parseFloat(e.target.value);
                    onUpdateRow(index, 'quantity_used', isNaN(num) || num <= 0 ? 0.01 : num);
                  }}
                  className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-center focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-400 font-mono tabular-nums"
                />
              </div>

              {/* Unit & Live Calculated Cost */}
              <div className="w-24 text-right pr-1 shrink-0">
                {(() => {
                  const rawQty = typeof row.quantity_used === 'number' ? row.quantity_used : parseFloat(row.quantity_used as any) || 0;
                  const unitLower = (selectedIng?.unit || '').toLowerCase().trim();
                  let unitFactor = 1.0;
                  let displayUnit = selectedIng?.unit || '';
                  if (['กก.', 'กก', 'kg', 'กิโลกรัม'].includes(unitLower) && rawQty >= 1) {
                    unitFactor = 0.001;
                    displayUnit = 'กรัม';
                  } else if (['ลิตร', 'l', 'liter', 'litre'].includes(unitLower) && rawQty >= 1) {
                    unitFactor = 0.001;
                    displayUnit = 'มล.';
                  }
                  const rowCost = (selectedIng?.cost_per_unit || 0) * rawQty * unitFactor;

                  return (
                    <>
                      <div className="text-xs font-semibold text-stone-900 font-mono tabular-nums">
                        ฿{rowCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-stone-400 font-medium">
                        {displayUnit}
                        {unitFactor < 1 && (
                          <span className="text-xs text-[#78350f] block leading-tight font-medium">
                            (แปลงจาก {selectedIng?.unit})
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Delete row button */}
              <button
                type="button"
                onClick={() => onRemoveRow(index)}
                disabled={recipes.length <= 1}
                className="p-1.5 text-stone-400 hover:text-rose-500 disabled:opacity-30 transition-colors cursor-pointer"
                title="ลบแถว"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
