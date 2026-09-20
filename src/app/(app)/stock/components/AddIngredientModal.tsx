'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Sparkles, Package, Info, Search } from 'lucide-react';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';
import { useStock } from '@/lib/StockContext';
import { Ingredient } from '@/types';
import {
  CAFE_STANDARD_PRESETS,
  CafeIngredientPreset,
  formatInteger,
} from '@/lib/cafePresets';

export interface IngredientFormData {
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
}

export interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingTarget?: Ingredient | null;
  formData: IngredientFormData;
  setFormData: React.Dispatch<React.SetStateAction<IngredientFormData>>;
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
  const [presetSearch, setPresetSearch] = useState<string>('');
  const [showPresetPicker, setShowPresetPicker] = useState<boolean>(!editingTarget);
  const [packCountInput, setPackCountInput] = useState<string>('');

  // Sync purchase price & package count when editingTarget or initial quantity changes
  useEffect(() => {
    if (editingTarget) {
      const qty = parseFloat(String(editingTarget.quantity));
      const cost = parseFloat(String(editingTarget.cost_per_unit));
      if (!isNaN(qty) && !isNaN(cost) && qty > 0 && cost > 0) {
        setPurchasePrice(String(Math.round(qty * cost)));
      } else {
        setPurchasePrice('');
      }

      const pSize = Number(editingTarget.package_size || 0);
      if (pSize > 0 && !isNaN(qty)) {
        setPackCountInput(String(Math.round(qty / pSize)));
      } else {
        setPackCountInput('');
      }
      setShowPresetPicker(false);
    } else {
      setPurchasePrice('');
      setPackCountInput('');
      setShowPresetPicker(true);
    }
  }, [editingTarget, isOpen]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: CafeIngredientPreset) => {
    const defaultPacks = 5;
    const totalQty = preset.package_size * defaultPacks;
    const estTotalPrice = Math.round(totalQty * preset.cost_per_unit);

    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      category: preset.category,
      unit: preset.unit,
      package_unit: preset.package_unit,
      package_size: preset.package_size,
      cost_per_unit: preset.cost_per_unit,
      quantity: totalQty,
      max_stock: totalQty * 2,
      reorder_point: preset.reorder_point,
      supplier: preset.supplier,
      tracking_type: 'strict',
      is_two_tier: false,
    }));

    setPackCountInput(String(defaultPacks));
    setPurchasePrice(String(estTotalPrice));
    setShowPresetPicker(false);
  };

  // Handle Package Count changes (e.g. user enters "5" bottles)
  const handlePackCountChange = (val: string) => {
    if (val === '' || /^\d*$/.test(val)) {
      setPackCountInput(val);
      const packs = parseInt(val, 10);
      const pSize = parseFloat(String(formData.package_size || 0)) || 0;
      if (!isNaN(packs) && packs >= 0 && pSize > 0) {
        const calculatedQty = packs * pSize;
        setFormData((prev) => {
          const cost = parseFloat(String(prev.cost_per_unit || 0)) || 0;
          if (cost > 0) {
            setPurchasePrice(String(Math.round(calculatedQty * cost)));
          }
          return {
            ...prev,
            quantity: calculatedQty,
            max_stock: prev.max_stock ? prev.max_stock : calculatedQty * 2,
          };
        });
      } else if (val === '') {
        setFormData((prev) => ({ ...prev, quantity: '' }));
      }
    }
  };

  // Handle Base Quantity change (e.g. user enters "10000" ml)
  const handleQuantityChange = (val: string) => {
    if (val === '' || /^\d*$/.test(val)) {
      const qtyNum = parseInt(val, 10);
      const pSize = parseFloat(String(formData.package_size || 0)) || 0;
      if (!isNaN(qtyNum) && pSize > 0) {
        setPackCountInput(String(Math.round(qtyNum / pSize)));
      } else {
        setPackCountInput('');
      }

      const priceNum = parseFloat(purchasePrice);
      let newCost = formData.cost_per_unit;
      if (!isNaN(priceNum) && priceNum > 0 && !isNaN(qtyNum) && qtyNum > 0) {
        newCost = Math.round((priceNum / qtyNum) * 10000) / 10000;
      }

      setFormData((prev) => ({
        ...prev,
        quantity: val === '' ? '' : qtyNum,
        cost_per_unit: newCost,
      }));
    }
  };

  const handlePurchasePriceChange = (val: string) => {
    if (val === '' || /^\d*$/.test(val)) {
      setPurchasePrice(val);
      const priceNum = parseFloat(val);
      const qtyNum = parseFloat(String(formData.quantity));
      if (!isNaN(priceNum) && !isNaN(qtyNum) && qtyNum > 0) {
        const unitCost = Math.round((priceNum / qtyNum) * 10000) / 10000;
        setFormData((prev) => ({ ...prev, cost_per_unit: unitCost }));
      }
    }
  };

  const handleCostPerUnitChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      const unitCost = parseFloat(val);
      const qtyNum = parseFloat(String(formData.quantity));
      if (!isNaN(unitCost) && !isNaN(qtyNum) && qtyNum > 0) {
        setPurchasePrice(String(Math.round(unitCost * qtyNum)));
      }
      setFormData((prev) => ({ ...prev, cost_per_unit: val === '' ? '' : val }));
    }
  };

  const filteredPresets = CAFE_STANDARD_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(presetSearch.toLowerCase())
  );

  const packSizeNum = parseFloat(String(formData.package_size || 0)) || 0;
  const currentQtyNum = parseFloat(String(formData.quantity || 0)) || 0;
  const computedPacks = packSizeNum > 0 ? Math.floor(currentQtyNum / packSizeNum) : 0;
  const computedRemainder = packSizeNum > 0 ? Math.round(currentQtyNum % packSizeNum) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 animate-scale-in overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:px-7 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700 flex items-center justify-center font-normal shadow-2xs">
              {editingTarget ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">
                {editingTarget ? `แก้ไขวัตถุดิบ: ${editingTarget.name}` : 'เพิ่มวัตถุดิบใหม่เข้าสต็อก'}
              </h3>
              <p className="text-stone-500 text-xs mt-0.5">
                ระบบสต็อกเดี่ยวรวมศูนย์ จัดการตามขนาดบรรจุภัณฑ์มาตรฐานคาเฟ่
              </p>
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
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Quick Preset Selector Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-stone-900 text-xs">
                  เลือกจากวัตถุดิบคาเฟ่มาตรฐาน (Auto-Fill ขนาดบรรจุ & หน่วย)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetPicker(!showPresetPicker)}
                className="text-stone-600 hover:text-stone-900 text-[11px] underline cursor-pointer"
              >
                {showPresetPicker ? 'ย่อรายการ Preset' : 'เปิดดู Preset ทั้งหมด'}
              </button>
            </div>

            {showPresetPicker && (
              <div className="space-y-2.5 pt-2 border-t border-stone-200/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหาวัตถุดิบมาตรฐาน (เช่น กาแฟ, นมสด, ไซรัป, มัทฉะ, แก้ว)..."
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="p-2.5 bg-white hover:bg-stone-100/80 border border-stone-200/90 rounded-xl text-left transition-all hover:border-stone-400 group cursor-pointer shadow-2xs"
                    >
                      <div className="font-semibold text-stone-900 text-xs group-hover:text-stone-950 flex items-center justify-between">
                        <span className="truncate">{preset.name}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1.5 font-mono">
                        <span className="bg-stone-100 px-1.5 py-0.2 rounded font-sans text-[10px] text-stone-700">
                          1 {preset.package_unit} = {preset.package_size.toLocaleString()} {preset.unit}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ingredient Name */}
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-800 block mb-1">
                ชื่อวัตถุดิบ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น เมล็ดกาแฟ House Blend, นมสด Meiji, ไซรัปวานิลลา Monin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 focus:outline-none text-stone-900 font-medium text-xs"
              />
            </div>

            {/* Category */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1">หมวดหมู่</label>
              <Dropdown
                value={formData.category}
                onChange={(cat) => setFormData({ ...formData, category: cat })}
                options={[
                  { value: 'เมล็ดกาแฟ & ชา', label: 'เมล็ดกาแฟ & ชา' },
                  { value: 'นมและผลิตภัณฑ์นม', label: 'นมและผลิตภัณฑ์นม' },
                  { value: 'ผงชาและเครื่องดื่ม', label: 'ผงชาและเครื่องดื่ม' },
                  { value: 'ไซรัปและสารให้ความหวาน', label: 'ไซรัปและสารให้ความหวาน' },
                  { value: 'น้ำผลไม้และเพียวเร่', label: 'น้ำผลไม้และเพียวเร่' },
                  { value: 'บรรจุภัณฑ์', label: 'บรรจุภัณฑ์' },
                  { value: 'เบเกอรี่และของทานเล่น', label: 'เบเกอรี่และของทานเล่น' },
                  { value: 'อื่นๆ', label: 'อื่นๆ' },
                ]}
                className="w-full"
                buttonClassName="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs"
              />
            </div>

            {/* Base Unit */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1">
                หน่วยย่อยตัดสูตร (Base Unit) <span className="text-rose-500">*</span>
              </label>
              <Dropdown
                value={formData.unit}
                onChange={(u) => setFormData({ ...formData, unit: u })}
                options={[
                  { value: 'มล.', label: 'มล. (มิลลิลิตร - นม/ไซรัป/น้ำ)' },
                  { value: 'กรัม', label: 'กรัม (กาแฟ/ผงชา/โกโก้/มัทฉะ)' },
                  { value: 'ใบ', label: 'ใบ (แก้ว)' },
                  { value: 'ชิ้น', label: 'ชิ้น (ฝา/เบเกอรี่)' },
                  { value: 'เส้น', label: 'เส้น (หลอด)' },
                  { value: 'ฟอง', label: 'ฟอง (ไข่)' },
                ]}
                className="w-full"
                buttonClassName="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs"
              />
            </div>

            {/* Standard Packaging Box */}
            <div className="sm:col-span-2 p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-stone-700" />
                <span className="font-bold text-stone-900 text-xs">
                  กำหนดขนาดบรรจุมาตรฐาน (เช่น นม 2,000 มล./ขวด, กาแฟ 500 กรัม/ถุง)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-stone-700 font-medium block mb-1">
                    หน่วยบรรจุภัณฑ์หลัก (เช่น ขวด, ถุง, กล่อง, แถว, ห่อ)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ขวด, ถุง, กล่อง, แถว, ห่อ"
                    value={formData.package_unit || ''}
                    onChange={(e) => setFormData({ ...formData, package_unit: e.target.value })}
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl font-medium text-stone-900 focus:outline-none focus:border-stone-400 text-xs"
                  />
                </div>

                <div>
                  <label className="text-stone-700 font-medium block mb-1">
                    ขนาดบรรจุต่อ 1 {formData.package_unit || 'หน่วย'} ({formData.unit})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder={`เช่น 2000 (มล.), 500 (กรัม)`}
                    value={formData.package_size === undefined || formData.package_size === '' ? '' : formData.package_size}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setFormData((prev) => ({
                          ...prev,
                          package_size: val === '' ? '' : parseInt(val, 10),
                        }));
                      }
                    }}
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-900 focus:outline-none focus:border-stone-400 text-xs"
                  />
                </div>
              </div>

              {Boolean(formData.package_unit && formData.package_size) && (
                <div className="flex items-center gap-1.5 text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200/80 text-[11px]">
                  <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    สูตรมาตรฐาน: <strong>1 {formData.package_unit}</strong> ={' '}
                    <strong className="font-mono text-stone-900">
                      {formatInteger(formData.package_size)} {formData.unit}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Initial Stock Input with Dual Package/Base synchronization */}
            <div className="sm:col-span-2 p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
              <span className="font-bold text-stone-900 text-xs block">
                จำนวนสต็อกเริ่มต้น (กรอกเป็นจำนวน {formData.package_unit || 'ขวด/ถุง'} หรือหน่วยย่อย)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-medium block mb-1">
                    จำนวน {formData.package_unit || 'แพ็ค/ขวด/ถุง'} เต็ม
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="เช่น 5"
                    value={packCountInput}
                    onChange={(e) => handlePackCountChange(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div>
                  <label className="text-stone-700 font-medium block mb-1">
                    ยอดรวมสุทธิ ({formData.unit})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="เช่น 10000"
                    value={formData.quantity === '' ? '' : formData.quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              {/* Display Result Summary with NO decimals */}
              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
                <span className="text-stone-500">ผลลัพธ์สต็อกที่จะบันทึก:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-stone-500 font-sans text-xs">
                    [ยอดในระบบ: {formatInteger(formData.quantity)} {formData.unit}]
                  </span>
                </div>
              </div>
            </div>

            {/* Reorder Point */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1">
                จุดสั่งซื้อขั้นต่ำ ({formData.unit})
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="เช่น 2000"
                value={formData.reorder_point === '' ? '' : formData.reorder_point}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*$/.test(val)) {
                    setFormData({ ...formData, reorder_point: val === '' ? '' : parseInt(val, 10) });
                  }
                }}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums font-bold text-amber-900 focus:bg-white focus:outline-none focus:border-stone-400"
              />
              {packSizeNum > 0 && formData.package_unit && (
                <p className="text-[11px] text-stone-500 mt-1 font-mono">
                  ≈ {Math.round((parseFloat(String(formData.reorder_point || 0)) || 0) / packSizeNum).toLocaleString()} {formData.package_unit}
                </p>
              )}
            </div>

            {/* Cost per unit */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1">
                ต้นทุนต่อหน่วย (บาท/{formData.unit})
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="เช่น 0.055"
                value={formData.cost_per_unit === '' ? '' : formData.cost_per_unit}
                onChange={(e) => handleCostPerUnitChange(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
              />
              {packSizeNum > 0 && formData.package_unit && (
                <p className="text-[11px] text-stone-500 mt-1 font-mono">
                  ≈ {Math.round((parseFloat(String(formData.cost_per_unit || 0)) || 0) * packSizeNum).toLocaleString()} บาท/{formData.package_unit}
                </p>
              )}
            </div>

            {/* Total Purchase Price */}
            <div>
              <label className="font-normal text-stone-700 block mb-1">ราคารวมซื้อทั้งหมด (บาท)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="เช่น 550"
                value={purchasePrice}
                onChange={(e) => handlePurchasePriceChange(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono tabular-nums text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="font-normal text-stone-700 block mb-1">แหล่งสั่งซื้อ / ซัพพลายเออร์</label>
              <input
                type="text"
                placeholder="เช่น แม็คโคร, CP-Meiji, Monin"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:border-stone-400 text-stone-900 font-normal"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
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
            {editingTarget ? 'บันทึกการแก้ไข' : 'บันทึกวัตถุดิบเข้าสต็อก'}
          </Button>
        </div>
      </form>
    </div>
  );
};
