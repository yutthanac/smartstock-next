'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Store,
  Calendar,
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
      setBuyerName('พนักงานร้าน');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setSelectedIngredientId('');
    }
  }, [isOpen, initialItems, defaultStore]);

  if (!isOpen) return null;

  // Add ingredient from system
  const handleAddIngredient = (ingId: number) => {
    const ing = availableIngredients.find((i) => i.id === ingId);
    if (!ing) return;

    if (items.some((i) => i.ingredient_id === ing.id)) {
      alert(`มีรายการ "${ing.name}" อยู่ในลิสต์แล้ว สามารถแก้ไขจำนวนได้โดยตรง`);
      setSelectedIngredientId('');
      return;
    }

    const newItem: PurchaseOrderItem = {
      ingredient_id: ing.id,
      name: ing.name,
      quantity: Math.max(1, (ing.max_stock || ing.reorder_point * 3) - ing.quantity),
      unit: ing.unit,
      current_stock: ing.quantity,
      reorder_point: ing.reorder_point,
      checked: false,
    };

    setItems([...items, newItem]);
    setSelectedIngredientId('');
  };

  // Add custom unmanaged item (e.g. cups, tissues)
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) {
      alert('กรุณากรอกชื่อสิ่งของที่ต้องการซื้อ');
      return;
    }

    const newItem: PurchaseOrderItem = {
      name: customItemName.trim(),
      quantity: customItemQty > 0 ? customItemQty : 1,
      unit: customItemUnit,
      checked: false,
    };

    setItems([...items, newItem]);
    setCustomItemName('');
    setCustomItemQty(1);
  };

  // Update quantity
  const handleUpdateQty = (index: number, newQty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(0.1, isNaN(newQty) ? 1 : newQty);
    setItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert('กรุณาระบุร้านหรือตลาดที่จะไปซื้อ');
      return;
    }
    if (items.length === 0) {
      alert('กรุณาเพิ่มรายการของที่ต้องไปซื้ออย่างน้อย 1 รายการ');
      return;
    }

    const poId = `PO-${date.replace(/-/g, '')}-${String(Math.floor(10 + Math.random() * 90))}`;
    const newPO: PurchaseOrder = {
      id: poId,
      store_name: storeName.trim(),
      buyer_name: buyerName.trim() || 'พนักงานร้าน',
      date,
      status: 'pending',
      items,
      note: note.trim() || undefined,
    };

    onSave(newPO);
  };

  const commonStores = [
    'แม็คโคร สาขาใกล้ร้าน',
    'ตลาดสดตอนเช้า',
    'โรงคั่วกาแฟ Aroma Specialty',
    'โลตัส ซูเปอร์มาร์เก็ต',
    'ร้านเบเกอรี่ซัพพลาย',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-stone-700" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">สร้างลิสต์รายการไปซื้อของ (Checklist)</h3>
              <p className="text-xs text-stone-500">จดรายการของที่ต้องไปซื้อให้พนักงานออกไปจ่ายตลาด</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Top Quick Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-stone-500" />
                ร้าน/ตลาดเป้าหมาย:
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="เช่น แม็คโคร, ตลาดสด..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 text-xs font-normal text-stone-900"
                list="stores-list"
                required
              />
              <datalist id="stores-list">
                {commonStores.map((s, idx) => (
                  <option key={idx} value={s} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-500" />
                ผู้ไปซื้อของ:
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="ชื่อผู้ไปซื้อของ..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 text-xs font-normal text-stone-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                วันที่สร้างลิสต์:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 text-xs font-normal text-stone-900 font-mono tabular-nums"
                required
              />
            </div>
          </div>

          {/* Quick Select from Stock */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                เลือกวัตถุดิบจากคลังที่ต้องการซื้อ:
              </span>
              <span className="text-xs text-stone-500">ในระบบมี <span className="font-mono tabular-nums">{availableIngredients.length}</span> รายการ</span>
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
              buttonClassName="bg-white border border-stone-200 text-xs font-medium text-stone-800 py-2 rounded-xl"
              size="md"
            />
          </div>

          {/* Shopping Checklist Table (Items, Qty, Unit ONLY - NO PRICE) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-900 text-sm">
                รายการของที่ต้องไปซื้อ (<span className="font-mono tabular-nums font-bold">{items.length}</span> รายการ)
              </h4>
              <span className="text-xs text-stone-400 font-medium">ระบุแค่ชื่อและจำนวนที่ต้องการ</span>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200 uppercase text-xs">
                    <th className="py-2.5 px-4">รายการของที่ต้องซื้อ</th>
                    <th className="py-2.5 px-3 text-center w-28">จำนวนที่ต้องซื้อ</th>
                    <th className="py-2.5 px-3 text-center w-24">หน่วย</th>
                    <th className="py-2.5 px-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-stone-400 font-normal">
                        ยังไม่มีรายการซื้อ เลือกวัตถุดิบจากคลังด้านบน หรือพิมพ์เพิ่มเองด้านล่าง
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="py-2.5 px-4 font-semibold text-stone-900">
                          {item.name}
                          {item.current_stock !== undefined && (
                            <span className="block text-xs text-stone-400 font-normal font-mono tabular-nums">
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
                            className="w-24 px-2.5 py-1 text-center font-bold text-sm rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-white font-mono tabular-nums"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center text-stone-700 font-medium">
                          {item.unit}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors cursor-pointer"
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

          {/* Quick Add Custom Item */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-semibold text-stone-800 text-xs">+ เพิ่มของใช้อื่นๆ (ไม่ได้อยู่ในคลัง เช่น แก้ว/หลอด/ทิชชู่):</span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="ชื่อของที่ต้องซื้อ เช่น แก้ว 16oz, กระดาษทิชชู่..."
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-normal text-stone-900 focus:outline-none focus:border-stone-400"
              />
              <input
                type="number"
                placeholder="จำนวน"
                min="0.1"
                step="any"
                value={customItemQty}
                onChange={(e) => setCustomItemQty(parseFloat(e.target.value) || 1)}
                className="px-2 py-1.5 rounded-xl bg-white border border-stone-200 text-center text-xs font-semibold font-mono tabular-nums text-stone-900 focus:outline-none focus:border-stone-400"
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
                  buttonClassName="bg-white border border-stone-200 text-xs font-medium text-stone-800 py-1.5 px-3 rounded-xl"
                  size="sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="px-3 py-1.5 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-1 text-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มลงลิสต์
              </button>
            </div>
          </div>

          {/* Note for Buyer */}
          <div className="space-y-1">
            <label className="font-semibold text-stone-800">หมายเหตุ / ฝากคนไปซื้อ:</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ดูวันหมดอายุ, โทรแจ้งก่อนซื้อถ้าของหมด, ขอใบเสร็จ/บิลเงินสดมาด้วย..."
              className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 text-xs text-stone-900"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <span className="text-stone-500 font-medium text-xs">
              รวมทั้งหมด <span className="font-bold text-stone-900 font-mono tabular-nums">{items.length}</span> รายการ
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="cursor-pointer rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={items.length === 0}
                className="cursor-pointer rounded-xl bg-stone-900 text-white hover:bg-stone-800"
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
