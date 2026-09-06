'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Store,
  Calendar,
  Sparkles,
  ShoppingBag,
  User,
} from 'lucide-react';
import { Ingredient } from '@/types';
import { PurchaseOrder, PurchaseOrderItem } from '../types';
import { useStock } from '@/lib/StockContext';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (po: PurchaseOrder) => void;
  availableIngredients: Ingredient[];
  initialItems?: PurchaseOrderItem[];
  defaultStore?: string;
}

export const CreatePOModal: React.FC<CreatePOModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableIngredients,
  initialItems = [],
  defaultStore = '',
}) => {
  const { units } = useStock();
  const [storeName, setStoreName] = useState(defaultStore || 'โรงคั่วกาแฟ Aroma');
  const [buyerName, setBuyerName] = useState('บาริสต้า / ผู้จัดการ');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('ตรวจเช็ครอบคั่วเมล็ดกาแฟ วันหมดอายุนมสด และสภาพบรรจุภัณฑ์');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  
  // Custom manual item inputs
  const [customItemName, setCustomItemName] = useState('');
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemUnit, setCustomItemUnit] = useState(units[0]?.name || 'กก.');
  const [customItemCost, setCustomItemCost] = useState<number>(50);

  useEffect(() => {
    if (isOpen) {
      if (initialItems && initialItems.length > 0) {
        setItems(initialItems);
      } else {
        setItems([]);
      }
      if (defaultStore) setStoreName(defaultStore);
    }
  }, [isOpen, initialItems, defaultStore]);

  if (!isOpen) return null;

  const commonStores = [
    'โรงคั่วกาแฟ Aroma / เมล็ดกาแฟ',
    'แม็คโคร Makro (นมสด/ไซรัป/วัตถุดิบ)',
    'ร้านบรรจุภัณฑ์ & แพ็กเกจจิ้ง (แก้ว/ฝา/หลอด)',
    'ร้านขายส่งเบเกอรี่ & วัตถุดิบทำขนม',
    'บิ๊กซี / โลตัส (ของใช้ทั่วไป)',
    'ตลาดสด (ผลไม้/ของสดเสริม)',
  ];

  // Quick add from stock list
  const handleAddIngredient = (ingredientId: number) => {
    const ing = availableIngredients.find((i) => i.id === ingredientId);
    if (!ing) return;

    const existingIndex = items.findIndex((item) => item.ingredient_id === ing.id);
    if (existingIndex > -1) {
      setItems((prev) => {
        const next = [...prev];
        next[existingIndex].quantity += 1;
        next[existingIndex].total_price = next[existingIndex].quantity * next[existingIndex].cost_per_unit;
        return next;
      });
    } else {
      const suggestedQty = Math.max(1, Math.ceil(ing.reorder_point * 2 - ing.quantity));
      const newItem: PurchaseOrderItem = {
        ingredient_id: ing.id,
        name: ing.name,
        quantity: suggestedQty > 0 ? suggestedQty : 3,
        unit: ing.unit,
        cost_per_unit: ing.cost_per_unit || 50,
        total_price: (suggestedQty > 0 ? suggestedQty : 3) * (ing.cost_per_unit || 50),
        current_stock: ing.quantity,
        reorder_point: ing.reorder_point,
        checked: false,
      };
      setItems((prev) => [...prev, newItem]);
    }
    setSelectedIngredientId('');
  };

  // Add custom manual item
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) return;
    const newItem: PurchaseOrderItem = {
      name: customItemName.trim(),
      quantity: Number(customItemQty) || 1,
      unit: customItemUnit.trim() || 'ชิ้น',
      cost_per_unit: Number(customItemCost) || 0,
      total_price: (Number(customItemQty) || 1) * (Number(customItemCost) || 0),
      checked: false,
    };
    setItems((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemQty(1);
    setCustomItemCost(50);
  };

  const handleUpdateQty = (index: number, qty: number) => {
    const validQty = Math.max(0.1, Number(qty) || 1);
    setItems((prev) => {
      const next = [...prev];
      next[index].quantity = validQty;
      next[index].total_price = validQty * next[index].cost_per_unit;
      return next;
    });
  };

  const handleUpdateCost = (index: number, cost: number) => {
    const validCost = Math.max(0, Number(cost) || 0);
    setItems((prev) => {
      const next = [...prev];
      next[index].cost_per_unit = validCost;
      next[index].total_price = next[index].quantity * validCost;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert('กรุณาระบุสถานที่หรือร้านค้าที่จะไปซื้อ');
      return;
    }
    if (items.length === 0) {
      alert('กรุณาเพิ่มรายการสินค้าที่จะไปซื้ออย่างน้อย 1 รายการ');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const newPO: PurchaseOrder = {
      id: `SHOP-${todayStr}-${randomSuffix}`,
      store_name: storeName.trim(),
      buyer_name: buyerName.trim() || 'พนักงานร้าน',
      date,
      status: 'pending',
      items,
      subtotal: totalAmount,
      totalAmount,
      note: note.trim(),
      created_at: new Date().toISOString(),
    };

    onSave(newPO);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-normal">
              <ShoppingBag className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">สร้างใบสั่งซื้อวัตถุดิบ</h3>
              <p className="text-xs text-slate-500">รวมรายการที่ต้องซื้อ พร้อมพิมพ์เช็คลิสต์และคุมงบประมาณ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Target Store & Buyer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-1">
              <label className="font-normal text-slate-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-slate-600" />
                ร้านค้า / ซัพพลายเออร์:
              </label>
              <input
                type="text"
                list="stores-list"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="เช่น โรงคั่วกาแฟ, แม็คโคร, ร้านแพ็กเกจจิ้ง..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-slate-900 text-xs font-normal text-slate-800"
                required
              />
              <datalist id="stores-list">
                {commonStores.map((s, idx) => (
                  <option key={idx} value={s} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="font-normal text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-600" />
                ผู้สั่งซื้อ / ผู้ไปซื้อ:
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="ชื่อผู้สั่งซื้อ..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-slate-900 text-xs font-normal text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-normal text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-600" />
                วันที่สั่งซื้อ:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-slate-900 text-xs font-normal text-slate-800"
                required
              />
            </div>
          </div>

          {/* Quick Select from Stock */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-normal text-slate-900 flex items-center gap-1.5">
                เลือกวัตถุดิบจากคลังที่ต้องการซื้อเพิ่ม:
              </span>
              <span className="text-[11px] text-slate-500">วัตถุดิบในระบบ {availableIngredients.length} รายการ</span>
            </div>

            <Dropdown
              options={[
                { value: '', label: '-- คลิกเลือกวัตถุดิบเพื่อเพิ่มลงรายการซื้อ --' },
                ...availableIngredients.map((ing) => ({
                  value: ing.id,
                  label: `${ing.name} (ในคลังเหลือ: ${ing.quantity} ${ing.unit})`,
                  badge: `จุดเตือน: ${ing.reorder_point} ${ing.unit}`,
                })),
              ]}
              value={selectedIngredientId}
              onChange={(val) => {
                if (val) handleAddIngredient(Number(val));
              }}
              placeholder="-- คลิกเลือกวัตถุดิบเพื่อเพิ่มลงรายการซื้อ --"
              className="w-full"
              buttonClassName="bg-white border border-emerald-300 text-xs font-medium text-slate-800"
              size="md"
            />
          </div>

          {/* Shopping Checklist Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">
                รายการของที่ต้องไปซื้อ ({items.length} รายการ)
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">แก้ไขจำนวนและราคาโดยประมาณได้</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <th className="py-2.5 px-3">รายการของที่ต้องซื้อ</th>
                    <th className="py-2.5 px-3 text-center w-24">จำนวน</th>
                    <th className="py-2.5 px-3 text-center w-16">หน่วย</th>
                    <th className="py-2.5 px-3 text-right w-24">ราคาประมาณ</th>
                    <th className="py-2.5 px-3 text-right w-28">ยอดเงินรวม</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                        ยังไม่มีรายการซื้อ เลือกวัตถุดิบจากคลังด้านบน หรือพิมพ์เพิ่มเองด้านล่าง
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {item.name}
                          {item.current_stock !== undefined && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              ที่ร้านเหลือ: {item.current_stock} {item.unit}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQty(idx, parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold rounded-lg border border-slate-200 focus:outline-emerald-600 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-bold">{item.unit}</td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.cost_per_unit}
                            onChange={(e) => handleUpdateCost(idx, parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 text-right font-medium rounded-lg border border-slate-200 focus:outline-emerald-600 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-800">
                          ฿{item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Add Custom Item (เช่น แก้วกาแฟ หลอด กระดาษทิชชู่ ฯลฯ) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800">+ เพิ่มรายการของใช้อื่นๆ (ไม่ได้อยู่ในคลัง)</span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="เช่น แก้วกาแฟ 16oz, หลอดดูด, กระดาษทิชชู่..."
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs"
              />
              <input
                type="number"
                placeholder="จำนวน"
                min="0.1"
                step="any"
                value={customItemQty}
                onChange={(e) => setCustomItemQty(parseFloat(e.target.value) || 1)}
                className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-center text-xs"
              />
              <div className="w-full">
                <Dropdown
                  options={units.map((u) => ({
                    value: u.name,
                    label: u.name,
                  }))}
                  value={customItemUnit}
                  onChange={(val) => setCustomItemUnit(val)}
                  className="w-full"
                  buttonClassName="bg-white border border-slate-200 text-xs font-bold text-slate-850 py-1.5 px-3 rounded-xl"
                  size="sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-1 text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มลงรายการ
              </button>
            </div>
          </div>

          {/* Note & Budget Total */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1">
            <div className="w-full sm:w-1/2 space-y-1">
              <label className="font-bold text-slate-800">หมายเหตุ / คำสั่งเพิ่มเติม:</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น เลือกรอบคั่วไม่เกิน 7 วัน, ขอนมสดล็อตใหม่..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-emerald-600 text-xs"
              />
            </div>

            <div className="w-full sm:w-64 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>จำนวนรายการ:</span>
                <span className="font-bold text-slate-800">{items.length} รายการ</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>งบประมาณที่ต้องเตรียม:</span>
                <span className="text-emerald-800 text-base">
                  ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={items.length === 0}
            >
              บันทึกใบสั่งซื้อ
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
