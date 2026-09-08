'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Ingredient } from '@/types';
import { PurchaseOrder } from '../purchase-orders/types';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

interface InboundItemState {
  id: string;
  selected: boolean;
  name: string;
  mode: 'existing' | 'new';
  ingredient_id?: number;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_price: number;
  // New item customizable fields
  new_category: string;
  new_reorder_point: number;
  new_max_stock: number;
}

const CATEGORY_OPTIONS = [
  { value: 'coffee_tea', label: 'กาแฟและชา' },
  { value: 'dairy', label: 'นมและผลิตภัณฑ์นม' },
  { value: 'syrup_sweetener', label: 'ไซรัปและความหวาน' },
  { value: 'powder_bakery', label: 'ผงชงและเบเกอรี่' },
  { value: 'packaging', label: 'บรรจุภัณฑ์ (แก้ว/ฝา/หลอด)' },
  { value: 'fresh', label: 'ของสดและผลไม้' },
  { value: 'dry_goods', label: 'ของแห้งและเครื่องปรุง' },
  { value: 'other', label: 'เบ็ดเตล็ด / ของใช้' },
];

export const ReceiptInboundTab: React.FC = () => {
  const { ingredients, units, adjustStock, updateIngredient, addIngredient, fetchData } = useStock();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPOId, setSelectedPOId] = useState<string>('');
  const [inboundItems, setInboundItems] = useState<InboundItemState[]>([]);
  const [isShowingPhoto, setIsShowingPhoto] = useState<boolean>(true);
  const [photoRotation, setPhotoRotation] = useState<number>(0);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [billVat, setBillVat] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hydrate orders from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('smartstock_shopping_orders');
    if (saved) {
      try {
        const parsed: PurchaseOrder[] = JSON.parse(saved);
        setOrders(parsed);
        // Prioritize selecting a PO with receipt_uploaded or the latest one
        const uploaded = parsed.find((p) => p.status === 'receipt_uploaded');
        if (uploaded) {
          setSelectedPOId(uploaded.id);
        } else if (parsed.length > 0) {
          setSelectedPOId(parsed[0].id);
        }
      } catch {
        // fallback
      }
    }
  }, []);

  const selectedPO = orders.find((p) => p.id === selectedPOId) || orders[0] || null;

  // Initialize inbound items whenever selected PO changes
  useEffect(() => {
    if (!selectedPO) {
      setInboundItems([]);
      setBillDiscount(0);
      setBillVat(0);
      return;
    }

    setBillDiscount(selectedPO.discount || 0);
    setBillVat(selectedPO.vat || 0);

    const items = selectedPO.items || [];
    const mapped: InboundItemState[] = items.map((item, idx) => {
      // Find matching ingredient in stock
      const matched = ingredients.find(
        (ing) =>
          ing.id === item.ingredient_id ||
          ing.name.toLowerCase().trim() === item.name.toLowerCase().trim() ||
          ing.name.toLowerCase().includes(item.name.toLowerCase().trim()) ||
          item.name.toLowerCase().includes(ing.name.toLowerCase().trim())
      );

      const qty = item.actual_quantity || item.quantity || 1;
      const cost = item.actual_cost_per_unit || item.cost_per_unit || matched?.cost_per_unit || 0;
      const total = item.actual_total_price || item.total_price || qty * cost;

      return {
        id: `inbound-${idx}-${Date.now()}`,
        selected: true,
        name: item.name,
        mode: matched ? 'existing' : 'new',
        ingredient_id: matched ? matched.id : undefined,
        quantity: qty,
        unit: matched ? matched.unit : item.unit || units[0]?.name || 'ชิ้น',
        cost_per_unit: cost,
        total_price: total,
        new_category: matched?.category || 'coffee_tea',
        new_reorder_point: 5,
        new_max_stock: Math.max(50, qty * 3),
      };
    });

    setInboundItems(mapped);
    setSuccessMessage(null);
  }, [selectedPO, ingredients, units]);

  // Update item field
  const handleUpdateItem = (index: number, field: keyof InboundItemState, val: any) => {
    setInboundItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: val };
      if (field === 'quantity' || field === 'cost_per_unit') {
        const q = parseFloat(String(current.quantity)) || 0;
        const c = parseFloat(String(current.cost_per_unit)) || 0;
        current.total_price = Math.round(q * c * 100) / 100;
      }
      next[index] = current;
      return next;
    });
  };

  // Change mapping to an existing ingredient
  const handleSelectExistingIngredient = (index: number, ingIdStr: string) => {
    const ingId = Number(ingIdStr);
    const ing = ingredients.find((i) => i.id === ingId);
    if (!ing) return;

    setInboundItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        mode: 'existing',
        ingredient_id: ing.id,
        unit: ing.unit,
        cost_per_unit: next[index].cost_per_unit > 0 ? next[index].cost_per_unit : ing.cost_per_unit,
        total_price:
          next[index].cost_per_unit > 0
            ? Math.round(next[index].quantity * next[index].cost_per_unit * 100) / 100
            : Math.round(next[index].quantity * ing.cost_per_unit * 100) / 100,
      };
      return next;
    });
  };

  // Toggle select all
  const allSelected = inboundItems.length > 0 && inboundItems.every((it) => it.selected);
  const handleToggleSelectAll = () => {
    setInboundItems((prev) => prev.map((it) => ({ ...it, selected: !allSelected })));
  };

  // Add a manual item into this bill
  const handleAddManualItem = () => {
    const newItem: InboundItemState = {
      id: `manual-${Date.now()}`,
      selected: true,
      name: 'รายการใหม่',
      mode: 'new',
      quantity: 1,
      unit: units[0]?.name || 'ชิ้น',
      cost_per_unit: 0,
      total_price: 0,
      new_category: 'coffee_tea',
      new_reorder_point: 5,
      new_max_stock: 50,
    };
    setInboundItems((prev) => [...prev, newItem]);
  };

  // Remove item row
  const handleRemoveItem = (index: number) => {
    setInboundItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Batch Inbound Execution
  const selectedItems = inboundItems.filter((it) => it.selected);
  const existingItemsCount = selectedItems.filter((it) => it.mode === 'existing' && it.ingredient_id).length;
  const newItemsCount = selectedItems.filter((it) => it.mode === 'new').length;
  const subtotalSelectedMoney = selectedItems.reduce((sum, it) => sum + (it.total_price || 0), 0);
  const finalNetTotal = Math.max(0, subtotalSelectedMoney - (Number(billDiscount) || 0) + (Number(billVat) || 0));

  // Factor to distribute discount and VAT proportionately to each unit cost
  const costAdjustmentFactor =
    subtotalSelectedMoney > 0 ? finalNetTotal / subtotalSelectedMoney : 1;

  const handleConfirmBatchInbound = async () => {
    if (!selectedPO) return;
    if (selectedItems.length === 0) {
      alert('กรุณาเลือกรายการสินค้าอย่างน้อย 1 รายการเพื่อโหลดเข้าสต็อก');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      let existingLoaded = 0;
      let newLoaded = 0;

      for (const item of selectedItems) {
        // Effective unit cost adjusted for discount and VAT
        const rawUnitCost = item.cost_per_unit || 0;
        const normalizedUnitCost =
          Math.round(rawUnitCost * costAdjustmentFactor * 100) / 100;

        if (item.mode === 'existing' && item.ingredient_id) {
          // 1. Existing ingredient: Adjust stock IN + update unit cost
          const note = `รับเข้าจากบิล #${selectedPO.id} (${selectedPO.store_name || 'ตลาด/ร้านค้า'})`;
          await adjustStock(item.ingredient_id, 'in', item.quantity, note);
          if (normalizedUnitCost > 0) {
            await updateIngredient(item.ingredient_id, { cost_per_unit: normalizedUnitCost });
          }
          existingLoaded++;
        } else if (item.mode === 'new') {
          // 2. New ingredient: Create new ingredient in database
          await addIngredient({
            name: item.name.trim(),
            category: item.new_category || 'other',
            unit: item.unit.trim() || 'ชิ้น',
            quantity: item.quantity,
            cost_per_unit: normalizedUnitCost,
            reorder_point: item.new_reorder_point || 5,
            max_stock: item.new_max_stock || 50,
            tracking_type: 'strict',
            supplier: selectedPO.store_name,
          });
          newLoaded++;
        }
      }

      // Update PO status to completed in localStorage
      const updatedOrders = orders.map((po) =>
        po.id === selectedPO.id
          ? {
              ...po,
              status: 'completed' as const,
              subtotal: subtotalSelectedMoney,
              discount: Number(billDiscount) || 0,
              vat: Number(billVat) || 0,
              totalAmount: finalNetTotal > 0 ? finalNetTotal : po.totalAmount,
              verified_at: new Date().toISOString(),
            }
          : po
      );
      setOrders(updatedOrders);
      localStorage.setItem('smartstock_shopping_orders', JSON.stringify(updatedOrders));

      // Refresh master inventory from backend
      await fetchData();

      setSuccessMessage(
        `บันทึกรับเข้าสต็อกเรียบร้อยแล้วทั้งหมด ${selectedItems.length} รายการ (สต็อกเดิม ${existingLoaded} รายการ, รายการใหม่ ${newLoaded} รายการ)`
      );
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลเข้าสต็อก');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Notification / Success Alert */}
      {successMessage && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-slate-800">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-normal">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Bill Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-900 text-sm">เลือกใบเสร็จ / รายการสั่งซื้อ</h3>
            {selectedPO && (
              <Badge
                variant={selectedPO.status === 'completed' ? 'neutral' : 'outline'}
                size="sm"
              >
                {selectedPO.status === 'completed'
                  ? 'รับเข้าสต็อกแล้ว'
                  : selectedPO.status === 'receipt_uploaded'
                  ? 'มีใบเสร็จ - รอตรวจ'
                  : 'รอนำไปซื้อ'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            ตรวจสอบรายการสินค้าที่ซื้อจริงและปรับปรุงข้อมูลก่อนนำเข้าสต็อก
          </p>
        </div>

        {/* PO Selector Dropdown */}
        <div className="flex items-center gap-2">
          {orders.length === 0 ? (
            <span className="text-xs text-slate-400">ยังไม่มีประวัติการซื้อของ</span>
          ) : (
            <div className="w-72">
              <Dropdown
                options={orders.map((po) => ({
                  value: po.id,
                  label: `${po.id} - ${po.store_name || 'ตลาด'} (${po.date})`,
                }))}
                value={selectedPOId}
                onChange={(val) => setSelectedPOId(String(val))}
                size="sm"
                className="w-full"
                buttonClassName="bg-white border-slate-200 text-xs font-normal text-slate-800 py-1.5 px-3 rounded-xl"
              />
            </div>
          )}

          {selectedPO?.receipt_image && (
            <Button
              variant="outline"
              size="sm"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => setIsShowingPhoto((prev) => !prev)}
            >
              {isShowingPhoto ? 'ซ่อนรูปบิล' : 'ดูรูปบิล'}
            </Button>
          )}
        </div>
      </div>

      {!selectedPO ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 space-y-2">
          <p className="text-sm font-medium text-slate-700">ยังไม่มีรายการบิลการซื้อของในระบบ</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            สามารถสร้างรายการซื้อของและแนบใบเสร็จได้ที่เมนู &ldquo;รายการซื้อของ &amp; ใบเสร็จ&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Receipt Photo Viewer (if toggled open) */}
          {isShowingPhoto && selectedPO.receipt_image && (
            <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200 space-y-3 sticky top-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-700">
                <span className="font-medium text-slate-800">รูปภาพใบเสร็จ</span>
                <button
                  type="button"
                  onClick={() => setPhotoRotation((prev) => (prev + 90) % 360)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                  title="หมุนภาพ"
                >
                  <RotateCw className="w-3 h-3" /> หมุนภาพ
                </button>
              </div>

              <div className="flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100 min-h-[280px] max-h-[460px] p-2">
                <img
                  src={selectedPO.receipt_image}
                  alt="Receipt"
                  style={{ transform: `rotate(${photoRotation}deg)` }}
                  className="max-h-[440px] w-auto max-w-full object-contain rounded-lg transition-transform duration-200"
                />
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>ร้านค้า:</span>
                  <span className="text-slate-800 font-medium">{selectedPO.store_name || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex justify-between">
                  <span>วันที่:</span>
                  <span className="text-slate-800 font-mono">{selectedPO.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>ยอดรวมในบิล:</span>
                  <span className="text-slate-800 font-mono font-medium">
                    ฿{selectedPO.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Right: Items Matching & Inbound Table */}
          <div
            className={`${
              isShowingPhoto && selectedPO.receipt_image ? 'lg:col-span-8' : 'lg:col-span-12'
            } bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4`}
          >
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-medium text-slate-900 text-sm">
                  รายการสินค้าจากใบเสร็จ ({inboundItems.length} รายการ)
                </h4>
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  ตรวจสอบรายการสินค้า แมปกับวัตถุดิบเดิมหรือสร้างเป็นวัตถุดิบใหม่เข้าคลัง
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5 text-slate-500" />}
                onClick={handleAddManualItem}
              >
                เพิ่มรายการ
              </Button>
            </div>

            {/* Inbound Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-medium">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 text-slate-800 focus:ring-slate-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 min-w-40 font-medium">รายการจากบิล</th>
                      <th className="py-2.5 px-3 min-w-64 font-medium">การจัดการสต็อก</th>
                      <th className="py-2.5 px-2 text-center w-24 font-medium">จำนวน</th>
                      <th className="py-2.5 px-2 text-center w-16 font-medium">หน่วย</th>
                      <th className="py-2.5 px-2 text-right w-24 font-medium">ราคา/หน่วย</th>
                      <th className="py-2.5 px-3 text-right w-24 font-medium">ยอดรวม</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inboundItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-normal">
                          ไม่มีรายการสินค้าในบิลนี้ สามารถกดปุ่ม &ldquo;เพิ่มรายการ&rdquo; เพื่อเพิ่มเองได้
                        </td>
                      </tr>
                    ) : (
                      inboundItems.map((item, idx) => {
                        const matchedIngredient = ingredients.find((i) => i.id === item.ingredient_id);

                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors border-b border-slate-100 ${
                              item.selected ? 'hover:bg-slate-50/70' : 'opacity-40 bg-slate-50/40'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3 text-center align-top">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={(e) => handleUpdateItem(idx, 'selected', e.target.checked)}
                                className="rounded border-slate-300 text-slate-800 focus:ring-slate-500 cursor-pointer mt-1"
                              />
                            </td>

                            {/* Item name from bill */}
                            <td className="py-3 px-3 align-top">
                              <div className="font-medium text-slate-900 text-xs">{item.name}</div>
                              <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                                {item.mode === 'existing' ? 'แมปสต็อกเดิม' : 'สร้างรายการใหม่'}
                              </div>
                            </td>

                            {/* Mapping & Customization Column */}
                            <td className="py-3 px-3 align-top">
                              {/* Segmented Mode Switcher */}
                              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 mb-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(idx, 'mode', 'existing')}
                                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                                    item.mode === 'existing'
                                      ? 'bg-white text-slate-800 font-medium shadow-2xs'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  แมปสต็อกเดิม
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(idx, 'mode', 'new')}
                                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                                    item.mode === 'new'
                                      ? 'bg-white text-slate-800 font-medium shadow-2xs'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  สร้างรายการใหม่
                                </button>
                              </div>

                              {item.mode === 'existing' ? (
                                <div className="space-y-1">
                                  <Dropdown
                                    options={ingredients.map((ing) => ({
                                      value: ing.id,
                                      label: `${ing.name} (${ing.unit})`,
                                      badge: `เหลือ ${ing.quantity}`,
                                    }))}
                                    value={item.ingredient_id ?? ''}
                                    onChange={(val) => handleSelectExistingIngredient(idx, String(val))}
                                    size="sm"
                                    className="w-full"
                                    buttonClassName="bg-white border-slate-200 text-xs text-slate-800 py-1.5 px-2.5 rounded-lg"
                                  />
                                  {matchedIngredient && (
                                    <div className="text-[11px] text-slate-500">
                                      คงเหลือในคลัง: <span className="font-mono text-slate-700">{matchedIngredient.quantity} {matchedIngredient.unit}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* New item customization form inline */
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-0.5">ชื่อในคลัง:</label>
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-0.5">หมวดหมู่:</label>
                                      <Dropdown
                                        options={CATEGORY_OPTIONS}
                                        value={item.new_category}
                                        onChange={(val) => handleUpdateItem(idx, 'new_category', String(val))}
                                        size="sm"
                                        className="w-full"
                                        buttonClassName="bg-white border-slate-200 text-xs py-1 px-2 rounded-lg text-slate-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-0.5">จุดเตือนซื้อ (Reorder):</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.new_reorder_point}
                                        onChange={(e) =>
                                          handleUpdateItem(idx, 'new_reorder_point', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 text-right focus:outline-none focus:border-slate-400"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-0.5">สต็อกสูงสุด (Max):</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.new_max_stock}
                                        onChange={(e) =>
                                          handleUpdateItem(idx, 'new_max_stock', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 text-right focus:outline-none focus:border-slate-400"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Qty */}
                            <td className="py-3 px-2 text-center align-top">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-20 px-2 py-1.5 text-center font-normal text-slate-800 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                              />
                            </td>

                            {/* Unit */}
                            <td className="py-3 px-2 text-center align-top text-xs text-slate-700">
                              {item.mode === 'new' ? (
                                <Dropdown
                                  options={units.map((u) => ({ value: u.name, label: u.name }))}
                                  value={item.unit}
                                  onChange={(val) => handleUpdateItem(idx, 'unit', String(val))}
                                  size="sm"
                                  className="w-16"
                                  buttonClassName="bg-white border-slate-200 text-xs py-1 px-1 rounded-lg text-slate-800"
                                />
                              ) : (
                                <span className="inline-block pt-1.5">{item.unit}</span>
                              )}
                            </td>

                            {/* Cost per unit */}
                            <td className="py-3 px-2 text-right align-top">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.cost_per_unit}
                                onChange={(e) =>
                                  handleUpdateItem(idx, 'cost_per_unit', parseFloat(e.target.value) || 0)
                                }
                                className="w-20 px-2 py-1.5 text-right font-normal text-slate-800 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                              />
                            </td>

                            {/* Total price */}
                            <td className="py-3 px-3 text-right align-top font-mono text-xs text-slate-800">
                              <span className="inline-block pt-1.5">
                                ฿{item.total_price.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </td>

                            {/* Delete row */}
                            <td className="py-3 px-2 text-center align-top">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer mt-0.5"
                                title="ลบรายการนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Inbound Action Bar with Discount & VAT */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-col gap-4">
              {/* Discount & VAT Calculator Row */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">คำนวณส่วนลด &amp; ภาษีท้ายบิล:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ระบบจะเกลี่ยส่วนลดและภาษีเข้าต้นทุนต่อหน่วยของแต่ละรายการอย่างแม่นยำอัตโนมัติ
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">ส่วนลดท้ายบิล:</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">฿</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={billDiscount || ''}
                        placeholder="0"
                        onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                        className="w-24 pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 text-right focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">ภาษีมูลค่าเพิ่ม (VAT):</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">฿</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={billVat || ''}
                        placeholder="0"
                        onChange={(e) => setBillVat(parseFloat(e.target.value) || 0)}
                        className="w-24 pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 text-right focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    เลือกรับเข้า: <strong className="text-slate-800 font-semibold">{selectedItems.length}</strong> จาก{' '}
                    {inboundItems.length} รายการ
                    {existingItemsCount > 0 && (
                      <span className="text-slate-500 ml-1.5">
                        (สต็อกเดิม {existingItemsCount})
                      </span>
                    )}
                    {newItemsCount > 0 && (
                      <span className="text-slate-500 ml-1.5">
                        (สร้างใหม่ {newItemsCount})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      ยอดก่อนลด: ฿{subtotalSelectedMoney.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span>•</span>
                    <span className="text-sm font-medium text-slate-800">
                      ยอดจ่ายจริงสุทธิ:{' '}
                      <span className="font-mono font-semibold text-slate-900 text-base">
                        ฿{finalNetTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmBatchInbound}
                  disabled={isSubmitting || selectedItems.length === 0}
                  isLoading={isSubmitting}
                >
                  บันทึกรับเข้าสต็อก ({selectedItems.length} รายการ)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
