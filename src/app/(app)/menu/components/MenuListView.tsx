import React from 'react';
import { Layers, Edit2, Trash2, UtensilsCrossed } from 'lucide-react';
import { MenuItem } from '@/types';

interface MenuListViewProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}

export const MenuListView: React.FC<MenuListViewProps> = ({ items, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">รูปภาพ & เมนู</th>
              <th className="py-3.5 px-4">หมวดหมู่</th>
              <th className="py-3.5 px-4 text-right">ราคาขาย</th>
              <th className="py-3.5 px-4 text-right">ต้นทุน BOM</th>
              <th className="py-3.5 px-4 text-right">กำไร/จาน</th>
              <th className="py-3.5 px-4 text-center">มาร์จิ้น (% Margin)</th>
              <th className="py-3.5 px-4">สูตรวัตถุดิบ (BOM Recipes)</th>
              <th className="py-3.5 px-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                      <img
                        src={item.image || '/images/logo_ss.png'}
                        alt={item.name}
                        className={`w-full h-full ${item.image ? 'object-cover rounded-xl' : 'object-contain'}`}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{item.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#e6f7f5] text-[#12312d] border border-[#4fb0a5]/30 inline-block whitespace-nowrap">
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                  ฿{item.price.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-amber-700">
                  ฿{item.recipe_cost.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-emerald-700">
                  ฿{(item.price - item.recipe_cost).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {item.margin_percent}%
                  </span>
                </td>
                <td className="py-3 px-4 max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {item.recipes && item.recipes.length > 0 ? (
                      item.recipes.map((r, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/80"
                        >
                          <span className="font-medium">{r.ingredient_name || `#${r.ingredient_id}`}</span>
                          <strong className="text-slate-900">{r.quantity_used} {r.ingredient_unit}</strong>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">ไม่มีสูตร</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:text-[#4fb0a5] hover:bg-slate-200 transition-colors shadow-2xs"
                      title="แก้ไขสูตร"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs"
                      title="ลบเมนู"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
