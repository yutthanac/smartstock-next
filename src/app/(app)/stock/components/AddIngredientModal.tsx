import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Calculator } from 'lucide-react';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';
import { useStock } from '@/lib/StockContext';
import { Ingredient } from '@/types';

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingTarget?: Ingredient | null;
  formData: {
    name: string;
    unit: string;
    quantity: number | string;
    reorder_point: number | string;
    cost_per_unit: number | string;
    category: string;
    supplier: string;
    tracking_type: 'strict' | 'bulk_expense';
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
      tracking_type: 'strict' | 'bulk_expense';
    }>
  >;
}

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTarget,
  formData,
  setFormData,
}) => {
  const { units } = useStock();
  const [purchasePrice, setPurchasePrice] = useState<string>('');

  useEffect(() => {
    if (editingTarget) {
      const qty = parseFloat(String(editingTarget.quantity));
      const cost = parseFloat(String(editingTarget.cost_per_unit));
      if (!isNaN(qty) && !isNaN(cost) && qty > 0 && cost > 0) {
        setPurchasePrice(String(Math.round(qty * cost * 100) / 100));
      } else {
        setPurchasePrice('');
      }
    } else {
      setPurchasePrice('');
    }
  }, [editingTarget, isOpen]);

  const handlePurchasePriceChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setPurchasePrice(val);
      const priceNum = parseFloat(val);
      const qtyNum = parseFloat(String(formData.quantity));
      if (!isNaN(priceNum) && !isNaN(qtyNum) && qtyNum > 0) {
        const unitCost = Math.round((priceNum / qtyNum) * 10000) / 10000;
        setFormData((prev) => ({ ...prev, cost_per_unit: unitCost }));
      }
    }
  };

  const handleQuantityChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      const qtyNum = parseFloat(val);
      const priceNum = parseFloat(purchasePrice);
      let newCost = formData.cost_per_unit;
      if (!isNaN(priceNum) && priceNum > 0 && !isNaN(qtyNum) && qtyNum > 0) {
        newCost = Math.round((priceNum / qtyNum) * 10000) / 10000;
      }
      setFormData((prev) => ({
        ...prev,
        quantity: val === '' ? '' : val,
        cost_per_unit: newCost,
      }));
    }
  };

  const handleCostPerUnitChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      const unitCost = parseFloat(val);
      const qtyNum = parseFloat(String(formData.quantity));
      if (!isNaN(unitCost) && !isNaN(qtyNum) && qtyNum > 0) {
        setPurchasePrice(String(Math.round(unitCost * qtyNum * 100) / 100));
      }
      setFormData((prev) => ({ ...prev, cost_per_unit: val === '' ? '' : val }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-scale-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-normal">
              {editingTarget ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h3 className="font-semibold text-slate-900 text-base">
              {editingTarget ? `แก้ไขวัตถุดิบ: ${editingTarget.name}` : 'เพิ่มวัตถุดิบ / เมล็ดกาแฟ'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tracking Type Selection */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="font-medium text-slate-800 text-xs block">
            ลักษณะการตัดสต็อก
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, tracking_type: 'strict' })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                formData.tracking_type === 'strict'
                  ? 'bg-slate-900 text-white shadow-xs border-slate-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">☕</span>
                <span className={`text-xs ${formData.tracking_type === 'strict' ? 'font-medium text-white' : 'font-normal text-slate-800'}`}>ตัดตามแก้ว (BOM)</span>
              </div>
              <p className={`text-[10px] mt-1 leading-tight ${formData.tracking_type === 'strict' ? 'text-slate-300' : 'text-slate-500'}`}>
                ตัดอัตโนมัติตามสูตรเมื่อขาย เช่น เมล็ดกาแฟ, นม, ชา, แก้ว
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, tracking_type: 'bulk_expense' })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                formData.tracking_type === 'bulk_expense'
                  ? 'bg-slate-900 text-white shadow-xs border-slate-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">🧴</span>
                <span className={`text-xs ${formData.tracking_type === 'bulk_expense' ? 'font-medium text-white' : 'font-normal text-slate-800'}`}>เปิดใช้ / ของใช้</span>
              </div>
              <p className={`text-[10px] mt-1 leading-tight ${formData.tracking_type === 'bulk_expense' ? 'text-slate-300' : 'text-slate-500'}`}>
                ตัดยอดเมื่อเปิดขวดใหม่หรือนับสต็อก เช่น ไซรัป, ซอส, ผงโรย
              </p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="sm:col-span-2">
            <label className="font-normal text-slate-700 block mb-1">ชื่อวัตถุดิบ</label>
            <input
              type="text"
              required
              placeholder="เช่น เมล็ดกาแฟบราซิล คั่วกลาง, นมสด, ไซรัปคาราเมล, ชาเขียวมัทฉะ"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-slate-800 font-normal"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">หมวดหมู่</label>
            <Dropdown
              value={formData.category}
              onChange={(val) => setFormData({ ...formData, category: val })}
              options={[
                'เมล็ดกาแฟ & ชา',
                'นม & ผลิตภัณฑ์นม',
                'ไซรัป & ซอสแต่งกลิ่น',
                'ผงชง & ท็อปปิ้ง',
                'แป้ง & วัตถุดิบขนม',
                'แก้ว & บรรจุภัณฑ์',
                'อาหาร & วัตถุดิบอื่นๆ',
              ]}
              className="w-full"
              buttonClassName="py-2.5 px-3 rounded-xl bg-slate-50"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">หน่วยนับ</label>
            <Dropdown
              value={formData.unit}
              onChange={(val) => setFormData({ ...formData, unit: val })}
              options={units.map((u) => ({
                value: u.name,
                label: u.name,
              }))}
              className="w-full"
              buttonClassName="py-2.5 px-3 rounded-xl bg-slate-50"
            />
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
              placeholder="เช่น 500"
              value={formData.quantity === 0 ? '' : formData.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                setFormData((prev) => ({ ...prev, quantity: isNaN(val) || val < 0 ? 0 : val }));
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* New Input: ราคาที่ซื้อมาทั้งหมด (คำนวณต้นทุนต่อหน่วยให้อัตโนมัติ) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                ราคาซื้อรวม (บาท)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">ราคาต่อแพ็ค/ถุง</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder="เช่น 250"
              value={purchasePrice}
              onChange={(e) => handlePurchasePriceChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
              placeholder="เช่น 2"
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
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Smooth Numeric Input: Cost per unit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-normal text-slate-700">
                ต้นทุนต่อหน่วย (บาท/{formData.unit})
              </label>
            </div>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="เช่น 0.5"
              value={formData.cost_per_unit === 0 ? '' : formData.cost_per_unit}
              onChange={(e) => handleCostPerUnitChange(e.target.value)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                setFormData((prev) => ({ ...prev, cost_per_unit: isNaN(val) || val < 0 ? 0 : val }));
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
            {Boolean(purchasePrice && Number(formData.quantity) > 0) && (
              <p className="text-[11px] text-slate-500 mt-1 font-normal">
                💡 {purchasePrice} บาท ÷ {formData.quantity} {formData.unit} = <span className="text-slate-900 font-mono font-medium">{formData.cost_per_unit}</span> บ./{formData.unit}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="font-normal text-slate-700 block mb-1">แหล่งสั่งซื้อ / ซัพพลายเออร์</label>
            <input
              type="text"
              placeholder="เช่น โรงคั่วกาแฟ Aroma, แม็คโคร, CP"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-800 font-normal"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
          >
            {editingTarget ? 'บันทึกการแก้ไข' : 'บันทึกวัตถุดิบ'}
          </Button>
        </div>
      </form>
    </div>
  );
};
