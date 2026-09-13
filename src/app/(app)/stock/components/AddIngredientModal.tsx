import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Calculator, Package, Sparkles } from 'lucide-react';
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
    max_stock?: number | string;
    reorder_point: number | string;
    cost_per_unit: number | string;
    category: string;
    supplier: string;
    tracking_type: 'strict' | 'bulk_expense';
    package_unit?: string;
    package_size?: number | string;
    is_two_tier?: boolean;
    backstock_quantity?: number | string;
    bar_quantity?: number | string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      unit: string;
      quantity: number | string;
      max_stock?: number | string;
      reorder_point: number | string;
      cost_per_unit: number | string;
      category: string;
      supplier: string;
      tracking_type: 'strict' | 'bulk_expense';
      package_unit?: string;
      package_size?: number | string;
      is_two_tier?: boolean;
      backstock_quantity?: number | string;
      bar_quantity?: number | string;
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
  const [showPackCalc, setShowPackCalc] = useState<boolean>(false);
  const [packSize, setPackSize] = useState<string>('500');
  const [packUnit, setPackUnit] = useState<string>('กรัม');
  const [packCount, setPackCount] = useState<string>('1');
  const [packTotalCost, setPackTotalCost] = useState<string>('250');

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

  // Auto suggest standard units based on category for 'strict' per-cup tracking
  const handleCategoryChange = (cat: string) => {
    let suggestedUnit = formData.unit;
    if (formData.tracking_type === 'strict') {
      if (['เมล็ดกาแฟ & ชา', 'ผงชง & ท็อปปิ้ง', 'แป้ง & วัตถุดิบขนม'].includes(cat)) {
        suggestedUnit = 'กรัม';
      } else if (['นม & ผลิตภัณฑ์นม', 'ไซรัป & ซอสแต่งกลิ่น'].includes(cat)) {
        suggestedUnit = 'มล.';
      } else if (cat === 'แก้ว & บรรจุภัณฑ์') {
        suggestedUnit = 'ชิ้น';
      }
    }
    setFormData((prev) => ({ ...prev, category: cat, unit: suggestedUnit }));
  };

  // Convert kg or liters to standard base unit (กรัม or มล.)
  const handleConvertToStandard = () => {
    const isKg = formData.unit === 'กก.';
    const isLiter = formData.unit === 'ลิตร';
    if (!isKg && !isLiter) return;

    const targetUnit = isKg ? 'กรัม' : 'มล.';
    const qtyNum = parseFloat(String(formData.quantity)) || 0;
    const costNum = parseFloat(String(formData.cost_per_unit)) || 0;
    const priceNum = parseFloat(purchasePrice) || 0;
    const reorderNum = parseFloat(String(formData.reorder_point)) || 0;
    const maxStockNum = parseFloat(String(formData.max_stock)) || 0;

    const isAlreadySubunit = qtyNum >= 100;
    const newQty = isAlreadySubunit ? qtyNum : (qtyNum > 0 ? Math.round(qtyNum * 1000 * 100) / 100 : 0);

    let newCost = costNum;
    if (priceNum > 0 && newQty > 0) {
      newCost = Math.round((priceNum / newQty) * 10000) / 10000;
    } else if (costNum >= 10) {
      newCost = Math.round((costNum / 1000) * 10000) / 10000;
    }

    const newReorder = reorderNum > 0 && reorderNum < 50 ? reorderNum * 100 : reorderNum;
    const newMaxStock = maxStockNum > 0 ? (maxStockNum < 100 ? maxStockNum * 1000 : maxStockNum) : (newQty || '');

    setFormData((prev) => ({
      ...prev,
      unit: targetUnit,
      quantity: newQty || '',
      cost_per_unit: newCost || '',
      reorder_point: newReorder || '',
      max_stock: newMaxStock || '',
    }));
  };

  // Apply Pack / Package Calculator
  const handleApplyPackCalc = () => {
    const size = parseFloat(packSize) || 0;
    const count = parseFloat(packCount) || 1;
    const totalCost = parseFloat(packTotalCost) || 0;

    let baseQty = size * count;
    let standardUnit = packUnit;

    if (packUnit === 'กก.') {
      baseQty = baseQty * 1000;
      standardUnit = 'กรัม';
    } else if (packUnit === 'ลิตร') {
      baseQty = baseQty * 1000;
      standardUnit = 'มล.';
    }

    const unitCost = baseQty > 0 && totalCost > 0 ? Math.round((totalCost / baseQty) * 10000) / 10000 : 0;
    const suggestedReorder = Math.round(baseQty * 0.2);

    setPurchasePrice(String(totalCost));
    setFormData((prev) => ({
      ...prev,
      unit: standardUnit,
      quantity: baseQty,
      cost_per_unit: unitCost,
      reorder_point: suggestedReorder || prev.reorder_point,
      max_stock: baseQty,
      package_unit: prev.package_unit || (standardUnit === 'มล.' ? 'ขวด' : standardUnit === 'กรัม' ? 'ถุง' : 'แพ็ค'),
      package_size: (size * (packUnit === 'กก.' || packUnit === 'ลิตร' ? 1000 : 1)) || 1,
    }));
    setShowPackCalc(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 animate-scale-in overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 sm:px-7 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700 flex items-center justify-center font-normal shadow-2xs">
              {editingTarget ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">
                {editingTarget ? `แก้ไขวัตถุดิบ: ${editingTarget.name}` : 'เพิ่มวัตถุดิบ'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="sm:col-span-2">
            <label className="font-normal text-stone-700 block mb-1">ชื่อวัตถุดิบ</label>
            <input
              type="text"
              required
              placeholder="เช่น เมล็ดกาแฟบราซิล คั่วกลาง, นมสด, ไซรัปคาราเมล, ชาเขียวมัทฉะ"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 focus:outline-none text-stone-900 font-normal"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">หมวดหมู่</label>
            <Dropdown
              value={formData.category}
              onChange={handleCategoryChange}
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
              buttonClassName="py-2.5 px-3 rounded-xl bg-stone-50 border-stone-200 text-stone-800"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700">หน่วยนับ</label>
              {formData.tracking_type === 'strict' && (
                <span className="text-xs text-[#78350f] font-medium">
                  แนะนำ: กรัม, มล., ชิ้น
                </span>
              )}
            </div>
            <Dropdown
              value={formData.unit}
              onChange={(val) => setFormData({ ...formData, unit: val })}
              options={units.map((u) => ({
                value: u.name,
                label: u.name,
              }))}
              className="w-full"
              buttonClassName="py-2.5 px-3 rounded-xl bg-stone-50 border-stone-200 text-stone-800"
            />
          </div>

          {/* Standard Unit Conversion Alert for 'strict' per-cup BOM */}
          {formData.tracking_type === 'strict' && (formData.unit === 'กก.' || formData.unit === 'ลิตร') && (
            <div className="sm:col-span-2 p-3 bg-[#f5efe6] border border-[#e8ded0] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-[#78350f] animate-fade-in">
              <div className="flex items-start gap-2">
                <Calculator className="w-4 h-4 text-[#92400e] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-900 text-xs">
                    แนะนำแปลงเป็นหน่วยมาตรฐาน ({formData.unit === 'กก.' ? 'กรัม' : 'มล.'}) สำหรับตัดตามแก้ว
                  </p>
                  <p className="text-xs text-stone-600 leading-snug">
                    สูตรชงจะตัดเป็น {formData.unit === 'กก.' ? 'กรัม (เช่น 18-20g)' : 'มล. (เช่น 150ml)'} เพื่อความแม่นยำในการตัดสต็อก
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConvertToStandard}
                className="px-3 py-1.5 bg-[#78350f] hover:bg-[#92400e] active:scale-95 text-white font-medium rounded-xl text-xs transition-all shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span>แปลงเป็น {formData.unit === 'กก.' ? 'กรัม (x1,000)' : 'มล. (x1,000)'}</span>
              </button>
            </div>
          )}

          {/* Pack / Package Purchase Calculator */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPackCalc(!showPackCalc)}
                className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Package className="w-3.5 h-3.5 text-[#78350f]" />
                <span>ตัวช่วยคำนวณจากแพ็ค/ถุงที่ซื้อ</span>
                <span className="text-xs text-[#78350f] bg-[#f5efe6] px-2 py-0.5 rounded-full border border-[#e8ded0] font-medium">
                  {showPackCalc ? 'ซ่อนตัวช่วย' : 'คลิกเพื่อคำนวณ'}
                </span>
              </button>
            </div>

            {showPackCalc && (
              <div className="mt-2 p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-800 text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    คำนวณสต็อกและต้นทุนต่อหน่วยมาตรฐานให้อัตโนมัติ
                  </span>
                  <span className="text-xs text-stone-500">เช่น ซื้อ 1 ถุง 500g 250฿</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-xs text-stone-600 block mb-1">ขนาดต่อแพ็ค/ถุง</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={packSize}
                      onChange={(e) => setPackSize(e.target.value)}
                      placeholder="500"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl text-center font-mono tabular-nums font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1">หน่วยของแพ็ค</label>
                    <Dropdown
                      value={packUnit}
                      onChange={(val) => setPackUnit(String(val))}
                      options={[
                        { value: 'กรัม', label: 'กรัม (g)' },
                        { value: 'กก.', label: 'กก. (kg)' },
                        { value: 'มล.', label: 'มล. (ml)' },
                        { value: 'ลิตร', label: 'ลิตร (L)' },
                        { value: 'ชิ้น', label: 'ชิ้น / ฟอง' },
                      ]}
                      size="sm"
                      className="w-full"
                      buttonClassName="p-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1">จำนวนที่ซื้อ</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={packCount}
                      onChange={(e) => setPackCount(e.target.value)}
                      placeholder="1"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl text-center font-mono tabular-nums font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1">ราคารวม (บาท)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={packTotalCost}
                      onChange={(e) => setPackTotalCost(e.target.value)}
                      placeholder="250"
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl text-center font-mono tabular-nums font-bold text-stone-900"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-stone-200">
                  <div className="text-xs text-stone-600">
                    ผลลัพธ์: ได้สต็อก <strong className="text-stone-900 font-mono tabular-nums">{((parseFloat(packSize) || 0) * (packUnit === 'กก.' || packUnit === 'ลิตร' ? 1000 : 1) * (parseFloat(packCount) || 1)).toLocaleString()} {packUnit === 'กก.' ? 'กรัม' : packUnit === 'ลิตร' ? 'มล.' : packUnit}</strong> (ต้นทุน ~<strong className="text-[#78350f] font-mono tabular-nums">{(parseFloat(packTotalCost) / Math.max(1, ((parseFloat(packSize) || 0) * (packUnit === 'กก.' || packUnit === 'ลิตร' ? 1000 : 1) * (parseFloat(packCount) || 1)))).toFixed(4)}</strong> ฿/{packUnit === 'กก.' ? 'กรัม' : packUnit === 'ลิตร' ? 'มล.' : packUnit})
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPackCalc}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-end sm:self-auto"
                  >
                    นำค่าไปใส่ในฟอร์ม
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Smooth Numeric Input: Initial Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700">
                {formData.is_two_tier ? `จำนวนรวมทั้งร้าน (${formData.unit})` : `จำนวนเริ่มต้น (${formData.unit})`}
              </label>
              {formData.is_two_tier && (
                <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                  คำนวณอัตโนมัติ
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              required
              disabled={formData.is_two_tier}
              placeholder="เช่น 500"
              value={formData.quantity === 0 ? '' : formData.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                setFormData((prev) => ({ ...prev, quantity: isNaN(val) || val < 0 ? 0 : val }));
              }}
              className={`w-full p-2.5 border rounded-xl font-mono tabular-nums font-bold transition-colors ${
                formData.is_two_tier
                  ? 'bg-stone-100/80 border-stone-200 text-stone-600 cursor-not-allowed'
                  : 'bg-stone-50 border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400'
              }`}
            />
            {formData.is_two_tier && (
              <p className="text-[11px] text-stone-400 mt-1">
                = (หลังร้าน {formData.backstock_quantity || 0} × {formData.package_size || 0}) + หน้าบาร์ {formData.bar_quantity || 0} {formData.unit}
              </p>
            )}
          </div>

          {/* New Input: ราคาที่ซื้อมาทั้งหมด */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700">
                ราคาซื้อรวม (บาท)
              </label>
              <span className="text-xs text-stone-500 font-medium">ราคาต่อแพ็ค/ถุง</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder="เช่น 250"
              value={purchasePrice}
              onChange={(e) => handlePurchasePriceChange(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            />
          </div>

          {/* Smooth Numeric Input: Reorder Point */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
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
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-[#92400e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            />
          </div>

          {/* Optional Numeric Input: Max Stock */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700">
                ความจุสต็อกสูงสุด ({formData.unit})
              </label>
              <span className="text-[11px] text-stone-500 font-normal">สำหรับคำนวณหลอด % สต็อก</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder={String(formData.quantity || 100)}
              value={formData.max_stock === undefined || formData.max_stock === '' ? '' : formData.max_stock}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setFormData({ ...formData, max_stock: val === '' ? '' : val });
                }
              }}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                setFormData({ ...formData, max_stock: isNaN(val) || val <= 0 ? '' : val });
              }}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            />
          </div>

          {/* Two-Tier Stock Management Toggle & Configuration */}
          <div className="sm:col-span-2 p-4 bg-stone-50 border border-stone-200/90 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                  formData.is_two_tier ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-stone-200 border-stone-300 text-stone-600'
                }`}>
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900 text-xs">เปิดระบบ 2 คลัง (หลังร้าน / หน้าบาร์)</span>
                    <span className="text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                      นม / เมล็ดกาแฟ / ไซรัป
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    เก็บเป็นขวด/ถุงที่ยังไม่เปิดในคลังหลังร้าน และตัดปริมาณตามแก้ว ({formData.unit}) หน้าบาร์
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={!!formData.is_two_tier}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setFormData((prev) => {
                      const next = { ...prev, is_two_tier: isChecked };
                      if (isChecked) {
                        const bs = parseFloat(String(next.backstock_quantity || 0)) || 0;
                        const ps = parseFloat(String(next.package_size || 0)) || 0;
                        const bar = parseFloat(String(next.bar_quantity || 0)) || 0;
                        if (ps > 0) {
                          next.quantity = (bs * ps) + bar;
                        }
                      }
                      return next;
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
              </label>
            </div>

            {/* Package Unit & Size fields */}
            <div className="grid grid-cols-2 gap-2.5 text-xs pt-2 border-t border-stone-200">
              <div>
                <label className="text-[11px] text-stone-700 font-medium block mb-1">
                  หน่วยบรรจุภัณฑ์ที่ซื้อมา {formData.is_two_tier && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  placeholder="เช่น ขวด, ลัง, ถุง, กล่อง, แกลลอน"
                  value={formData.package_unit || ''}
                  onChange={(e) => setFormData({ ...formData, package_unit: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-200 rounded-xl font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-700 font-medium block mb-1">
                  ขนาดบรรจุต่อ 1 {formData.package_unit || 'แพ็ค/ขวด'} ({formData.unit}) {formData.is_two_tier && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={`เช่น 2000 (${formData.unit})`}
                  value={formData.package_size === undefined || formData.package_size === '' ? '' : formData.package_size}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setFormData((prev) => {
                        const next = { ...prev, package_size: val === '' ? '' : val };
                        if (next.is_two_tier) {
                          const bs = parseFloat(String(next.backstock_quantity || 0)) || 0;
                          const ps = parseFloat(val) || 0;
                          const bar = parseFloat(String(next.bar_quantity || 0)) || 0;
                          next.quantity = (bs * ps) + bar;
                        }
                        return next;
                      });
                    }
                  }}
                  className="w-full p-2 bg-white border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>

            {/* If Two-tier is enabled, show Backstock & Bar stock initial inputs */}
            {formData.is_two_tier ? (
              <div className="p-3 bg-white border border-amber-200/90 rounded-xl space-y-2.5 animate-fade-in shadow-2xs">
                <span className="text-xs font-semibold text-stone-900 block">
                  ระบุสต็อกเริ่มต้นแยก 2 จุด
                </span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[11px] text-stone-600 block mb-1">
                      หลังร้าน (ยังไม่เปิด) ({formData.package_unit || 'แพ็ค'})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="เช่น 5"
                      value={formData.backstock_quantity === undefined || formData.backstock_quantity === '' ? '' : formData.backstock_quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setFormData((prev) => {
                            const next = { ...prev, backstock_quantity: val === '' ? '' : val };
                            const bs = parseFloat(val) || 0;
                            const ps = parseFloat(String(next.package_size || 0)) || 0;
                            const bar = parseFloat(String(next.bar_quantity || 0)) || 0;
                            next.quantity = (bs * ps) + bar;
                            return next;
                          });
                        }
                      }}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-600 block mb-1">
                      หน้าบาร์ (เปิดใช้แล้ว) ({formData.unit})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={`เช่น 1200 (${formData.unit})`}
                      value={formData.bar_quantity === undefined || formData.bar_quantity === '' ? '' : formData.bar_quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setFormData((prev) => {
                            const next = { ...prev, bar_quantity: val === '' ? '' : val };
                            const bs = parseFloat(String(next.backstock_quantity || 0)) || 0;
                            const ps = parseFloat(String(next.package_size || 0)) || 0;
                            const bar = parseFloat(val) || 0;
                            next.quantity = (bs * ps) + bar;
                            return next;
                          });
                        }
                      }}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 text-[11px]">ยอดรวมทั้งร้านอัตโนมัติ:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {Number(formData.quantity || 0).toLocaleString()} {formData.unit}
                    {Boolean(Number(formData.package_size) > 0) && (
                      <span className="text-stone-500 font-normal font-sans ml-1.5 text-[11px]">
                        (≈ {(Number(formData.quantity || 0) / Number(formData.package_size)).toFixed(1)} {formData.package_unit || 'แพ็ค'})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              Boolean(formData.package_unit && Number(formData.package_size) > 0 && Number(formData.quantity) > 0) && (
                <p className="text-[11px] text-stone-500 font-mono">
                  💡 สต็อกปัจจุบัน {formData.quantity} {formData.unit} เทียบเท่ากับประมาณ{' '}
                  <strong className="text-stone-900 font-bold font-mono">
                    {(Number(formData.quantity) / Number(formData.package_size)).toFixed(1)} {formData.package_unit}
                  </strong>
                </p>
              )
            )}
          </div>

          {/* Smooth Numeric Input: Cost per unit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-normal text-stone-700">
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
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            />
            {Boolean(purchasePrice && Number(formData.quantity) > 0) && (
              <p className="text-xs text-stone-500 mt-1 font-normal">
                💡 {purchasePrice} บาท ÷ {formData.quantity} {formData.unit} = <span className="text-stone-900 font-mono tabular-nums font-medium">{formData.cost_per_unit}</span> บ./{formData.unit}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="font-normal text-stone-700 block mb-1">แหล่งสั่งซื้อ / ซัพพลายเออร์</label>
            <input
              type="text"
              placeholder="เช่น โรงคั่วกาแฟ Aroma, แม็คโคร, CP"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10 text-stone-900 font-normal text-xs"
            />
          </div>
        </div>
        </div>

        {/* Pinned Modal Footer */}
        <div className="p-4 sm:px-7 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-2 text-xs shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"
          >
            {editingTarget ? 'บันทึกการแก้ไข' : 'บันทึกวัตถุดิบ'}
          </Button>
        </div>
      </form>
    </div>
  );
};
