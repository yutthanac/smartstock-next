'use client';

import React from 'react';
import { Plus, Calculator, Trash2 } from 'lucide-react';
import { VerifiedReceiptItem } from '../types';
import { Ingredient } from '@/types';
import { Dropdown } from '@/components/Dropdown';

export const COMMON_UNITS = [
  { value: 'มล.', label: 'มล. (มิลลิลิตร)' },
  { value: 'กรัม', label: 'กรัม (g)' },
  { value: 'กก.', label: 'กก. (กิโลกรัม)' },
  { value: 'ลิตร', label: 'ลิตร (L)' },
  { value: 'ชิ้น', label: 'ชิ้น' },
  { value: 'ขวด', label: 'ขวด' },
  { value: 'กระป๋อง', label: 'กระป๋อง' },
  { value: 'กล่อง', label: 'กล่อง' },
  { value: 'ลัง', label: 'ลัง' },
  { value: 'ถุง', label: 'ถุง' },
  { value: 'แพ็ค', label: 'แพ็ค' },
  { value: 'ซอง', label: 'ซอง' },
  { value: 'ใบ', label: 'ใบ' },
];

interface ReceiptItemsTableProps {
  verifiedItems: VerifiedReceiptItem[];
  ingredients: Ingredient[];
  isScanning: boolean;
  currentImageIndex: number;
  totalImagesCount: number;
  expandedUnitConversionIdx: number | null;
  onSetExpandedUnitConversionIdx: (idx: number | null) => void;
  onAddNewItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof VerifiedReceiptItem, val: any) => void;
  onSelectIngredient: (index: number, ingIdStr: string) => void;
}

