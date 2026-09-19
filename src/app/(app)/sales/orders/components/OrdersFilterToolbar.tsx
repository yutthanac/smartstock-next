'use client';

import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export type FilterMode = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';

const DAY_NAMES = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MONTH_NAMES_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

interface OrdersFilterToolbarProps {
  filterMode: FilterMode;
  onSelectQuick: (mode: FilterMode) => void;
  formattedDateTitle: string;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
  selectedDate: string;
  currentCalendarMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDaySelect: (dayNum: number) => void;
  onResetToday: () => void;
  children?: React.ReactNode;
}

export function OrdersFilterToolbar({
  filterMode,
  onSelectQuick,
  formattedDateTitle,
  isCalendarOpen,
  setIsCalendarOpen,
  selectedDate,
  currentCalendarMonth,
  onPrevMonth,
  onNextMonth,
  onDaySelect,
  onResetToday,
  children,
}: OrdersFilterToolbarProps) {
  const calYear = currentCalendarMonth.getFullYear();
  const calMonth = currentCalendarMonth.getMonth();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Quick Pills */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectQuick('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'today'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            วันนี้
          </button>
          <button
            type="button"
            onClick={() => onSelectQuick('yesterday')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'yesterday'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            เมื่อวาน
          </button>
          <button
            type="button"
            onClick={() => onSelectQuick('week')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'week'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            7 วันล่าสุด
          </button>
          <button
            type="button"
            onClick={() => onSelectQuick('month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'month'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            เดือนนี้
          </button>
          <button
            type="button"
            onClick={() => onSelectQuick('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            ทั้งหมด
          </button>
        </div>

        {/* Interactive Calendar Trigger & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filterMode === 'custom' || isCalendarOpen
                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <CalendarIcon className={`w-4 h-4 ${filterMode === 'custom' || isCalendarOpen ? 'text-stone-300' : 'text-stone-500'}`} />
            <span>{formattedDateTitle}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                filterMode === 'custom' || isCalendarOpen ? 'text-stone-300' : 'text-stone-400'
              } ${isCalendarOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Calendar Picker Popover */}
          {isCalendarOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsCalendarOpen(false)}
              />
              <div className="absolute right-0 md:left-auto mt-2 z-40 w-[310px] bg-white rounded-2xl border border-stone-200/90 shadow-xl p-3.5 animate-in fade-in zoom-in-95 duration-150">
                {/* Header Month / Year controls */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <button
                    type="button"
                    onClick={onPrevMonth}
                    className="p-1 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
                    title="เดือนก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-xs font-bold text-stone-800">
                    {MONTH_NAMES_TH[calMonth]} {calYear + 543}
                  </div>
                  <button
                    type="button"
                    onClick={onNextMonth}
                    className="p-1 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
                    title="เดือนถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day Names Grid */}
                <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
                  {DAY_NAMES.map((d, i) => (
                    <div key={i} className="text-[10px] font-semibold text-stone-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array(firstDayOfWeek)
                    .fill(null)
                    .map((_, i) => (
                      <div key={`empty-${i}`} className="h-8 w-8" />
                    ))}
                  {Array(daysInMonth)
                    .fill(null)
                    .map((_, i) => {
                      const dayNum = i + 1;
                      const thisDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isToday = new Date().toISOString().split('T')[0] === thisDateStr;
                      const isSelected =
                        selectedDate === thisDateStr &&
                        (filterMode === 'custom' || filterMode === 'today' || filterMode === 'yesterday');

                      return (
                        <button
                          key={`d-${dayNum}`}
                          type="button"
                          onClick={() => onDaySelect(dayNum)}
                          className={`h-8 w-8 rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-stone-900 text-white font-bold shadow-xs scale-105'
                              : isToday
                              ? 'bg-stone-100 text-stone-900 font-bold border border-stone-300'
                              : 'text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                </div>

                <div className="pt-3 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={onResetToday}
                    className="text-stone-700 font-semibold hover:underline cursor-pointer"
                  >
                    วันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
