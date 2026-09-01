import React from 'react';
import { Plus, X } from 'lucide-react';

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    name: string;
    unit: string;
    quantity: number | string;
    reorder_point: number | string;
    cost_per_unit: number | string;
    category: string;
    supplier: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      unit: string;
      quantity: number | string;
      reorder_point: number | string;
      cost_per_unit: number | string;
      category: string;
      supplier: string;
    }>
  >;
}

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-scale-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#4fb0a5]/10 text-[#4fb0a5] flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">เพิ่มวัตถุดิบใหม่เข้าระบบ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">ชื่อวัตถุดิบ</label>
            <input
              type="text"
              required
              placeholder="เช่น สันนอกหมู, กุ้งแชบ๊วย, นมสด"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4fb0a5]/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">หมวดหมู่</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="เนื้อสัตว์">เนื้อสัตว์</option>
              <option value="อาหารทะเล">อาหารทะเล</option>
              <option value="ผักสด">ผักสด</option>
              <option value="ของแห้ง/เส้น">ของแห้ง/เส้น</option>
              <option value="ไข่และนม">ไข่และนม</option>
              <option value="เครื่องปรุง">เครื่องปรุง</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">หน่วยนับ</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="กก.">กิโลกรัม (กก.)</option>
              <option value="กรัม">กรัม</option>
              <option value="มล.">มิลลิลิตร (มล.)</option>
              <option value="ฟอง">ฟอง</option>
              <option value="กล่อง">กล่อง</option>
              <option value="ขวด">ขวด</option>
              <option value="แพ็ค">แพ็ค</option>
            </select>
          </div>

          {/* Smooth Numeric Input: Initial Quantity */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              จำนวนเริ่มต้น ({formData.unit})
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="0"
              value={formData.quantity === 0 ? '' : formData.quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setFormData({ ...formData, quantity: val === '' ? '' : val });
                }
              }}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                setFormData({ ...formData, quantity: isNaN(val) || val < 0 ? 0 : val });
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30"
            />
          </div>

          {/* Smooth Numeric Input: Reorder Point */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              จุดสั่งซื้อขั้นต่ำ ({formData.unit})
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="เช่น 5"
              value={formData.reorder_point === 0 ? '' : formData.reorder_point}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setFormData({ ...formData, reorder_point: val === '' ? '' : val });
                }
              }}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                setFormData({ ...formData, reorder_point: isNaN(val) || val < 0 ? 0 : val });
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30"
            />
          </div>

          {/* Smooth Numeric Input: Cost per unit */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">ต้นทุนต่อหน่วย (บาท/{formData.unit})</label>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="เช่น 120"
              value={formData.cost_per_unit === 0 ? '' : formData.cost_per_unit}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setFormData({ ...formData, cost_per_unit: val === '' ? '' : val });
                }
              }}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                setFormData({ ...formData, cost_per_unit: isNaN(val) || val < 0 ? 0 : val });
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">ซัพพลายเออร์ / แหล่งซื้อ</label>
            <input
              type="text"
              placeholder="เช่น ตลาดสด, Makro"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold bg-[#4fb0a5] hover:bg-[#3d9b90] text-slate-950 shadow-md shadow-[#4fb0a5]/20"
          >
            บันทึกวัตถุดิบ
          </button>
        </div>
      </form>
    </div>
  );
};
