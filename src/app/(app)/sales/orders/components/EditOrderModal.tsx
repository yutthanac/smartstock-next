'use client';

import React, { useState, useEffect } from 'react';
import { Edit, X, Save, Banknote, QrCode, CreditCard } from 'lucide-react';
import { Order } from '@/types';

interface EditOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (paymentMethod: 'cash' | 'qr_promptpay' | 'credit_card', items: { id: number; note: string }[]) => Promise<void>;
}

export interface ParsedItemOption {
  temperature: string;
  sweetness: string;
  diningOption: string;
  extraShots: number;
  customNote: string;
}

export const parseOptionNote = (rawNote: string = ''): ParsedItemOption => {
  const note = rawNote || '';
  let temperature = 'เย็น';
  if (note.includes('ร้อน')) temperature = 'ร้อน';
  else if (note.includes('ปั่น')) temperature = 'ปั่น (+10฿)';

  let sweetness = 'หวาน (100%)';
  if (note.includes('ไม่หวาน') || note.includes('0%')) sweetness = 'ไม่หวาน';
  else if (note.includes('หวานน้อย') || note.includes('50%')) sweetness = 'หวานน้อย';
  else if (note.includes('หวานมาก') || note.includes('125%')) sweetness = 'หวานมาก';

  let diningOption = 'ไม่ตัดแก้ว';
  if (note.includes('ตัดแก้วพลาสติก') || note.includes('ตัดแก้ว') || note.includes('กลับบ้าน') || note.includes('Takeaway') || note.includes('Take away')) {
    diningOption = 'ตัดแก้วพลาสติก';
  }

  let extraShots = 0;
  const shotMatch = note.match(/(?:เพิ่ม\s*|\+)(\d+)\s*ช็อต/);
  if (shotMatch && shotMatch[1]) {
    extraShots = parseInt(shotMatch[1], 10) || 0;
  }

  const cleanTokens = note
    .split(/[,/]/)
    .map((t) => t.trim())
    .filter((t) => {
      if (!t) return false;
      if (['เย็น', 'ร้อน', 'ปั่น (+10฿)', 'ปั่น'].includes(t)) return false;
      if (['ไม่หวาน', 'หวานน้อย', 'หวาน', 'หวานมาก', 'หวาน (100%)', 'หวาน 100%'].includes(t)) return false;
      if (['ทานที่ร้าน', 'กลับบ้าน', '🥤 กลับบ้าน', 'ตัดแก้วพลาสติก', 'ไม่ตัดแก้ว', 'ไม่ตัดแก้ว (แก้วร้าน)'].includes(t)) return false;
      if (t.includes('ช็อต')) return false;
      return true;
    });

  return {
    temperature,
    sweetness,
    diningOption,
    extraShots,
    customNote: cleanTokens.join(', '),
  };
};

export const serializeOptionNote = (opts: ParsedItemOption): string => {
  const parts: string[] = [];
  if (opts.temperature) parts.push(opts.temperature);
  if (opts.sweetness && opts.sweetness !== 'หวาน (100%)') parts.push(opts.sweetness);
  if (opts.extraShots > 0) parts.push(`เพิ่ม ${opts.extraShots} ช็อต`);
  if (opts.diningOption === 'ตัดแก้วพลาสติก' || opts.diningOption === 'กลับบ้าน') parts.push('ตัดแก้วพลาสติก');
  if (opts.customNote.trim()) parts.push(opts.customNote.trim());
  return parts.join(', ');
};

