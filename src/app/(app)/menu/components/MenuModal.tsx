import React from 'react';
import { UtensilsCrossed, X, DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { Ingredient, MenuItem, RecipeItem } from '@/types';
import { ImageUpload } from './ImageUpload';
import { RecipeBuilder } from './RecipeBuilder';

interface MenuModalProps {
  isOpen: boolean;
  editingItem: MenuItem | null;
  name: string;
  category: string;
  price: number | string;
  image: string;
  description: string;
  recipes: RecipeItem[];
  ingredients: Ingredient[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setName: (v: string) => void;
  setCategory: (v: string) => void;
  setPrice: (v: any) => void;
  setImage: (v: string) => void;
  setDescription: (v: string) => void;
  onAddRecipeRow: () => void;
  onRemoveRecipeRow: (index: number) => void;
  onUpdateRecipeRow: (index: number, field: string, value: any) => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  editingItem,
  name,
  category,
  price,
  image,
  description,
  recipes,
  ingredients,
  onClose,
  onSubmit,
  setName,
  setCategory,
  setPrice,
  setImage,
  setDescription,
  onAddRecipeRow,
  onRemoveRecipeRow,
  onUpdateRecipeRow,
}) => {
  if (!isOpen) return null;

  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;

  // Live BOM Cost & Margin calculation
  const calculatedCost = recipes.reduce((sum, r) => {
    const ing = ingredients.find((i) => i.id === Number(r.ingredient_id));
    const qty = typeof r.quantity_used === 'number' ? r.quantity_used : parseFloat(r.quantity_used as any) || 0;
    return sum + (ing ? ing.cost_per_unit * qty : 0);
  }, 0);

  const calculatedProfit = numPrice - calculatedCost;
  const calculatedMargin = numPrice > 0 ? ((calculatedProfit / numPrice) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col border border-slate-200 animate-scale-in"
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#4fb0a5]" />
            <h3 className="font-bold text-slate-900 text-base">
              {editingItem ? 'แก้ไขเมนู & สูตรอาหาร' : 'สร้างเมนูใหม่ & ผูกสูตร BOM'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Menu Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">ชื่อเมนู</label>
              <input
                type="text"
                required
                placeholder="เช่น ข้าวผัดต้มยำกุ้ง"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">หมวดหมู่</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="อาหารจานเดียว">อาหารจานเดียว</option>
                <option value="สเต็ก & ย่าง">สเต็ก & ย่าง</option>
                <option value="พาสต้า & เส้น">พาสต้า & เส้น</option>
                <option value="พิซซ่า & ของทานเล่น">พิซซ่า & ของทานเล่น</option>
                <option value="เครื่องดื่ม & ของหวาน">เครื่องดื่ม & ของหวาน</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">ราคาขายหน้าร้าน (บาท)</label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="เช่น 89"
                value={price === 0 ? '' : price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setPrice(val === '' ? '' : val);
                  }
                }}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  setPrice(isNaN(val) || val < 0 ? 0 : val);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold text-slate-900 focus:ring-2 focus:ring-[#4fb0a5]/30"
              />
            </div>

            {/* Custom Image Upload from local folder or URL */}
            <ImageUpload image={image} onChange={setImage} />

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">รายละเอียดเมนู</label>
              <textarea
                rows={2}
                placeholder="คำอธิบายสำหรับลูกค้าหรือครัว..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Modular BOM Recipe Section */}
          <RecipeBuilder
            recipes={recipes}
            ingredients={ingredients}
            onAddRow={onAddRecipeRow}
            onRemoveRow={onRemoveRecipeRow}
            onUpdateRow={onUpdateRecipeRow}
          />

          {/* Live BOM Margin Summary Box */}
          <div className="p-4 rounded-2xl bg-[#12312d] text-white space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-[#1a423d] pb-2">
              <span className="text-[#4fb0a5] font-bold uppercase tracking-wider text-[10px]">
                สรุปต้นทุนและกำไรแบบเรียลไทม์ (Live BOM Calculation):
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-[#1a423d]/70">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <PieChart className="w-3 h-3 text-amber-400" /> ต้นทุนสูตร
                </div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">฿{calculatedCost.toFixed(2)}</div>
              </div>

              <div className="p-2 rounded-xl bg-[#1a423d]/70">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" /> กำไรต่อจาน
                </div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">฿{calculatedProfit.toFixed(2)}</div>
              </div>

              <div className="p-2 rounded-xl bg-[#1a423d]/70">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3 text-[#4fb0a5]" /> มาร์จิ้น (% Margin)
                </div>
                <div className="text-sm font-bold text-[#4fb0a5] mt-0.5">{calculatedMargin}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#4fb0a5] hover:bg-[#3d9b90] text-slate-950 font-bold shadow-md shadow-[#4fb0a5]/20"
          >
            {editingItem ? 'บันทึกการแก้ไข' : 'สร้างเมนูและสูตร'}
          </button>
        </div>
      </form>
    </div>
  );
};
