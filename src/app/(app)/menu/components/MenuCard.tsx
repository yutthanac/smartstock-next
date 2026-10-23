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
                : 'object-contain p-7 bg-stone-50/50 opacity-30 grayscale contrast-75'
            }`}
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-xs text-white">
              {item.category}
            </span>
            {item.is_grab && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Grab ฿{(item.grab_price || item.price).toFixed(2)}
              </span>
            )}
          </div>
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
            <div className="text-right shrink-0">
              <span className="text-base font-bold text-stone-900 block font-mono tabular-nums">฿{item.price.toFixed(2)}</span>
              {item.is_grab && item.grab_price && item.grab_price !== item.price && (
                <span className="text-[10px] text-emerald-700 font-semibold block font-mono">
                  Grab ฿{item.grab_price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* BOM Recipe Ingredients List */}
          <div className="pt-2 border-t border-stone-100">
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              วัตถุดิบในสูตร:
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
                <div className="text-xs text-stone-400 italic py-1">ยังไม่มีสูตร</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Cost & Margin summary */}
      <div className="p-3.5 bg-stone-50/80 border-t border-stone-100 space-y-2 text-xs rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-stone-400 text-xs">ต้นทุน</div>
            <div className="font-semibold text-stone-700 font-mono tabular-nums">฿{Number(item.recipe_cost || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-stone-400 text-xs">กำไร</div>
            <div className="font-bold text-stone-900 font-mono tabular-nums">฿{(item.price - item.recipe_cost).toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-stone-400 text-xs mb-0.5">มาร์จิ้น</div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200 font-mono tabular-nums">
              {item.margin_percent}%
            </span>
          </div>
        </div>

        {item.is_grab && (() => {
          const gPrice = item.grab_price || item.price;
          const gp = item.grab_gp_percent || 30;
          const netRev = gPrice * (1 - gp / 100);
          const gProfit = netRev - item.recipe_cost;
          const gMargin = gPrice > 0 ? ((gProfit / gPrice) * 100).toFixed(1) : '0';
          return (
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] bg-emerald-50/70 -mx-3.5 -mb-3.5 p-2 px-3.5 rounded-b-2xl text-emerald-950">
              <span className="font-semibold flex items-center gap-1 text-emerald-800">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[8px]">G</span>
                Grab (GP {gp}%):
              </span>
              <span className="font-mono">
                กำไร <strong className={gProfit < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>฿{gProfit.toFixed(2)}</strong> ({gMargin}%)
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