export function EditOrderModal({
  order,
  isOpen,
  isSubmitting,
  onClose,
  onSave,
}: EditOrderModalProps) {
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'qr_promptpay' | 'credit_card'>('cash');
  const [editItemNotes, setEditItemNotes] = useState<Record<string | number, string>>({});
  const [activeEditItemIndex, setActiveEditItemIndex] = useState<number>(0);
  const [itemParsedOptions, setItemParsedOptions] = useState<Record<string | number, ParsedItemOption>>({});

  useEffect(() => {
    if (order && isOpen) {
      setEditPaymentMethod(order.payment_method || 'cash');
      setActiveEditItemIndex(0);

      const initialNotes: Record<string | number, string> = {};
      const initialParsed: Record<string | number, ParsedItemOption> = {};

      order.items?.forEach((item, idx) => {
        const key = item.id ?? idx;
        const noteStr = item.note || '';
        initialNotes[key] = noteStr;
        initialParsed[key] = parseOptionNote(noteStr);
      });

      setEditItemNotes(initialNotes);
      setItemParsedOptions(initialParsed);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleUpdateItemOption = (
    key: string | number,
    updater: (prev: ParsedItemOption) => ParsedItemOption
  ) => {
    setItemParsedOptions((prevMap) => {
      const current = prevMap[key] || parseOptionNote('');
      const updated = updater(current);
      const newSerialized = serializeOptionNote(updated);

      setEditItemNotes((prevNotes) => ({
        ...prevNotes,
        [key]: newSerialized,
      }));

      return {
        ...prevMap,
        [key]: updated,
      };
    });
  };

  const handleToggleEditTag = (key: string | number, tag: string) => {
    handleUpdateItemOption(key, (curr) => {
      const currentTags = curr.customNote
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      let newTags: string[];
      if (currentTags.includes(tag)) {
        newTags = currentTags.filter((t) => t !== tag);
      } else {
        newTags = [...currentTags, tag];
      }

      return {
        ...curr,
        customNote: newTags.join(', '),
      };
    });
  };

  const handleSave = async () => {
    const itemsPayload = Object.entries(editItemNotes).map(([id, note]) => ({
      id: Number(id),
      note,
    }));
    await onSave(editPaymentMethod, itemsPayload);
  };

  const currentItem = order.items?.[activeEditItemIndex];
  const currentKey = currentItem ? (currentItem.id ?? activeEditItemIndex) : null;
  const currentOpts = currentKey !== null
    ? itemParsedOptions[currentKey] || parseOptionNote(editItemNotes[currentKey] || '')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-100 bg-[#faf9f5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Edit className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <span>แก้ไขคำสั่งซื้อ #{order.order_number}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] font-mono">
                  ฿{(Number(order.total) || 0).toFixed(2)}
                </span>
              </h4>
              <p className="text-xs text-stone-500">
                ปรับวิธีชำระเงิน หรือปรับระดับความหวาน/อุณหภูมิ/ท็อปปิ้งของแต่ละรายการ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              วิธีชำระเงิน
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cash', label: 'เงินสด', icon: Banknote },
                { key: 'qr_promptpay', label: 'QR PromptPay', icon: QrCode },
                { key: 'credit_card', label: 'บัตรเครดิต', icon: CreditCard },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEditPaymentMethod(key as any)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    editPaymentMethod === key
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Items Customizer Selector (POS Style) */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span>รายการสินค้า</span>
                <span className="text-xs font-normal text-stone-400 font-mono tabular-nums">
                  ({order.items?.length || 0})
                </span>
              </h3>
            </div>

            {/* Items Pill Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
              {order.items?.map((item, idx) => {
                const itemKey = item.id ?? idx;
                const isActive = activeEditItemIndex === idx;
                return (
                  <button
                    key={itemKey}
                    type="button"
                    onClick={() => setActiveEditItemIndex(idx)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="font-medium">{idx + 1}.</span>
                    <span className="truncate max-w-[130px]">{item.name}</span>
                    <span className="text-[10px] font-mono opacity-80">x{item.quantity}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Item Options Panel */}
            {currentItem && currentKey !== null && currentOpts && (
              <div className="p-3.5 rounded-2xl border border-stone-200/90 bg-[#faf9f5] space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <div>
                    <span className="font-bold text-stone-900 text-xs sm:text-sm">
                      {currentItem.name}
                    </span>
                    <span className="ml-2 text-xs text-stone-500 font-mono">
                      x{currentItem.quantity} = ฿{(currentItem.price * currentItem.quantity).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-600">
                    {serializeOptionNote(currentOpts) || 'ค่าเริ่มต้น'}
                  </span>
                </div>

                {/* Temperature */}
                <div>
                  <label className="font-semibold text-stone-700 text-xs block mb-1.5">อุณหภูมิ</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'เย็น', value: 'เย็น' },
                      { label: 'ร้อน', value: 'ร้อน' },
                      { label: 'ปั่น (+10฿)', value: 'ปั่น (+10฿)' },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          handleUpdateItemOption(currentKey, (prev) => ({
                            ...prev,
                            temperature: value,
                          }))
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
                          currentOpts.temperature === value
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sweetness */}
                <div>
                  <label className="font-semibold text-stone-700 text-xs block mb-1.5">ระดับความหวาน</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['ไม่หวาน', 'หวานน้อย', 'หวาน', 'หวานมาก'].map((sw) => {
                      const isMatch =
                        currentOpts.sweetness === sw ||
                        (sw === 'หวาน' && currentOpts.sweetness === 'หวาน (100%)');
                      return (
                        <button
                          key={sw}
                          type="button"
                          onClick={() =>
                            handleUpdateItemOption(currentKey, (prev) => ({
                              ...prev,
                              sweetness: sw === 'หวาน' ? 'หวาน (100%)' : sw,
                            }))
                          }
                          className={`py-1.5 px-1 rounded-xl font-medium text-xs transition-all border text-center cursor-pointer ${
                            isMatch
                              ? 'bg-stone-900 text-white border-stone-900 shadow-xs font-bold'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {sw}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Extra Shots & Serving Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-stone-700 text-xs block mb-1">
                      ช็อตเอสเพรสโซ่
                    </label>
                    <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-stone-200 shadow-xs w-full justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateItemOption(currentKey, (prev) => ({
                            ...prev,
                            extraShots: Math.max(0, prev.extraShots - 1),
                          }))
                        }
                        disabled={currentOpts.extraShots === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 border border-stone-200 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-stone-200"
                      >
                        -
                      </button>
                      <span className="font-bold text-stone-900 text-sm font-mono tabular-nums">
                        {currentOpts.extraShots === 0 ? 'ปกติ' : `+${currentOpts.extraShots} ช็อต`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateItemOption(currentKey, (prev) => ({
                            ...prev,
                            extraShots: Math.min(3, prev.extraShots + 1),
                          }))
                        }
                        disabled={currentOpts.extraShots === 3}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 border border-stone-200 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-stone-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 text-xs block mb-1">
                      การใช้แก้ว / รูปแบบการเสิร์ฟ
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'ตัดแก้วพลาสติก', value: 'ตัดแก้วพลาสติก' },
                        { label: 'ไม่ตัดแก้ว (แก้วร้าน)', value: 'ไม่ตัดแก้ว' },
                      ].map(({ label, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            handleUpdateItemOption(currentKey, (prev) => ({
                              ...prev,
                              diningOption: value,
                            }))
                          }
                          className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
                            (currentOpts.diningOption === value || (value === 'ตัดแก้วพลาสติก' && currentOpts.diningOption === 'กลับบ้าน') || (value === 'ไม่ตัดแก้ว' && currentOpts.diningOption === 'ทานที่ร้าน'))
                              ? value === 'ตัดแก้วพลาสติก'
                                ? 'bg-[#f5efe6] text-[#78350f] border-[#e8ded0] shadow-2xs font-bold'
                                : 'bg-stone-900 text-white border-stone-900 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Tags */}
                <div>
                  <label className="font-semibold text-stone-700 text-xs block mb-1">
                    ตัวเลือกเพิ่มเติม
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['แยกน้ำแข็ง'].map((tag) => {
                      const isSelected = currentOpts.customNote.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleEditTag(currentKey, tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#f5efe6] text-[#78350f] border-[#e8ded0] font-bold shadow-2xs'
                              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Note input for this item */}
                <div>
                  <label className="font-semibold text-stone-700 text-xs block mb-1">
                    ข้อความหมายเหตุสรุปของรายการนี้
                  </label>
                  <input
                    type="text"
                    value={editItemNotes[currentKey] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditItemNotes((prev) => ({ ...prev, [currentKey]: val }));
                      setItemParsedOptions((prev) => ({ ...prev, [currentKey]: parseOptionNote(val) }));
                    }}
                    placeholder="เช่น เย็น, หวานน้อย, กลับบ้าน..."
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-100 bg-[#faf9f5] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขคำสั่งซื้อ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
