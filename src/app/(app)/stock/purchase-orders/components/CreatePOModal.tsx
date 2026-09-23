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
  Package,
  AlertTriangle,
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

const isContinuousUnit = (u?: string) => {
  if (!u) return false;
  const clean = u.trim().toLowerCase();
  return [
    'กรัม',
    'g',
    'gram',
    'grams',
    'มล.',
    'ml',
    'cc',
    'ซีซี',
    'มิลลิลิตร',
    'กก.',
    'kg',
    'กิโล',
    'กิโลกรัม',
    'ลิตร',
    'l',
  ].includes(clean);
};

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
  const [customItemCost, setCustomItemCost] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialItems && initialItems.length > 0) {
        setItems(
          initialItems.map((it) => {
            const ing = it.ingredient_id
              ? availableIngredients.find((i) => i.id === it.ingredient_id)
              : null;
            const ps = ing?.package_size && Number(ing.package_size) > 1 ? Number(ing.package_size) : 1;
            const unitCost =
              it.cost_per_unit ?? (ing?.cost_per_unit ? ing.cost_per_unit * ps : undefined);
            const totalPrice =
              it.total_price ?? (unitCost !== undefined ? it.quantity * unitCost : undefined);
            return {
              ...it,
              cost_per_unit: unitCost,
              total_price: totalPrice,
            };
          })
        );
      } else {
        setItems([]);
      }
      setStoreName(defaultStore || '');
      setBuyerName('พนักงานร้าน');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setSelectedIngredientId('');
      setCustomItemCost('');
    }
  }, [isOpen, initialItems, defaultStore, availableIngredients]);

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

    const isRaw = isContinuousUnit(ing.unit);
    const packSize = Number(ing.package_size || 0);
    const targetDiff = Math.max(1, (ing.max_stock || ing.reorder_point * 3) - ing.quantity);

    let quantity = targetDiff;
    let unit = ing.unit;

    if (isRaw) {
      unit = 'ชิ้น';
      if (packSize > 1) {
        quantity = Math.max(1, Math.ceil(targetDiff / packSize));
      }
    }

    const unitCost = ing.cost_per_unit ? ing.cost_per_unit * (packSize > 1 ? packSize : 1) : undefined;
    const totalPrice = unitCost !== undefined ? quantity * unitCost : undefined;

    const newItem: PurchaseOrderItem = {
      ingredient_id: ing.id,
      name: ing.name,
      quantity,
      unit,
      cost_per_unit: unitCost,
      total_price: totalPrice,
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

    const qty = customItemQty > 0 ? customItemQty : 1;
    const parsedCost = customItemCost ? parseFloat(customItemCost) : undefined;
    const unitCost = parsedCost !== undefined && !isNaN(parsedCost) ? parsedCost : undefined;
    const totalPrice = unitCost !== undefined ? qty * unitCost : undefined;

    const newItem: PurchaseOrderItem = {
      name: customItemName.trim(),
      quantity: qty,
      unit: customItemUnit,
      cost_per_unit: unitCost,
      total_price: totalPrice,
      checked: false,
    };

    setItems([...items, newItem]);
    setCustomItemName('');
    setCustomItemQty(1);
    setCustomItemCost('');
  };

  // Update quantity
  const handleUpdateQty = (index: number, newQty: number) => {
    const updated = [...items];
    const qty = Math.max(0.1, isNaN(newQty) ? 1 : newQty);
    updated[index].quantity = qty;
    if (updated[index].cost_per_unit !== undefined) {
      updated[index].total_price = qty * updated[index].cost_per_unit!;
    }
    setItems(updated);
  };

  // Update price per unit
  const handleUpdateUnitCost = (index: number, newCost: number | undefined) => {
    const updated = [...items];
    updated[index].cost_per_unit = newCost;
    if (newCost !== undefined && !isNaN(newCost)) {
      updated[index].total_price = updated[index].quantity * newCost;
    } else {
      updated[index].total_price = undefined;
    }
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

    const estimatedTotal = items.reduce((sum, it) => sum + (it.total_price || 0), 0);
    const poId = `PO-${date.replace(/-/g, '')}-${String(Math.floor(10 + Math.random() * 90))}`;
    const newPO: PurchaseOrder = {
      id: poId,
      store_name: storeName.trim(),
      buyer_name: buyerName.trim() || 'พนักงานร้าน',
      date,
      status: 'pending',
      items,
      totalAmount: estimatedTotal > 0 ? estimatedTotal : undefined,
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

  // Compute estimated totals for the checklist table
  const estimatedTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);

  // Pull all low-stock items into checklist
  const lowStockIngredients = availableIngredients.filter(
    (ing) => (ing.status === 'low' || ing.status === 'out' || ing.quantity <= ing.reorder_point) &&
             !items.some((i) => i.ingredient_id === ing.id)
  );

  const handleAddLowStock = () => {
    if (lowStockIngredients.length === 0) {
      alert('ไม่มีวัตถุดิบที่ใกล้หมดเพิ่มเติม');
      return;
    }

    const newItems: PurchaseOrderItem[] = lowStockIngredients.map((ing) => {
      const isRaw = isContinuousUnit(ing.unit);
      const packSize = Number(ing.package_size || 0);
      const targetDiff = Math.max(1, (ing.max_stock || ing.reorder_point * 3) - ing.quantity);

      let quantity = targetDiff;
      let unit = ing.unit;

      if (isRaw) {
        unit = 'ชิ้น';
        if (packSize > 1) {
          quantity = Math.max(1, Math.ceil(targetDiff / packSize));
        }
      }

      const unitCost = ing.cost_per_unit ? ing.cost_per_unit * (packSize > 1 ? packSize : 1) : undefined;
      const totalPrice = unitCost !== undefined ? quantity * unitCost : undefined;

      return {
        ingredient_id: ing.id,
        name: ing.name,
        quantity,
        unit,
        cost_per_unit: unitCost,
        total_price: totalPrice,
        current_stock: ing.quantity,
        reorder_point: ing.reorder_point,
        checked: false,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-stone-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-900 text-base">สร้างลิสต์รายการไปซื้อของ (Checklist)</h3>
              <p className="text-xs text-stone-500">จดรายการของที่ต้องไปซื้อให้พนักงานออกไปจ่ายตลาด</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddLowStock}
              className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer"
              title="ดึงรายการวัตถุดิบที่ต่ำกว่าจุดสั่งซื้อเข้าลิสต์"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>ดึงของใกล้หมด</span>
              {lowStockIngredients.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-200/70 text-amber-900 rounded-full font-mono text-[10px] font-bold">
                  {lowStockIngredients.length}
                </span>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Top Quick Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-stone-500" />
                ร้านค้า:
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

          {/* Quick Select from Stock with Search */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900 flex items-center gap-1.5 text-xs">
                <Package className="w-3.5 h-3.5 text-stone-500" />
                เลือกวัตถุดิบจากคลังที่ต้องการซื้อ:
              </span>
              <span className="text-xs text-stone-500">
                ในระบบมี <span className="font-mono tabular-nums font-semibold text-stone-800">{availableIngredients.length}</span> รายการ
              </span>
            </div>

            {/* Searchable Dropdown */}
            <Dropdown
              options={[
                { value: '', label: '-- คลิกเพื่อเลือกวัตถุดิบ --' },
                ...availableIngredients.map((ing) => ({
                  value: ing.id,
                  label: `${ing.name} (เหลือ: ${ing.quantity} ${ing.unit})`,
                  badge: ing.package_size && Number(ing.package_size) > 1
                    ? `1 ชิ้น = ${Number(ing.package_size).toLocaleString()} ${ing.unit}`
                    : undefined,
                })),
              ]}
              value={selectedIngredientId}
              onChange={(val) => {
                if (val) handleAddIngredient(Number(val));
              }}
              placeholder="คลิกเพื่อค้นหาและเลือกวัตถุดิบ..."
              searchable
              searchPlaceholder="พิมพ์ค้นหาชื่อวัตถุดิบ..."
              className="w-full"
              buttonClassName="bg-white border border-stone-200 text-xs font-medium text-stone-800 py-2 rounded-xl shadow-2xs"
              size="md"
            />
          </div>

          {/* Shopping Checklist Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-stone-900 text-sm">
              รายการของที่ต้องไปซื้อ (<span className="font-mono tabular-nums font-bold">{items.length}</span> รายการ)
            </h4>

            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200 uppercase text-xs">
                    <th className="py-2.5 px-4">รายการของที่ต้องซื้อ</th>
                    <th className="py-2.5 px-2 text-center w-24">จำนวน</th>
                    <th className="py-2.5 px-2 text-center w-20">หน่วย</th>
                    <th className="py-2.5 px-2 text-center w-28">ราคา/หน่วย</th>
                    <th className="py-2.5 px-3 text-right w-28 whitespace-nowrap">ยอดรวม</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-400 font-normal">
                        ยังไม่มีรายการซื้อ เลือกวัตถุดิบจากคลังด้านบน หรือพิมพ์เพิ่มเองด้านล่าง
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const ing = item.ingredient_id
                        ? availableIngredients.find((i) => i.id === item.ingredient_id)
                        : null;
                      const stockUnit = ing?.unit || item.unit;
                      const packInfo =
                        ing && ing.package_size && Number(ing.package_size) > 1
                          ? `(1 ชิ้น = ${Number(ing.package_size).toLocaleString()} ${ing.unit})`
                          : '';

                      return (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="py-2.5 px-4 font-semibold text-stone-900">
                            {item.name}
                            {packInfo && (
                              <span className="text-xs text-stone-500 ml-1.5 font-normal">
                                {packInfo}
                              </span>
                            )}
                            {item.current_stock !== undefined && (
                              <span className="block text-xs text-stone-400 font-normal font-mono tabular-nums">
                                (ในร้านเหลือ: {item.current_stock} {stockUnit})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQty(idx, parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-white font-mono tabular-nums text-stone-900"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center text-stone-700 font-medium">
                            {item.unit}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="relative inline-flex items-center">
                              <span className="absolute left-2 text-stone-400 text-xs">฿</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0"
                                value={item.cost_per_unit !== undefined ? item.cost_per_unit : ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                  handleUpdateUnitCost(idx, val);
                                }}
                                className="w-24 pl-5 pr-2 py-1 text-right font-medium text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-white font-mono tabular-nums text-stone-800"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                            {item.total_price !== undefined ? (
                              <span className="text-stone-900 font-bold text-xs">
                                ฿{item.total_price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-stone-400 text-xs">—</span>
                            )}
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
                      );
                    })
                  )}
                  {items.length > 0 && (
                    <tr className="bg-stone-50 border-t-2 border-stone-200 font-bold">
                      <td colSpan={4} className="py-2.5 px-4 text-right text-stone-700 text-xs font-semibold">
                        ยอดงบประมาณจัดซื้อโดยประมาณ:
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-stone-900 font-mono tabular-nums whitespace-nowrap text-sm">
                        ฿{estimatedTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Add Custom Item */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-semibold text-stone-800 text-xs">+ เพิ่มของใช้อื่นๆ (ไม่ได้อยู่ในคลัง เช่น แก้ว/หลอด/ทิชชู่):</span>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <input
                type="text"
                placeholder="ชื่อของ เช่น แก้ว 16oz, กระดาษทิชชู่..."
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
              <input
                type="number"
                placeholder="ราคา/หน่วย"
                min="0"
                step="any"
                value={customItemCost}
                onChange={(e) => setCustomItemCost(e.target.value)}
                className="px-2 py-1.5 rounded-xl bg-white border border-stone-200 text-right text-xs font-mono tabular-nums text-stone-900 focus:outline-none focus:border-stone-400"
              />
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
            <div className="text-xs">
              <span className="text-stone-500 font-medium">รวมทั้งหมด </span>
              <span className="font-bold text-stone-900 font-mono tabular-nums">{items.length}</span>
              <span className="text-stone-500 font-medium"> รายการ</span>
              {estimatedTotal > 0 && (
                <span className="ml-2 text-stone-600 font-medium">
                  • งบประมาณ:{' '}
                  <span className="font-bold text-stone-900 font-mono tabular-nums">
                    ฿{estimatedTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </span>
              )}
            </div>
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
