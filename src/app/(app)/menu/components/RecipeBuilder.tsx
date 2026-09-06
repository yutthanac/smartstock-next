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
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-600" />
          <span className="font-semibold text-slate-800 text-xs">วัตถุดิบและสูตรชงต่อแก้ว/เสิร์ฟ</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onAddRow}
        >
          <Plus className="w-3.5 h-3.5" /> เพิ่มวัตถุดิบ
        </Button>
      </div>

      <p className="text-[11px] text-slate-400 font-normal">
        ระบุปริมาณเมล็ดกาแฟ ชา หรือวัตถุดิบที่ใช้ต่อแก้ว เพื่อตัดสต็อกและคำนวณต้นทุน
      </p>

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
                    label: `${ing.tracking_type === 'bulk_expense' ? '🧴' : '☕'} ${ing.name} (${ing.cost_per_unit} ฿/${ing.unit})`,
                    badge: ing.tracking_type === 'bulk_expense' ? 'ของใช้' : 'วัตถุดิบหลัก',
                  }))}
                  size="sm"
                  className="w-full"
                  buttonClassName="py-1.5 px-2 bg-slate-50 rounded-lg text-xs font-medium"
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
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-center focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Unit & Live Calculated Cost */}
              <div className="w-24 text-right pr-1 shrink-0">
                <div className="text-xs font-normal text-slate-800 font-mono">
                  ฿{((selectedIng?.cost_per_unit || 0) * (typeof row.quantity_used === 'number' ? row.quantity_used : parseFloat(row.quantity_used as any) || 0)).toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">{selectedIng?.unit || ''}</div>
              </div>

              {/* Delete row button */}
              <button
                type="button"
                onClick={() => onRemoveRow(index)}
                disabled={recipes.length <= 1}
                className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors cursor-pointer"
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
