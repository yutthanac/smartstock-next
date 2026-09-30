'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';
import {
  getStoredBreakEvenConfig,
  saveStoredBreakEvenConfig,
  calculateBreakEven,
  DEFAULT_BEP_CONFIG,
  BreakEvenConfig,
  CustomExpense,
} from '@/lib/breakEven';

interface CostInputRowProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  step?: string;
  unit?: string;
}

function CostInputRow({
  label,
  value,
  onChange,
  step = '1',
  unit = '฿',
}: CostInputRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 bg-stone-50/80 rounded-xl border border-stone-200">
      <span className="text-sm font-semibold text-stone-900">{label}</span>
      <div className="flex items-center gap-2 w-36 shrink-0">
        <span className="text-sm font-mono text-stone-400">{unit}</span>
        <input
          type="number"
          step={step}
          min={0}
          value={value || ''}
          onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300 text-sm font-mono text-right font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-500"
        />
      </div>
    </div>
  );
}

export function BreakEvenCalculator() {
  const { menuItems, dashboard } = useStock();
  const { activeStore } = useAuth();
  const storeId = activeStore?.id || 'default';

  // Single unified config state
  const [config, setConfig] = useState<BreakEvenConfig>(() => getStoredBreakEvenConfig(storeId));

  // Sync state when switching stores
  useEffect(() => {
    setConfig(getStoredBreakEvenConfig(storeId));
  }, [storeId]);

  // Update helper
  const updateConfig = useCallback(
    <K extends keyof BreakEvenConfig>(key: K, value: BreakEvenConfig[K]) => {
      setConfig((prev) => {
        const next = { ...prev, [key]: value };
        saveStoredBreakEvenConfig(next, storeId);
        return next;
      });
    },
    [storeId]
  );

  // Modal / Inputs for adding custom expense
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState<string>('');
  const [showAddFixed, setShowAddFixed] = useState(false);

  const [newVarName, setNewVarName] = useState('');
  const [newVarAmount, setNewVarAmount] = useState<string>('');
  const [showAddVar, setShowAddVar] = useState(false);

  // Reset defaults
  const handleResetDefaults = () => {
    if (confirm('ต้องการรีเซ็ตค่าเริ่มต้นทั้งหมดกลับสู่ค่ามาตรฐานหรือไม่?')) {
      setConfig(DEFAULT_BEP_CONFIG);
      saveStoredBreakEvenConfig(DEFAULT_BEP_CONFIG, storeId);
    }
  };

  // Auto-fill selling price from store menu items average
  const autoMenuPrice = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return 60;
    const valid = menuItems.filter((m) => Number(m.price) > 0);
    if (valid.length === 0) return 60;
    const sum = valid.reduce((acc, m) => acc + Number(m.price), 0);
    return Math.round(sum / valid.length);
  }, [menuItems]);

  // Core metrics calculated via single source of truth
  const metrics = useMemo(() => calculateBreakEven(config), [config]);

  // Actual cups sold today (sum of quantities from dashboard)
  const actualCupsToday = useMemo(() => {
    if (typeof dashboard?.today_cups_sold === 'number') {
      return dashboard.today_cups_sold;
    }
    if (dashboard?.menu_profitability && dashboard.menu_profitability.length > 0) {
      return dashboard.menu_profitability.reduce(
        (sum, item) => sum + (Number(item.sales_count) || 0),
        0
      );
    }
    return dashboard?.total_orders_today ?? 0;
  }, [dashboard]);

  const isBreakEvenReachedToday =
    metrics.breakEvenCupsDaily > 0 && actualCupsToday >= metrics.breakEvenCupsDaily;
  const todayProgressPercent =
    metrics.breakEvenCupsDaily > 0
      ? Math.min(100, Math.round((actualCupsToday / metrics.breakEvenCupsDaily) * 100))
      : 0;

  // Add custom fixed expense
  const handleAddFixedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFixedName.trim() || !newFixedAmount) return;
    const amountNum = parseFloat(newFixedAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    const updated = [
      ...(config.customFixedList || []),
      { id: Date.now().toString(), name: newFixedName.trim(), amount: amountNum },
    ];
    updateConfig('customFixedList', updated);
    setNewFixedName('');
    setNewFixedAmount('');
    setShowAddFixed(false);
  };

  // Add custom variable expense
  const handleAddVarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarName.trim() || !newVarAmount) return;
    const amountNum = parseFloat(newVarAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    const updated = [
      ...(config.customVariableList || []),
      { id: Date.now().toString(), name: newVarName.trim(), amount: amountNum },
    ];
    updateConfig('customVariableList', updated);
    setNewVarName('');
    setNewVarAmount('');
    setShowAddVar(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            คำนวณจุดคุ้มทุน (Break-Even Point)
          </h2>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          รีเซ็ตค่าเริ่มต้น
        </button>
      </div>

      {/* Hero Result Cards (The Break-Even Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ต้องขายกี่แก้วต่อวัน */}
        <div className="bg-stone-900 text-white rounded-2xl p-5 border border-stone-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-300">จุดคุ้มทุนต่อวัน</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-stone-800 text-amber-300 border border-stone-700">
                เป้าหมายขั้นต่ำ
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white mt-3">
              {metrics.breakEvenCupsDaily.toLocaleString()}{' '}
              <span className="text-base font-normal text-stone-400">แก้ว/วัน</span>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-stone-800 text-xs text-stone-300 font-mono flex items-center justify-between">
            <span>ยอดขายขั้นต่ำ</span>
            <span className="font-bold text-white">
              ฿{metrics.breakEvenRevenueDaily.toLocaleString()} / วัน
            </span>
          </div>
        </div>

        {/* Card 2: ต้องขายกี่แก้วต่อเดือน */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-600">จุดคุ้มทุนต่อเดือน</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
                {config.operatingDays} วันทำการ
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-stone-900 mt-3">
              {metrics.breakEvenCupsMonthly.toLocaleString()}{' '}
              <span className="text-base font-normal text-stone-500">แก้ว/เดือน</span>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-stone-100 text-xs text-stone-600 font-mono flex items-center justify-between">
            <span>ยอดขายเดือนละ</span>
            <span className="font-bold text-stone-900">
              ฿{metrics.breakEvenRevenueMonthly.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3: กำไรส่วนเกินต่อแก้ว */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-600">กำไรส่วนเกินต่อแก้ว</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
                {metrics.contributionMarginRatio.toFixed(1)}%
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-[#78350f] mt-3">
              ฿{metrics.contributionMarginPerCup.toFixed(2)}{' '}
              <span className="text-base font-normal text-stone-500">/ แก้ว</span>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-stone-100 text-xs text-stone-600 font-mono flex items-center justify-between">
            <span>ขาย ฿{config.sellingPrice}</span>
            <span>ต้นทุนแก้วละ ฿{metrics.totalVariablePerCup.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 4: รวมต้นทุนคงที่ต่อเดือน */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-600">ต้นทุนคงที่รวม</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
                รายเดือน
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-stone-900 mt-3">
              ฿{metrics.totalFixedMonthly.toLocaleString()}{' '}
              <span className="text-base font-normal text-stone-500">/ เดือน</span>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-stone-100 text-xs text-stone-600 font-mono flex items-center justify-between">
            <span>เฉลี่ยวันละ</span>
            <span className="font-bold text-stone-900">
              ฿{Math.round(metrics.totalFixedDaily).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Real Store Performance vs Break-Even Tracker */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-stone-900 text-base">
              สถานะจริงหน้าร้านวันนี้ vs จุดคุ้มทุน
            </h3>
          </div>

          <div>
            {isBreakEvenReachedToday ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                คุ้มทุนแล้ว! เริ่มเข้าสู่โซนกำไรสุทธิ
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                ต้องการอีก {Math.max(0, metrics.breakEvenCupsDaily - actualCupsToday)} แก้ว เพื่อคืนทุนวันนี้
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isBreakEvenReachedToday ? 'bg-emerald-600' : 'bg-stone-900'
              }`}
              style={{ width: `${todayProgressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-mono text-stone-600">
            <span>0 แก้ว</span>
            <span className="font-bold text-stone-900 text-sm">
              ความคืบหน้า {todayProgressPercent}% ({actualCupsToday} จาก {metrics.breakEvenCupsDaily} แก้ว)
            </span>
            <span>จุดคุ้มทุน: {metrics.breakEvenCupsDaily} แก้ว</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Grids: Fixed vs Variable Input Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =======================================================
            SECTION A: ต้นทุนคงที่ (Fixed Costs)
           ======================================================= */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-base">
                1. ต้นทุนคงที่ (Fixed Costs)
              </h3>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
                รวม ฿{metrics.totalFixedMonthly.toLocaleString()} / เดือน
              </span>
            </div>

            {/* Inputs List */}
            <div className="space-y-2.5">
              <CostInputRow
                label="ค่าเช่าสถานที่ / หน้าร้าน"
                value={config.rent}
                onChange={(val) => updateConfig('rent', val)}
              />
              <CostInputRow
                label="ค่าแรง / เงินเดือนพนักงาน"
                value={config.salaries}
                onChange={(val) => updateConfig('salaries', val)}
              />
              <CostInputRow
                label="ค่าน้ำ ค่าไฟ อินเทอร์เน็ต"
                value={config.utilities}
                onChange={(val) => updateConfig('utilities', val)}
              />
              <CostInputRow
                label="ค่าโปรแกรม POS / ซอฟต์แวร์รายเดือน"
                value={config.software}
                onChange={(val) => updateConfig('software', val)}
              />
              <CostInputRow
                label="ค่าซ่อมบำรุง / บำรุงรักษาเครื่องชง / อื่นๆ"
                value={config.maintenance}
                onChange={(val) => updateConfig('maintenance', val)}
              />

              {/* Custom Fixed List */}
              {(config.customFixedList || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3.5 bg-stone-50/80 rounded-xl border border-stone-200"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig(
                          'customFixedList',
                          (config.customFixedList || []).filter((x) => x.id !== item.id)
                        )
                      }
                      className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-stone-900">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 w-36 shrink-0">
                    <span className="text-sm font-mono text-stone-400">฿</span>
                    <input
                      type="number"
                      min={0}
                      value={item.amount}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        updateConfig(
                          'customFixedList',
                          (config.customFixedList || []).map((x) =>
                            x.id === item.id ? { ...x, amount: val } : x
                          )
                        );
                      }}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300 text-sm font-mono text-right font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-500"
                    />
                  </div>
                </div>
              ))}

              {/* Add Custom Fixed Form */}
              {showAddFixed ? (
                <form
                  onSubmit={handleAddFixedSubmit}
                  className="p-3.5 bg-stone-100 rounded-xl border border-stone-300 space-y-3"
                >
                  <div className="text-sm font-bold text-stone-900">เพิ่มค่าใช้จ่ายคงที่ใหม่</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="ชื่อค่าใช้จ่าย (เช่น ค่าสอบบัญชี)"
                      value={newFixedName}
                      onChange={(e) => setNewFixedName(e.target.value)}
                      className="px-3 py-2 bg-white rounded-lg border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-stone-500"
                    />
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="จำนวนเงินต่อเดือน (บาท)"
                      value={newFixedAmount}
                      onChange={(e) => setNewFixedAmount(e.target.value)}
                      className="px-3 py-2 bg-white rounded-lg border border-stone-300 text-sm font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddFixed(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      บันทึกรายการ
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddFixed(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-stone-300 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50 text-stone-700 hover:text-stone-900 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มค่าใช้จ่ายคงที่อื่นๆ</span>
                </button>
              )}
            </div>
          </div>

          {/* Operating Days Setting */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-stone-900">
              จำนวนวันเปิดร้านต่อเดือน
            </span>
            <div className="flex items-center gap-2 w-28">
              <input
                type="number"
                min={1}
                max={31}
                value={config.operatingDays}
                onChange={(e) =>
                  updateConfig(
                    'operatingDays',
                    Math.max(1, Math.min(31, parseInt(e.target.value) || 30))
                  )
                }
                className="w-full px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 text-sm font-mono text-center font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-500"
              />
              <span className="text-sm text-stone-500 font-medium">วัน</span>
            </div>
          </div>
        </div>

        {/* =======================================================
            SECTION B: ต้นทุนผันแปรต่อแก้ว (Variable Costs)
           ======================================================= */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-base">
                2. ต้นทุนผันแปรต่อแก้ว (Variable Costs)
              </h3>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
                รวม ฿{metrics.totalVariablePerCup.toFixed(2)} / แก้ว
              </span>
            </div>

            {/* Inputs List */}
            <div className="space-y-2.5">
              <CostInputRow
                label="เมล็ดกาแฟ / ชา ต่อแก้ว"
                step="0.1"
                value={config.coffeeBeans}
                onChange={(val) => updateConfig('coffeeBeans', val)}
              />
              <CostInputRow
                label="นมสด / นมโอ๊ต / ไซรัป / ผงชง"
                step="0.1"
                value={config.milkSyrup}
                onChange={(val) => updateConfig('milkSyrup', val)}
              />
              <CostInputRow
                label="บรรจุภัณฑ์ (แก้ว + ฝา + หลอด)"
                step="0.1"
                value={config.packaging}
                onChange={(val) => updateConfig('packaging', val)}
              />
              <CostInputRow
                label="น้ำแข็ง ต่อแก้ว"
                step="0.1"
                value={config.ice}
                onChange={(val) => updateConfig('ice', val)}
              />
              <CostInputRow
                label="ทิชชู่ / ถุงหิ้ว / ปลอกสวมแก้ว"
                step="0.1"
                value={config.tissueBag}
                onChange={(val) => updateConfig('tissueBag', val)}
              />

              {/* Custom Variable List */}
              {(config.customVariableList || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3.5 bg-stone-50/80 rounded-xl border border-stone-200"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig(
                          'customVariableList',
                          (config.customVariableList || []).filter((x) => x.id !== item.id)
                        )
                      }
                      className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-stone-900">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 w-36 shrink-0">
                    <span className="text-sm font-mono text-stone-400">฿</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={item.amount}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        updateConfig(
                          'customVariableList',
                          (config.customVariableList || []).map((x) =>
                            x.id === item.id ? { ...x, amount: val } : x
                          )
                        );
                      }}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-stone-300 text-sm font-mono text-right font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-500"
                    />
                  </div>
                </div>
              ))}

              {/* Add Custom Variable Form */}
              {showAddVar ? (
                <form
                  onSubmit={handleAddVarSubmit}
                  className="p-3.5 bg-stone-100 rounded-xl border border-stone-300 space-y-3"
                >
                  <div className="text-sm font-bold text-stone-900">เพิ่มต้นทุนผันแปรต่อแก้ว</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="ชื่อต้นทุน (เช่น ค่าสติกเกอร์โลโก้)"
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      className="px-3 py-2 bg-white rounded-lg border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-stone-500"
                    />
                    <input
                      type="number"
                      required
                      step="0.1"
                      min={0}
                      placeholder="ต้นทุนต่อแก้ว (บาท)"
                      value={newVarAmount}
                      onChange={(e) => setNewVarAmount(e.target.value)}
                      className="px-3 py-2 bg-white rounded-lg border border-stone-300 text-sm font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddVar(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      บันทึกรายการ
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddVar(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-stone-300 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50 text-stone-700 hover:text-stone-900 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มต้นทุนผันแปรอื่นๆ (เช่น สติกเกอร์, ซีล)</span>
                </button>
              )}
            </div>
          </div>

          {/* Average Selling Price Selector */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-stone-900">
                ราคาขายเฉลี่ยต่อแก้ว
              </span>
              <div className="flex items-center gap-2 w-36 shrink-0">
                <span className="text-sm font-mono text-stone-400">฿</span>
                <input
                  type="number"
                  min={1}
                  value={config.sellingPrice}
                  onChange={(e) =>
                    updateConfig('sellingPrice', Math.max(1, parseFloat(e.target.value) || 0))
                  }
                  className="w-full px-3 py-2 bg-stone-50 rounded-lg border border-stone-300 text-sm font-mono text-right font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-500"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-stone-500">เลือกด่วน:</span>
              <button
                type="button"
                onClick={() => updateConfig('sellingPrice', autoMenuPrice)}
                className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                เฉลี่ยในร้าน ฿{autoMenuPrice}
              </button>
              <button
                type="button"
                onClick={() => updateConfig('sellingPrice', 45)}
                className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                ร้อน ฿45
              </button>
              <button
                type="button"
                onClick={() => updateConfig('sellingPrice', 60)}
                className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                เย็น ฿60
              </button>
              <button
                type="button"
                onClick={() => updateConfig('sellingPrice', 75)}
                className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                พิเศษ ฿75
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================
          SECTION C: Target Profit Simulator (จำลองเป้าหมายกำไร)
         ======================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-stone-900 text-base">
            3. จำลองเป้าหมายกำไรสุทธิ (Target Profit)
          </h3>

          <div className="flex items-center gap-2">
            {[20000, 30000, 50000, 100000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => updateConfig('targetProfit', amt)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  config.targetProfit === amt
                    ? 'bg-stone-900 text-white font-bold shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 font-medium'
                }`}
              >
                ฿{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Target Slider & Input */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-800">
                กำไรสุทธิต่อเดือนที่ต้องการ
              </span>
              <div className="flex items-center gap-1 font-mono font-bold text-stone-900 text-sm">
                <span>฿</span>
                <input
                  type="number"
                  step={5000}
                  min={0}
                  value={config.targetProfit}
                  onChange={(e) =>
                    updateConfig('targetProfit', Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="w-24 px-2 py-1 bg-white rounded-md border border-stone-300 text-right font-mono text-sm focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={150000}
              step={5000}
              value={config.targetProfit}
              onChange={(e) => updateConfig('targetProfit', parseFloat(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-stone-500 font-mono">
              <span>฿0 (แค่คุ้มทุน)</span>
              <span>฿75,000</span>
              <span>฿150,000+</span>
            </div>
          </div>

          {/* Target Cups */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
            <span className="text-sm font-semibold text-stone-800">ต้องขายให้ได้ต่อวัน</span>
            <div className="pt-2">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-800">
                {metrics.targetCupsDaily.toLocaleString()}{' '}
                <span className="text-sm font-normal text-stone-500">แก้ว/วัน</span>
              </div>
              <p className="text-xs text-stone-600 mt-1 font-mono">
                รวมเดือนละ {metrics.targetCupsMonthly.toLocaleString()} แก้ว ({config.operatingDays} วัน)
              </p>
            </div>
          </div>

          {/* Target Revenue */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
            <span className="text-sm font-semibold text-stone-800">
              ยอดขายรวมต่อเดือนที่ต้องทำ
            </span>
            <div className="pt-2">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-stone-900">
                ฿{metrics.targetRevenueMonthly.toLocaleString()}
              </div>
              <p className="text-xs text-stone-600 mt-1 font-mono">
                เฉลี่ยวันละ ฿{Math.round(metrics.targetRevenueMonthly / config.operatingDays).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formula & Explanation Table */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-3">
        <h4 className="text-sm font-bold text-stone-900">
          สรุปสูตรคำนวณจุดคุ้มทุน
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-stone-700 font-mono">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900">กำไรส่วนเกินต่อแก้ว (Contribution Margin)</span>
            <p className="text-stone-600">
              = ราคาขายเฉลี่ย (฿{config.sellingPrice}) - ต้นทุนผันแปรต่อแก้ว (฿{metrics.totalVariablePerCup.toFixed(2)})
            </p>
            <p className="text-emerald-700 font-bold text-sm">
              = ฿{metrics.contributionMarginPerCup.toFixed(2)} ต่อแก้ว
            </p>
          </div>
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900">จุดคุ้มทุนต่อเดือน (Break-Even Cups)</span>
            <p className="text-stone-600">
              = ต้นทุนคงที่รวม (฿{metrics.totalFixedMonthly.toLocaleString()}) ÷ กำไรส่วนเกินต่อแก้ว (฿{metrics.contributionMarginPerCup.toFixed(2)})
            </p>
            <p className="text-emerald-700 font-bold text-sm">
              = {metrics.breakEvenCupsMonthly.toLocaleString()} แก้วต่อเดือน (เฉลี่ยวันละ {metrics.breakEvenCupsDaily} แก้ว)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BreakEvenCalculator;
