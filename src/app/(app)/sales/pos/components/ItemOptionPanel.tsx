'use client';

import React from 'react';
import { ArrowLeft, Plus, Minus, PlusCircle, Check, Layers, ChevronDown, Thermometer, Droplets, Zap, Coffee, Home, StickyNote } from 'lucide-react';
import { MenuItem } from '@/types';
import { Button } from '@/components/Button';
import { useStock } from '@/lib/StockContext';
import { CartItemOption } from '../hooks/useItemOptions';
import { useItemOptions } from '../hooks/useItemOptions';

interface ItemOptionPanelProps {
  item: MenuItem;
  initialOptions?: CartItemOption;
  onCancel: () => void;
  onConfirm: (options: CartItemOption) => void;
  /** When true, renders in compact touch-friendly mode (mobile/tablet bottom sheet) */
  compact?: boolean;
}

export const ItemOptionPanel: React.FC<ItemOptionPanelProps> = ({
  item,
  initialOptions,
  onCancel,
  onConfirm,
  compact = false,
}) => {
  const { ingredients, getMenuOptions } = useStock();
  const [showBOM, setShowBOM] = React.useState(false);

  const opts = useItemOptions({
    item,
    initialOptions,
    ingredients,
    getMenuOptions,
    isActive: true,
  });

  const {
    temperature, setTemperature,
    sweetness, setSweetness,
    diningOption, setDiningOption,
    extraShots, setExtraShots,
    customNote, setCustomNote,
    availableOptions,
    selectedModifiers,
    handleToggleTag,
    handleToggleModifier,
    quickTags,
    currentPrice,
    recipeSweeteners,
    allPreviewDeductions,
    takeawayCup,
    buildResult,
  } = opts;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(buildResult());
  };

  // Base chip class — larger touch targets when compact
  const chip = (selected: boolean, variant: 'default' | 'warm' = 'default') =>
    [
      'rounded-xl font-medium transition-all border text-center cursor-pointer select-none active:scale-95',
      compact ? 'py-3 text-sm' : 'py-2.5 text-xs',
      selected
        ? variant === 'warm'
          ? 'bg-stone-800 text-amber-50 border-stone-800 shadow-xs font-semibold'
          : 'bg-stone-900 text-white border-stone-900 shadow-xs font-semibold'
        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300',
    ].join(' ');

  const sectionLabel = (text: string) => (
    <span className={`font-semibold text-stone-800 block mb-2 ${compact ? 'text-sm' : 'text-xs'}`}>
      {text}
    </span>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4 text-xs">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h3 className={`font-bold text-stone-900 truncate leading-tight ${compact ? 'text-base' : 'text-sm'}`}>
              {item.name}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">ปรับแต่งตามความต้องการ</p>
          </div>
        </div>
        <span className={`font-bold text-stone-900 font-mono tabular-nums shrink-0 ${compact ? 'text-xl' : 'text-lg'}`}>
          ฿{currentPrice.toFixed(0)}
        </span>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-5">

        {/* Temperature */}
        <section>
          {sectionLabel('อุณหภูมิ')}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'เย็น', value: 'เย็น' },
              { label: 'ร้อน', value: 'ร้อน' },
              { label: 'ปั่น  +฿10', value: 'ปั่น (+10฿)' },
            ].map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTemperature(value)}
                className={`px-2 ${chip(temperature === value)}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Sweetness */}
        <section>
          <div className="flex items-center justify-between mb-2">
            {sectionLabel('ความหวาน')}
            {recipeSweeteners.length > 0 ? (
              <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
                {recipeSweeteners[0]}
              </span>
            ) : (
              <span className="text-[11px] text-stone-400 mb-2">ไม่มีสารให้ความหวาน</span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'ไม่หวาน', val: 'ไม่หวาน' },
              { label: 'น้อย', val: 'หวานน้อย' },
              { label: 'ปกติ', val: 'หวาน' },
              { label: 'มาก', val: 'หวานมาก' },
            ].map(({ label, val }) => {
              const isSelected = sweetness === val || (val === 'หวาน' && sweetness === 'หวาน 100%');
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSweetness(val === 'หวาน' ? 'หวาน 100%' : val)}
                  className={`px-1 ${chip(isSelected)}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Extra Shots */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            {sectionLabel('ช็อตเอสเพรสโซ่')}
            <span className="text-[11px] text-stone-400 font-normal mb-2">+฿15 / ช็อต</span>
          </div>
          <div className={`inline-flex items-center gap-4 bg-white border border-stone-200 shadow-xs rounded-xl ${compact ? 'p-2.5' : 'p-2'}`}>
            <button
              type="button"
              onClick={() => setExtraShots(Math.max(0, extraShots - 1))}
              disabled={extraShots === 0}
              className={`flex items-center justify-center rounded-lg bg-stone-100 border border-stone-200 text-stone-700 disabled:opacity-30 cursor-pointer hover:bg-stone-200 transition-colors ${compact ? 'w-9 h-9' : 'w-7 h-7'}`}
            >
              <Minus className={compact ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </button>
            <div className="text-center min-w-[4rem]">
              <span className={`font-bold text-stone-900 font-mono tabular-nums ${compact ? 'text-2xl' : 'text-xl'}`}>
                {extraShots}
              </span>
              <span className="text-stone-400 ml-1.5 text-xs">
                {extraShots === 0 ? 'ปกติ' : `+฿${extraShots * 15}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExtraShots(Math.min(3, extraShots + 1))}
              disabled={extraShots === 3}
              className={`flex items-center justify-center rounded-lg bg-stone-100 border border-stone-200 text-stone-700 disabled:opacity-30 cursor-pointer hover:bg-stone-200 transition-colors ${compact ? 'w-9 h-9' : 'w-7 h-7'}`}
            >
              <Plus className={compact ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </button>
          </div>
        </section>

        {/* Add-on Modifiers */}
        {availableOptions.length > 0 && (
          <section className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className={`font-semibold text-stone-800 flex items-center gap-1.5 ${compact ? 'text-sm' : 'text-xs'}`}>
                <PlusCircle className="w-3.5 h-3.5 text-stone-500" />
                รายการสั่งเพิ่ม
              </span>
              <span className="text-[11px] text-stone-400">ตัดสต็อกอัตโนมัติ</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {availableOptions.map((opt) => {
                const isSelected = selectedModifiers.some(
                  (m) => m.id === opt.id || m.name === opt.name
                );
                return (
                  <button
                    key={opt.id ?? opt.name}
                    type="button"
                    onClick={() => handleToggleModifier(opt)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between active:scale-[0.97] ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="font-semibold text-xs truncate flex items-center gap-1">
                        {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                        <span className="truncate">{opt.name}</span>
                      </div>
                      <div className={`text-[10px] ${isSelected ? 'text-stone-400' : 'text-stone-500'}`}>
                        {opt.quantity} {opt.ingredient_unit ?? 'หน่วย'}
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold shrink-0 ${isSelected ? 'text-amber-300' : 'text-stone-600'}`}>
                      {opt.price > 0 ? `+฿${opt.price}` : 'ฟรี'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Dine-in / Takeaway */}
        <section>
          {sectionLabel('รูปแบบการเสิร์ฟ')}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDiningOption('ทานที่ร้าน')}
              className={`px-3 ${chip(diningOption === 'ทานที่ร้าน')}`}
            >
              ทานที่ร้าน
            </button>
            <button
              type="button"
              onClick={() => setDiningOption('กลับบ้าน')}
              className={`px-3 ${chip(diningOption === 'กลับบ้าน', 'warm')}`}
            >
              กลับบ้าน
            </button>
          </div>
          {diningOption === 'กลับบ้าน' && (
            <p className="text-[11px] text-stone-500 mt-1.5">ตัดสต็อกแก้ว Takeaway อัตโนมัติ</p>
          )}
        </section>

        {/* Quick Tags */}
        <section>
          {sectionLabel('ตัวเลือกด่วน')}
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((tag) => {
              const active = customNote.split(',').map((t) => t.trim()).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer active:scale-[0.97] ${
                    active
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        {/* Custom Note */}
        <section>
          <input
            type="text"
            placeholder="หมายเหตุเพิ่มเติม..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className={`w-full bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-300 text-stone-900 placeholder:text-stone-400 transition-colors ${compact ? 'p-3 text-sm' : 'p-2.5 text-xs'}`}
          />
        </section>

        {/* BOM Preview — collapsible */}
        <section className="rounded-xl border border-stone-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowBOM((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
              <Layers className="w-3.5 h-3.5" />
              ตัดสต็อกจากสูตร ({allPreviewDeductions.length + (takeawayCup ? 1 : 0)} รายการ)
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-150 ${showBOM ? 'rotate-180' : ''}`} />
          </button>

          {showBOM && (
            <div className="bg-white divide-y divide-stone-100 max-h-48 overflow-y-auto">
              {allPreviewDeductions.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="min-w-0 pr-3">
                    <div className="font-medium text-stone-900 truncate flex items-center gap-1">
                      <span>{d.name}</span>
                      {d.badgeText && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          d.deductedQty === 0
                            ? 'bg-rose-50 text-rose-600'
                            : (d as any).isModifier
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : d.isSweetener && d.deductedQty < d.baseQty
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {d.badgeText}
                        </span>
                      )}
                    </div>
                    <div className="text-stone-400 font-mono tabular-nums text-[10px] mt-0.5">เดิม {d.currentQty} {d.unit}</div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className={`font-semibold ${d.deductedQty === 0 ? 'text-stone-300 line-through' : 'text-stone-900'}`}>
                      -{d.deductedQty} {d.unit}
                    </div>
                    <div className="text-[10px] text-stone-400">เหลือ {d.remainingQty} {d.unit}</div>
                  </div>
                </div>
              ))}

              {takeawayCup && (
                <div className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="min-w-0 pr-3">
                    <div className="font-medium text-stone-900 truncate">{takeawayCup.name}</div>
                    <div className="text-stone-400 font-mono tabular-nums text-[10px]">เดิม {takeawayCup.quantity} {takeawayCup.unit}</div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="font-semibold text-stone-900">-1 {takeawayCup.unit}</div>
                    <div className="text-[10px] text-stone-400">เหลือ {Math.max(0, takeawayCup.quantity - 1)} {takeawayCup.unit}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-stone-100 pt-3 flex items-center justify-between gap-2 shrink-0">
        <span className="text-xs text-stone-400">
          ราคา:{' '}
          <span className={`font-bold text-stone-900 font-mono tabular-nums ${compact ? 'text-base' : 'text-sm'}`}>
            ฿{currentPrice.toFixed(0)}
          </span>
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className={`rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 ${compact ? 'h-11 px-5 text-sm' : ''}`}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            variant="primary"
            className={`rounded-xl bg-stone-900 text-white hover:bg-stone-800 ${compact ? 'h-11 px-5 text-sm' : ''}`}
          >
            บันทึกลงบิล
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ItemOptionPanel;
