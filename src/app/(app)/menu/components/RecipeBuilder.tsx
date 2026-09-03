import React from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { Ingredient, RecipeItem } from '@/types';
import { Dropdown } from '@/components/Dropdown';

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
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#4fb0a5]" />
          <span className="font-bold text-slate-800 text-xs">วัตถุดิบและสัดส่วนที่ใช้ต่อ 1 จาน (BOM)</span>
        </div>
        <button
          type="button"
          onClick={onAddRow}
          className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[#12312d] font-bold text-[11px] hover:bg-slate-100 flex items-center gap-1 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#4fb0a5]" /> เพิ่มวัตถุดิบ
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {recipes.map((row, index) => {
          const selectedIng = ingredients.find((i) => i.id === Number(row.ingredient_id));

          return (
            <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              {/* Ingredient select */}
              <div className="flex-1">
                <Dropdown
                  value={row.ingredient_id}
                  onChange={(val) => onUpdateRow(index, 'ingredient_id', Number(val))}
                  options={ingredients.map((ing) => ({
                    value: ing.id,
                    label: `${ing.name} (${ing.cost_per_unit} ฿/${ing.unit})`,
                  }))}
                  size="sm"
                  className="w-full"
                  buttonClassName="py-1.5 px-2 bg-slate-50 rounded-lg text-xs"
                />
              </div>

              {/* Quantity text input with smooth blank typing */}
              <div className="w-28">
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
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#4fb0a5]"
                />
              </div>

              {/* Unit display */}
              <div className="w-12 text-slate-500 font-medium text-[11px] text-center shrink-0">
                {selectedIng?.unit || ''}
              </div>

              {/* Delete row button */}
              <button
                type="button"
                onClick={() => onRemoveRow(index)}
                disabled={recipes.length <= 1}
                className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
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
