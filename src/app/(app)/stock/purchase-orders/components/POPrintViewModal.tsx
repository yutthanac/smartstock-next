'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  ShoppingBag,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '../types';
import { Button } from '@/components/Button';
import { useStock } from '@/lib/StockContext';
import { Ingredient } from '@/types';

interface POPrintViewModalProps {
  po: PurchaseOrder | null;
  ingredients?: Ingredient[];
  onClose: () => void;
  onMarkCompleted?: (id: string) => void;
  onUpdatePO?: (updatedPO: PurchaseOrder) => void;
}

export const POPrintViewModal: React.FC<POPrintViewModalProps> = ({
  po,
  ingredients: propIngredients,
  onClose,
  onMarkCompleted,
  onUpdatePO,
}) => {
  const [mounted, setMounted] = useState(false);
  const { ingredients: ctxIngredients } = useStock();
  const ingredients = propIngredients && propIngredients.length > 0 ? propIngredients : ctxIngredients;

  // Local state for items to support immediate interactive ticking
  const [items, setItems] = useState<PurchaseOrderItem[]>(po?.items || []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync items when po prop changes or load saved checked states from localStorage
  useEffect(() => {
    if (!po) return;

    try {
      const savedOrders = localStorage.getItem('smartstock_shopping_orders');
      if (savedOrders) {
        const parsed: PurchaseOrder[] = JSON.parse(savedOrders);
        const currentInStorage = parsed.find((p) => p.id === po.id);
        if (currentInStorage && currentInStorage.items && currentInStorage.items.length === po.items.length) {
          // Merge checked states from storage
          const merged = po.items.map((it, idx) => ({
            ...it,
            checked: currentInStorage.items[idx]?.checked ?? it.checked ?? false,
          }));
          setItems(merged);
          return;
        }
      }
    } catch {
      // fallback
    }

    setItems(po.items || []);
  }, [po]);

  if (!po || !mounted) return null;

  const isContinuousUnit = (unitStr?: string) => {
    if (!unitStr) return false;
    const clean = unitStr.trim().toLowerCase();
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
      'liter',
    ].includes(clean);
  };

  const getDisplayItem = (item: PurchaseOrderItem) => {
    const ing = ingredients.find(
      (i) =>
        (item.ingredient_id && i.id === item.ingredient_id) ||
        i.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );

    const isRaw = isContinuousUnit(item.unit) || (ing && isContinuousUnit(ing.unit));
    const packSize = Number(ing?.package_size || 0);

    let displayUnit = item.unit;
    let displayQty = item.quantity;
    let packageInfo = '';

    if (isRaw) {
      displayUnit = 'ชิ้น';
      if (packSize > 1 && item.quantity >= packSize) {
        displayQty = Math.ceil(item.quantity / packSize);
        packageInfo = `(1 ชิ้น = ${packSize.toLocaleString()} ${item.unit || ing?.unit || 'กรัม'})`;
      } else if (packSize > 1) {
        packageInfo = `(1 ชิ้น = ${packSize.toLocaleString()} ${item.unit || ing?.unit || 'กรัม'})`;
      }
    }

    const unitCost =
      item.cost_per_unit != null
        ? item.cost_per_unit
        : ing && ing.cost_per_unit
        ? ing.cost_per_unit * (packSize > 1 ? packSize : 1)
        : undefined;

    const totalPrice =
      item.total_price != null
        ? item.total_price
        : unitCost !== undefined
        ? displayQty * unitCost
        : undefined;

    return {
      ...item,
      displayQty,
      displayUnit,
      packageInfo,
      stockUnit: ing?.unit || item.unit,
      unitCost,
      totalPrice,
    };
  };

  // Toggle single item checked
  const toggleItemChecked = (index: number) => {
    const updatedItems = items.map((it, idx) =>
      idx === index ? { ...it, checked: !it.checked } : it
    );
    setItems(updatedItems);

    const updatedPO: PurchaseOrder = { ...po, items: updatedItems };

    // Persist to localStorage
    try {
      const saved = localStorage.getItem('smartstock_shopping_orders');
      if (saved) {
        const parsed: PurchaseOrder[] = JSON.parse(saved);
        const updated = parsed.map((p) => (p.id === po.id ? updatedPO : p));
        localStorage.setItem('smartstock_shopping_orders', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to update shopping orders in localStorage', e);
    }

    if (onUpdatePO) {
      onUpdatePO(updatedPO);
    }
  };

  // Toggle all items checked / unchecked
  const handleToggleAll = (targetChecked: boolean) => {
    const updatedItems = items.map((it) => ({ ...it, checked: targetChecked }));
    setItems(updatedItems);

    const updatedPO: PurchaseOrder = { ...po, items: updatedItems };

    try {
      const saved = localStorage.getItem('smartstock_shopping_orders');
      if (saved) {
        const parsed: PurchaseOrder[] = JSON.parse(saved);
        const updated = parsed.map((p) => (p.id === po.id ? updatedPO : p));
        localStorage.setItem('smartstock_shopping_orders', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to update shopping orders in localStorage', e);
    }

    if (onUpdatePO) {
      onUpdatePO(updatedPO);
    }
  };

  const checkedCount = items.filter((it) => it.checked).length;
  const totalCount = items.length;
  const allChecked = totalCount > 0 && checkedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const poTotalAmount =
    po.totalAmount && po.totalAmount > 0
      ? po.totalAmount
      : items.reduce((sum, rawItem) => {
          const item = getDisplayItem(rawItem);
          return sum + (item.totalPrice || 0);
        }, 0);

  const handlePrint = () => {
    const prevTitle = document.title;
    const cleanStoreName = po.store_name ? po.store_name.replace(/[/\\?%*:|"<>]/g, '_') : 'SmartStock';
    document.title = `ใบจ่ายตลาด_${cleanStoreName}_${po.date}_${po.id}`;

    window.print();

    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'สถานะซื้อ',
      'รายการวัตถุดิบ/สินค้า',
      'จำนวนที่ต้องซื้อ',
      'หน่วย',
      'ราคาประมาณ/หน่วย (บาท)',
      'ยอดเงินรวม (บาท)',
    ];

    const rows = items.map((rawItem, idx) => {
      const item = getDisplayItem(rawItem);
      return [
        idx + 1,
        rawItem.checked ? '"ซื้อแล้ว"' : '"ยังไม่ซื้อ"',
        `"${(rawItem.name || '').replace(/"/g, '""')}"`,
        item.displayQty,
        `"${item.displayUnit}"`,
        item.unitCost != null ? item.unitCost.toFixed(2) : '-',
        item.totalPrice != null ? item.totalPrice.toFixed(2) : '-',
      ];
    });

    const summaryRows = [
      [],
      ['', '', '', '', '', 'ยอดงบประมาณจัดซื้อรวม', poTotalAmount > 0 ? poTotalAmount.toFixed(2) : '-'],
      [],
      ['เลขที่ใบรายการ:', po.id],
      ['ไปซื้อที่ร้าน/ตลาด:', `"${po.store_name || 'ไม่ระบุ'}"`],
      ['วันที่ไปจ่ายตลาด:', po.date],
      ['ผู้ไปจ่ายตลาด:', `"${po.buyer_name || 'พนักงานร้าน'}"`],
      ['ความคืบหน้า:', `ซื้อแล้ว ${checkedCount}/${totalCount} รายการ`],
      ['หมายเหตุ:', `"${(po.note || '').replace(/"/g, '""')}"`],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(',')), ...summaryRows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ShoppingList_${po.store_name || 'Market'}_${po.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Blank filler rows so small lists fill the A4 page naturally on desktop print (16 rows fits single A4 page cleanly)
  const minRows = 16;
  const blankRowsCount = Math.max(0, minRows - items.length);
  const blankRows = Array.from({ length: blankRowsCount }, (_, i) => items.length + i + 1);

  return createPortal(
    <div className="print-portal-root print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="print-modal-card bg-white w-full sm:max-w-4xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh] sm:rounded-2xl shadow-2xl border-0 sm:border border-stone-200 overflow-hidden flex flex-col print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Screen only) */}
        <div className="flex flex-col gap-2 p-3 sm:px-6 sm:py-3.5 bg-stone-50 border-b border-stone-200 print:hidden shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-stone-700" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-stone-900 text-sm sm:text-base truncate">
                  {po.store_name ? `จ่ายตลาด: ${po.store_name}` : 'ใบรายการไปซื้อของ'}
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 truncate">
                  เลขที่: <span className="font-mono tabular-nums font-semibold">{po.id}</span> • วันที่: <span className="font-mono tabular-nums">{po.date}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {po.status === 'pending' && onMarkCompleted && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onMarkCompleted(po.id)}
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  className="rounded-xl border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs py-1.5 px-2.5 sm:px-3 font-semibold"
                >
                  <span className="hidden sm:inline">ซื้อครบแล้ว</span>
                  <span className="sm:hidden">ซื้อครบ</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                icon={<Download className="w-3.5 h-3.5 text-stone-600" />}
                className="hidden sm:inline-flex rounded-xl border-stone-200 text-stone-700 hover:bg-stone-100 text-xs py-1.5"
              >
                CSV
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                icon={<Printer className="w-3.5 h-3.5" />}
                className="rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs py-1.5 px-2.5 sm:px-3 font-medium"
                title="พิมพ์เอกสาร หรือเลือก 'บันทึกเป็น PDF'"
              >
                <span className="hidden sm:inline">พิมพ์ / PDF</span>
                <span className="sm:hidden">พิมพ์</span>
              </Button>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Mobile & Tablet Progress Tracker */}
          <div className="pt-2 border-t border-stone-200/70 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-stone-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  ซื้อแล้ว <strong className="text-stone-900 font-mono font-bold">{checkedCount}</strong> / {totalCount} รายการ
                </span>
                <span className="text-stone-400">•</span>
                <span className="font-mono text-emerald-700 font-bold">{progressPercent}%</span>
              </div>

              <div className="flex items-center gap-2">
                {allChecked ? (
                  <button
                    type="button"
                    onClick={() => handleToggleAll(false)}
                    className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 font-medium cursor-pointer py-0.5 px-1.5 rounded hover:bg-stone-200/50 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>เริ่มติ๊กใหม่</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleAll(true)}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer py-0.5 px-1.5 rounded hover:bg-emerald-50 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>ติ๊กซื้อครบทั้งหมด</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Document & Checklist Body */}
        <div 
          className="print-sheet flex-1 p-3.5 sm:p-8 overflow-y-auto print:overflow-visible print:p-0 bg-white text-stone-800 text-sm leading-normal space-y-3.5 sm:space-y-4"
          style={{ fontFamily: "var(--font-sarabun), 'TH Sarabun New', 'TH Sarabun PSK', Sarabun, sans-serif" }}
        >
          
          {/* Header Title */}
          <div className="flex justify-between items-start border-b-2 border-stone-900 pb-3 gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs uppercase font-bold text-stone-500 tracking-wider">SmartStock System</p>
              <h1 className="text-base sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
                ใบรายการไปซื้อของ / จ่ายตลาด
              </h1>
              <p className="text-stone-500 text-[11px] sm:text-xs mt-0.5">Shopping Checklist สำหรับพกพาเดินซื้อหรือมอบหมายพนักงาน</p>
            </div>

            <div className="text-right space-y-0.5 sm:space-y-1 shrink-0">
              <p className="font-mono tabular-nums font-bold text-xs sm:text-base text-stone-900">
                เลขที่: <span className="font-extrabold">{po.id}</span>
              </p>
              <p className="text-stone-600 text-[11px] sm:text-sm">
                วันที่ซื้อ: <span className="font-bold text-stone-800 font-mono tabular-nums">{po.date}</span>
              </p>
              <p className="text-[11px] sm:text-xs text-stone-600 font-medium">
                สถานะ: {po.status === 'completed' ? '✓ ซื้อครบแล้ว' : '⏳ รอออกไปซื้อ'}
              </p>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm print:bg-white print:grid-cols-3">
            <div>
              <span className="text-stone-500 block text-[11px] sm:text-xs">ร้านค้า / ตลาดเป้าหมาย:</span>
              <span className="font-bold text-stone-900 text-sm sm:text-base block mt-0.5">
                {po.store_name || 'ไม่ระบุแหล่งซื้อ'}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px] sm:text-xs">ผู้ไปจ่ายตลาด:</span>
              <span className="font-semibold text-stone-800 text-sm sm:text-base block mt-0.5">
                {po.buyer_name || 'พนักงานร้าน'}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-stone-500 block text-[11px] sm:text-xs">งบประมาณโดยประมาณ:</span>
              <span className="font-black text-[#78350f] text-sm sm:text-base block mt-0.5 font-mono tabular-nums print:text-black">
                {poTotalAmount > 0
                  ? `฿${poTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'ยังไม่ระบุราคา'}
              </span>
            </div>
          </div>

          {/* Note Callout if present */}
          {po.note && (
            <div className="p-2.5 sm:p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <span className="font-bold shrink-0">📝 หมายเหตุ:</span>
              <span className="break-words leading-relaxed">{po.note}</span>
            </div>
          )}

          {/* =========================================================
              1. MOBILE CHECKLIST CARD VIEW (block sm:hidden print:hidden)
              Optimized for walking with phone, one-handed tapping
             ========================================================= */}
          <div className="block sm:hidden print:hidden space-y-2.5">
            <div className="flex items-center justify-between text-xs text-stone-500 px-0.5">
              <span>แตะที่การ์ดเพื่อติ๊กของที่หยิบลงตะกร้า</span>
              <span className="font-mono text-[11px] font-semibold text-stone-600">
                {checkedCount}/{totalCount} รายการ
              </span>
            </div>

            <div className="space-y-2">
              {items.map((rawItem, index) => {
                const item = getDisplayItem(rawItem);
                const isChecked = !!rawItem.checked;

                return (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleItemChecked(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleItemChecked(index);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] flex items-start gap-3 text-left ${
                      isChecked
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                        : 'bg-white border-stone-200/90 hover:border-stone-300 shadow-xs'
                    }`}
                  >
                    {/* Big Touch Checkbox */}
                    <div className="pt-0.5 shrink-0">
                      <div
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs scale-100'
                            : 'border-stone-300 bg-stone-50 text-transparent hover:border-stone-400'
                        }`}
                      >
                        <Check className={`w-4 h-4 stroke-[3] transition-transform ${isChecked ? 'scale-100' : 'scale-0'}`} />
                      </div>
                    </div>

                    {/* Details Column */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-mono text-stone-400 font-medium">#{index + 1}</span>
                            <h4
                              className={`text-sm font-bold leading-snug break-words transition-colors ${
                                isChecked
                                  ? 'line-through text-stone-400 font-medium'
                                  : 'text-stone-900'
                              }`}
                            >
                              {rawItem.name}
                            </h4>
                          </div>

                          {/* Package Conversion Info */}
                          {item.packageInfo && (
                            <p className={`text-xs mt-0.5 leading-tight ${isChecked ? 'text-stone-400' : 'text-stone-600 font-medium'}`}>
                              📦 บรรจุ: <span className="font-semibold">{item.packageInfo}</span>
                            </p>
                          )}

                          {/* Remaining Shop Stock Context */}
                          {rawItem.current_stock !== undefined && (
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              สต็อกที่ร้านเหลือ: <span className="font-mono font-medium">{rawItem.current_stock} {item.stockUnit}</span>
                            </p>
                          )}
                        </div>

                        {/* Prominent Quantity Badge */}
                        <div className="shrink-0 text-right">
                          <div
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold font-mono tabular-nums shadow-xs ${
                              isChecked
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            <span className="text-[10px] font-normal opacity-90">ต้องซื้อ</span>
                            <span className="text-sm font-black">{item.displayQty}</span>
                            <span>{item.displayUnit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Status & Price Line */}
                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className={`font-semibold flex items-center gap-1 ${isChecked ? 'text-emerald-700' : 'text-stone-400'}`}>
                          {isChecked ? '✓ หยิบแล้ว' : '⚪ รอหยิบ'}
                        </span>

                        <div className="text-right font-mono tabular-nums text-xs">
                          {item.unitCost != null && item.unitCost > 0 ? (
                            <span className="text-stone-500">
                              @{item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              {item.totalPrice != null && item.totalPrice > 0 && (
                                <span className="font-bold text-stone-800 ml-1.5">
                                  (฿{item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Summary & Quick Action Card */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2 mt-3">
              <div className="flex items-center justify-between text-stone-600">
                <span>จำนวนรายการทั้งหมด</span>
                <span className="font-bold font-mono text-stone-900">{totalCount} รายการ</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>หยิบใส่ตะกร้าแล้ว</span>
                <span className="font-bold font-mono text-emerald-700">
                  {checkedCount} รายการ {totalCount > 0 && `(เหลือ ${totalCount - checkedCount})`}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <span className="font-bold text-stone-800 text-sm">งบประมาณรวมโดยประมาณ</span>
                <span className="font-black font-mono tabular-nums text-base text-[#78350f]">
                  ฿{poTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {allChecked && po.status === 'pending' && onMarkCompleted && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onMarkCompleted(po.id)}
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 shadow-md flex items-center justify-center gap-1.5"
                  >
                    ซื้อของครบแล้ว — บันทึกสถานะ
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              2. DESKTOP & PRINT TABLE VIEW (hidden sm:block print:block)
              Formal A4/A5 Printable Shopping Order Sheet
             ========================================================= */}
          <div className="hidden sm:block print:block border border-stone-200 rounded-xl overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[550px] print:min-w-0 text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-stone-800 font-semibold text-xs uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">ติ๊ก</th>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-4">รายการวัตถุดิบ / สินค้า</th>
                  <th className="py-2.5 px-3 text-center w-28">จำนวน</th>
                  <th className="py-2.5 px-3 text-center w-20">หน่วย</th>
                  <th className="py-2.5 px-3 text-right w-28">ราคา/หน่วย</th>
                  <th className="py-2.5 px-4 text-right w-28">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {items.map((rawItem, index) => {
                  const item = getDisplayItem(rawItem);
                  const isChecked = !!rawItem.checked;

                  return (
                    <tr
                      key={index}
                      onClick={() => toggleItemChecked(index)}
                      className="hover:bg-stone-50 cursor-pointer select-none print:hover:bg-transparent transition-colors"
                    >
                      {/* Interactive on Desktop, Printable on Paper */}
                      <td className="py-2 px-3 text-center">
                        <div
                          className={`w-5 h-5 mx-auto rounded border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white print:bg-transparent print:text-black print:border-black'
                              : 'border-stone-400 hover:border-stone-600 print:border-black'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] print:hidden" />}
                          {isChecked && <span className="hidden print:inline font-bold text-sm">✓</span>}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center text-stone-400 font-medium font-mono tabular-nums">{index + 1}</td>
                      <td className="py-2 px-4">
                        <span className={`font-semibold transition-colors ${isChecked ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                          {rawItem.name}
                        </span>
                        {item.packageInfo && (
                          <span className={`text-xs ml-2 font-mono tabular-nums print:text-stone-600 ${isChecked ? 'text-stone-400' : 'text-stone-500'}`}>
                            {item.packageInfo}
                          </span>
                        )}
                        {rawItem.current_stock !== undefined && (
                          <span className="text-xs text-stone-400 ml-2 print:hidden font-mono tabular-nums">
                            (คงเหลือที่ร้าน: {rawItem.current_stock} {item.stockUnit})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-stone-900 font-mono tabular-nums whitespace-nowrap">
                        {item.displayQty}
                      </td>
                      <td className="py-2.5 px-3 text-center text-stone-700 font-medium whitespace-nowrap">
                        {item.displayUnit}
                      </td>
                      <td className="py-2.5 px-3 text-right text-stone-600 font-mono tabular-nums whitespace-nowrap">
                        {item.unitCost != null && item.unitCost > 0
                          ? `฿${item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-stone-900 font-mono tabular-nums whitespace-nowrap">
                        {item.totalPrice != null && item.totalPrice > 0
                          ? `฿${item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Summary Row */}
                {poTotalAmount > 0 && (
                  <tr className="bg-stone-50 font-bold border-t-2 border-stone-300 print:bg-stone-100">
                    <td colSpan={5} className="py-2.5 px-4 text-right text-stone-700 font-semibold">
                      ยอดงบประมาณจัดซื้อรวม:
                    </td>
                    <td colSpan={2} className="py-2.5 px-4 text-right text-[#78350f] print:text-black font-mono tabular-nums text-sm font-black">
                      ฿{poTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {/* Blank filler rows to fill A4 sheet proportionally on print */}
                {blankRows.map((rowNum) => (
                  <tr key={`blank-${rowNum}`} className="h-8">
                    <td className="py-2 px-3 text-center">
                      <div className="w-5 h-5 mx-auto border border-dashed border-stone-300 rounded print:border-stone-400"></div>
                    </td>
                    <td className="py-2 px-3 text-center text-stone-300 font-medium font-mono tabular-nums">{rowNum}</td>
                    <td className="py-2 px-4"></td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-4"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