export const ReceiptItemsTable: React.FC<ReceiptItemsTableProps> = ({
  verifiedItems,
  ingredients,
  isScanning,
  currentImageIndex,
  totalImagesCount,
  expandedUnitConversionIdx,
  onSetExpandedUnitConversionIdx,
  onAddNewItem,
  onRemoveItem,
  onUpdateItem,
  onSelectIngredient,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-stone-900 text-xs">
            รายการสินค้าที่ตรวจพบ ({verifiedItems.length} รายการ)
          </h4>
          {totalImagesCount > 1 && (
            <span className="text-[11px] text-stone-500 font-mono">
              (ใบเสร็จปัจจุบัน: #{currentImageIndex + 1})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAddNewItem}
          className="text-xs text-stone-800 hover:text-stone-950 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> เพิ่มรายการสินค้า
        </button>
      </div>

      {/* Table Container */}
      <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-stone-100 text-stone-800 font-semibold border-b border-stone-200 uppercase text-[11px]">
              <th className="py-2.5 px-3">จับคู่วัตถุดิบในคลัง</th>
              <th className="py-2.5 px-2 text-center w-20">จำนวนซื้อ</th>
              <th className="py-2.5 px-2 text-center w-24">หน่วยซื้อ</th>
              <th className="py-2.5 px-2 text-center w-36">แปลงเข้าสต็อก</th>
              <th className="py-2.5 px-2 text-right w-24">ราคา/หน่วย</th>
              <th className="py-2.5 px-3 text-right w-24">รวม (฿)</th>
              <th className="py-2.5 px-1 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {verifiedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-stone-400 font-medium">
                  {isScanning
                    ? 'กำลังตรวจสอบข้อมูลจากใบเสร็จ...'
                    : 'ยังไม่มีรายการสินค้า กดปุ่ม "+ เพิ่มรายการสินค้า" เพื่อเริ่มต้น'}
                </td>
              </tr>
            ) : (
              verifiedItems.map((item, idx) => {
                const isUnitMismatch =
                  item.ingredient_id &&
                  item.unit &&
                  item.purchase_unit &&
                  item.unit !== item.purchase_unit;

                return (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-stone-50 transition-colors">
                      {/* Stock Ingredient Dropdown */}
                      <td className="py-2 px-3">
                        <Dropdown
                          options={[
                            { value: '', label: `-- ไม่จับคู่ (${item.name}) --` },
                            ...ingredients.map((ing) => ({
                              value: ing.id,
                              label: `${ing.name} (${ing.unit})`,
                              badge: `${ing.quantity} ${ing.unit}`,
                            })),
                          ]}
                          value={item.ingredient_id ?? ''}
                          onChange={(val) => onSelectIngredient(idx, String(val))}
                          size="sm"
                          className="w-full"
                          buttonClassName="bg-white border-stone-200 text-xs font-semibold text-stone-900 py-1.5 px-2 rounded-lg"
                        />
                      </td>

                      {/* Purchase Qty */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.purchase_quantity}
                          onChange={(e) =>
                            onUpdateItem(
                              idx,
                              'purchase_quantity',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full p-1.5 text-center font-bold text-stone-900 bg-white border border-stone-200 rounded-lg text-xs font-mono tabular-nums focus:outline-none focus:border-stone-400"
                        />
                      </td>

                      {/* Purchase Unit Dropdown */}
                      <td className="py-2 px-2 text-center">
                        <Dropdown
                          options={COMMON_UNITS}
                          value={item.purchase_unit}
                          onChange={(val) => onUpdateItem(idx, 'purchase_unit', String(val))}
                          size="sm"
                          className="w-full"
                          buttonClassName="bg-white border-stone-200 text-xs font-medium text-stone-800 py-1 px-1.5 rounded-lg text-center"
                        />
                      </td>

                      {/* Stock Conversion Multiplier & Target Unit */}
                      <td className="py-2 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onSetExpandedUnitConversionIdx(
                                expandedUnitConversionIdx === idx ? null : idx
                              )
                            }
                            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                              isUnitMismatch || item.pack_size !== 1
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                            title="คลิกเพื่อตั้งค่าอัตราส่วนแปลงหน่วย เช่น 1 ขวด = 1000 มล."
                          >
                            <Calculator className="w-3 h-3 text-stone-500" />
                            <span className="font-mono tabular-nums font-bold">
                              ={item.quantity}
                            </span>
                            <span className="text-[11px] font-medium">{item.unit}</span>
                          </button>
                        </div>
                      </td>

                      {/* Cost per unit (bought) */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.cost_per_unit}
                          onChange={(e) =>
                            onUpdateItem(
                              idx,
                              'cost_per_unit',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full p-1.5 text-right font-medium text-stone-900 bg-white border border-stone-200 rounded-lg text-xs font-mono tabular-nums focus:outline-none focus:border-stone-400"
                        />
                      </td>

                      {/* Total Price */}
                      <td className="py-2 px-3 text-right font-bold text-stone-900 font-mono tabular-nums">
                        ฿{item.total_price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Delete Item */}
                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* Inline Unit Conversion Adjustment Drawer */}
                    {expandedUnitConversionIdx === idx && (
                      <tr className="bg-stone-50/80 border-y border-stone-200">
                        <td colSpan={7} className="p-3">
                          <div className="max-w-2xl bg-white p-3 rounded-xl border border-stone-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                                <Calculator className="w-3.5 h-3.5 text-stone-700" />
                                <span>ตั้งค่าการแปลงหน่วยสำหรับ: {item.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onSetExpandedUnitConversionIdx(null)}
                                className="text-stone-400 hover:text-stone-700 font-bold px-1"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-700">
                              <span>ซื้อมา 1 {item.purchase_unit} บรรจุขนาด</span>
                              <input
                                type="number"
                                min="0.001"
                                step="any"
                                value={item.pack_size}
                                onChange={(e) =>
                                  onUpdateItem(
                                    idx,
                                    'pack_size',
                                    parseFloat(e.target.value) || 1
                                  )
                                }
                                className="w-24 p-1.5 text-center font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono tabular-nums focus:bg-white focus:outline-none"
                              />
                              <div className="w-32">
                                <Dropdown
                                  options={COMMON_UNITS}
                                  value={item.unit}
                                  onChange={(val) => onUpdateItem(idx, 'unit', String(val))}
                                  size="sm"
                                  className="w-full"
                                  buttonClassName="bg-stone-50 border-stone-300 text-xs py-1 px-2 rounded-lg"
                                />
                              </div>

                              <div className="text-stone-500 font-mono text-[11px] pl-2 border-l border-stone-200">
                                → รวมเข้าสต็อกจริง:{' '}
                                <strong className="text-stone-900 font-bold font-mono">
                                  {item.quantity} {item.unit}
                                </strong>{' '}
                                (เฉลี่ย ฿
                                {(item.inventory_cost_per_unit ?? 0).toFixed(4)}/{item.unit})
                              </div>
                            </div>

                            {/* Preset Shortcuts */}
                            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-stone-500">
                              <span>ขนาดพบบ่อย:</span>
                              {[
                                { label: '1 ลัง = 24 กระป๋อง', pack: 24, unit: 'กระป๋อง' },
                                { label: '1 ขวด = 1000 มล.', pack: 1000, unit: 'มล.' },
                                { label: '1 แกลลอน = 2000 มล.', pack: 2000, unit: 'มล.' },
                                { label: '1 กก. = 1000 กรัม', pack: 1000, unit: 'กรัม' },
                                { label: '1 ลัง = 12 กล่อง', pack: 12, unit: 'กล่อง' },
                              ].map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => {
                                    onUpdateItem(idx, 'pack_size', preset.pack);
                                    onUpdateItem(idx, 'unit', preset.unit);
                                  }}
                                  className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors cursor-pointer"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
