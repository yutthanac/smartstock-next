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
  Info,
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
  const [storeName, setStoreName] = useState(defaultStore || '');
  const [buyerName, setBuyerName] = useState('พนักงานร้าน');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  
  // Custom manual item inputs
  const [customItemName, setCustomItemName] = useState('');
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemUnit, setCustomItemUnit] = useState(units[0]?.name || 'ชิ้น');

  useEffect(() => {
    if (isOpen) {
      if (initialItems && initialItems.length > 0) {
        setItems(
          initialItems.map((it) => ({
            ...it,
            cost_per_unit: undefined,
            total_price: undefined,
          }))
        );
      } else {
        setItems([]);
      }
      setStoreName(defaultStore || '');
    }
  }, [isOpen, initialItems, defaultStore]);

  if (!isOpen) return null;

  const commonStores = [
    'ตลาดสด / ร้านค้าทั่วไป',
    'แม็คโคร Makro',
    'โรงคั่วกาแฟ / ซัพพลายเออร์เมล็ด',
    'ร้านบรรจุภัณฑ์ & แพ็กเกจจิ้ง (แก้ว/ฝา/หลอด)',
    'ร้านขายส่งเบเกอรี่ & วัตถุดิบทำขนม',
    'บิ๊กซี / โลตัส',
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
        return next;
      });
    } else {
      const suggestedQty = Math.max(1, Math.ceil(ing.reorder_point * 2 - ing.quantity));
      const newItem: PurchaseOrderItem = {
        ingredient_id: ing.id,
        name: ing.name,
        quantity: suggestedQty > 0 ? suggestedQty : 1,
        unit: ing.unit,
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
    const qty = Number(customItemQty) || 1;
    const newItem: PurchaseOrderItem = {
      name: customItemName.trim(),
      quantity: qty,
      unit: customItemUnit.trim() || 'ชิ้น',
      checked: false,
    };
    setItems((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemQty(1);
  };

  const handleUpdateQty = (index: number, qty: number) => {
    const validQty = Math.max(0.1, Number(qty) || 1);
    setItems((prev) => {
      const next = [...prev];
      next[index].quantity = validQty;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('กรุณาเพิ่มรายการสินค้าที่จะไปซื้ออย่างน้อย 1 รายการ');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const newPO: PurchaseOrder = {
      id: `SHOP-${todayStr}-${randomSuffix}`,
      store_name: storeName.trim() || 'ตลาด / ร้านทั่วไป (ไม่ระบุ)',
      buyer_name: buyerName.trim() || 'พนักงานร้าน',
      date,
      status: 'pending',
      items,
      subtotal: 0,
      totalAmount: 0,
      note: note.trim(),
      created_at: new Date().toISOString(),
    };

    onSave(newPO);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-normal">
              <ShoppingBag className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">สร้างลิสต์รายการไปซื้อของ (Shopping List)</h3>
              <p className="text-xs text-slate-500">จดรายการที่จะไปซื้อ ไม่ต้องใส่ราคา — สแกนราคาจริงจากใบเสร็จด้วย AI ทีหลัง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Target Store & Buyer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="font-medium text-slate-900 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-500" />
                ร้านค้า / แหล่งซื้อ (ไม่บังคับ):
              </label>
              <input
                type="text"
                list="stores-list"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="เช่น แม็คโคร, ตลาดสด (เว้นว่างได้)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-slate-900 text-xs font-normal text-slate-800"
              />
              <datalist id="stores-list">
                {commonStores.map((s, idx) => (
                  <option key={idx} value={s} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                ผู้ไปซื้อของ:
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="ชื่อผู้ไปซื้อของ..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-slate-900 text-xs font-normal text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                วันที่สร้างลิสต์:
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
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900 flex items-center gap-1.5">
                เลือกวัตถุดิบจากคลังที่ต้องการซื้อ:
              </span>
              <span className="text-[11px] text-slate-500">ในระบบมี {availableIngredients.length} รายการ</span>
            </div>

            <Dropdown
              options={[
                { value: '', label: '-- คลิกเลือกวัตถุดิบเพื่อเพิ่มลงลิสต์ --' },
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
              placeholder="-- คลิกเลือกวัตถุดิบเพื่อเพิ่มลงลิสต์ --"
              className="w-full"
              buttonClassName="bg-white border border-slate-200 text-xs font-medium text-slate-800 py-2 rounded-xl"
              size="md"
            />
          </div>

          {/* Shopping Checklist Table (Items, Qty, Unit ONLY - NO PRICE) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">
                รายการของที่ต้องไปซื้อ ({items.length} รายการ)
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">ระบุแค่ชื่อและจำนวนที่ต้องการ</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <th className="py-2.5 px-4">รายการของที่ต้องซื้อ</th>
                    <th className="py-2.5 px-3 text-center w-28">จำนวนที่ต้องซื้อ</th>
                    <th className="py-2.5 px-3 text-center w-24">หน่วย</th>
                    <th className="py-2.5 px-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                        ยังไม่มีรายการซื้อ เลือกวัตถุดิบจากคลังด้านบน หรือพิมพ์เพิ่มเองด้านล่าง
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {item.name}
                          {item.current_stock !== undefined && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              (ในร้านเหลือ: {item.current_stock} {item.unit})
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
                            className="w-24 px-2.5 py-1 text-center font-bold text-sm rounded-lg border border-slate-200 focus:outline-emerald-600 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                          {item.unit}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="ลบรายการ"
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

          {/* Quick Add Custom Item (ของใช้อื่นๆ ที่ไม่ได้อยู่ในคลัง) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-800 text-xs">+ เพิ่มของใช้อื่นๆ (ไม่ได้อยู่ในคลัง เช่น แก้ว/หลอด/ทิชชู่):</span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="ชื่อของที่ต้องซื้อ เช่น แก้ว 16oz, กระดาษทิชชู่..."
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-normal"
              />
              <input
                type="number"
                placeholder="จำนวน"
                min="0.1"
                step="any"
                value={customItemQty}
                onChange={(e) => setCustomItemQty(parseFloat(e.target.value) || 1)}
                className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-center text-xs font-semibold"
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
                  buttonClassName="bg-white border border-slate-200 text-xs font-medium text-slate-800 py-1.5 px-3 rounded-xl"
                  size="sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors flex items-center justify-center gap-1 text-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มลงลิสต์
              </button>
            </div>
          </div>

          {/* Note for Buyer */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-800">หมายเหตุ / ฝากคนไปซื้อ:</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ดูวันหมดอายุ, โทรแจ้งก่อนซื้อถ้าของหมด, ขอใบเสร็จ/บิลเงินสดมาด้วย..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-slate-900 text-xs"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-medium text-xs">
              รวมทั้งหมด <span className="font-bold text-slate-900">{items.length}</span> รายการ
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="cursor-pointer"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={items.length === 0}
                className="cursor-pointer"
              >
                บันทึกลิสต์ไปซื้อของ
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
