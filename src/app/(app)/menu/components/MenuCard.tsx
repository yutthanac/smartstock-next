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
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        {/* Image Banner with logo_ss.png as fallback */}
        <div className="relative h-44 bg-slate-100 overflow-hidden group">
          <img
            src={item.image || '/images/logo_ss.png'}
            alt={item.name}
            className={`w-full h-full ${
              item.image
                ? 'object-cover group-hover:scale-105 transition-transform duration-300'
                : 'object-contain p-6 bg-white opacity-80'
            }`}
          />
          <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white">
            {item.category}
          </span>
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={() => onEdit(item)}
              className="p-2 rounded-xl bg-white/90 text-slate-700 hover:text-slate-900 hover:bg-white shadow-sm transition-colors"
              title="แก้ไขสูตร"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 rounded-xl bg-white/90 text-slate-700 hover:text-rose-600 hover:bg-white shadow-sm transition-colors"
              title="ลบเมนู"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">{item.name}</h3>
              {item.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{item.description}</p>
              )}
            </div>
            <span className="text-base font-semibold text-slate-900 shrink-0 font-mono">฿{item.price.toFixed(2)}</span>
          </div>

          {/* BOM Recipe Ingredients List */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              สูตรวัตถุดิบต่อ 1 จาน (BOM):
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {item.recipes && item.recipes.length > 0 ? (
                item.recipes.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="font-normal text-slate-700 truncate">{r.ingredient_name || `วัตถุดิบ #${r.ingredient_id}`}</span>
                    <span className="font-normal text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] shrink-0 ml-2 shadow-2xs font-mono">
                      {r.quantity_used} {r.ingredient_unit}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-slate-400 italic py-1">ยังไม่ได้ผูกสูตรวัตถุดิบ</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Cost & Margin summary */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs rounded-b-3xl">
        <div>
          <div className="text-slate-400 text-[11px]">ต้นทุนวัตถุดิบ</div>
          <div className="font-medium text-slate-600 font-mono">฿{item.recipe_cost}</div>
        </div>
        <div>
          <div className="text-slate-400 text-[11px]">กำไรต่อจาน</div>
          <div className="font-medium text-slate-800 font-mono">฿{(item.price - item.recipe_cost).toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-[11px] mb-0.5">อัตรากำไร</div>
          <Badge variant="neutral">
            {item.margin_percent}%
          </Badge>
        </div>
      </div>
    </div>
  );
};
