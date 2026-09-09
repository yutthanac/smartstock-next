import React from 'react';
import { Layers, Edit2, Trash2 } from 'lucide-react';
import { MenuItem } from '@/types';
import { Badge } from '@/components/Badge';

interface MenuCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all">
      <div>
        {/* Image Banner with logo_ss.png as fallback */}
        <div className="relative h-44 bg-stone-100 overflow-hidden group">
          <img
            src={item.image || '/images/logo_ss.png'}
            alt={item.name}
            className={`w-full h-full ${
              item.image
                ? 'object-cover group-hover:scale-105 transition-transform duration-300'
                : 'object-contain p-6 bg-white opacity-80'
            }`}
          />
          <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-xs text-white">
            {item.category}
          </span>
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={() => onEdit(item)}
              className="p-2 rounded-xl bg-white/90 text-stone-700 hover:text-stone-900 hover:bg-white shadow-xs transition-colors cursor-pointer"
              title="แก้ไขสูตร"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 rounded-xl bg-white/90 text-stone-700 hover:text-rose-600 hover:bg-white shadow-xs transition-colors cursor-pointer"
              title="ลบเมนู"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-stone-900 text-base">{item.name}</h3>
              {item.description && (
                <p className="text-xs text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">{item.description}</p>
              )}
            </div>
            <span className="text-base font-bold text-stone-900 shrink-0 font-mono tabular-nums">฿{item.price.toFixed(2)}</span>
          </div>

          {/* BOM Recipe Ingredients List */}
          <div className="pt-2 border-t border-stone-100">
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              สูตรวัตถุดิบ:
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {item.recipes && item.recipes.length > 0 ? (
                item.recipes.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs py-1.5 px-2.5 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <span className="font-normal text-stone-700 truncate">{r.ingredient_name || `วัตถุดิบ #${r.ingredient_id}`}</span>
                    <span className="font-medium text-stone-800 bg-white px-2 py-0.5 rounded-lg border border-stone-200 text-xs shrink-0 ml-2 shadow-2xs font-mono tabular-nums">
                      {r.quantity_used} {r.ingredient_unit}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-stone-400 italic py-1">ยังไม่ได้ผูกสูตรวัตถุดิบ</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Cost & Margin summary */}
      <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between text-xs rounded-b-2xl">
        <div>
          <div className="text-stone-400 text-xs">ต้นทุนวัตถุดิบ</div>
          <div className="font-semibold text-stone-700 font-mono tabular-nums">฿{item.recipe_cost}</div>
        </div>
        <div>
          <div className="text-stone-400 text-xs">กำไรต่อจาน</div>
          <div className="font-bold text-stone-900 font-mono tabular-nums">฿{(item.price - item.recipe_cost).toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className="text-stone-400 text-xs mb-0.5">อัตรากำไร</div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
            {item.margin_percent}%
          </span>
        </div>
      </div>
    </div>
  );
};
