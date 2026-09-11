'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { format, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';

const GOOD_REVENUE_THRESHOLD = 3000;

export const DashboardCalendarDropdown: React.FC = () => {
  const { dashboard, orders } = useStock();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(today);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Aggregate daily revenue map from real orders + dashboard 7days + sample historical data
  const revenueMap = useMemo(() => {
    const map: Record<string, { sales: number; orderCount: number }> = {};

    // 1. Real orders from useStock
    if (orders && orders.length > 0) {
      orders.forEach((o) => {
        const d = o.created_at ? new Date(o.created_at) : null;
        if (d && !isNaN(d.getTime())) {
          const key = format(d, 'yyyy-MM-dd');
          if (!map[key]) map[key] = { sales: 0, orderCount: 0 };
          map[key].sales += Number(o.total || 0);
          map[key].orderCount += 1;
        }
      });
    }

    // 2. Today's sales from dashboard KPI
    const todayKey = format(today, 'yyyy-MM-dd');
    if (dashboard.today_sales) {
      if (!map[todayKey]) {
        map[todayKey] = {
          sales: dashboard.today_sales,
          orderCount: dashboard.total_orders_today || 1,
        };
      }
    }

    // 3. Sales 7 days from dashboard
    if (dashboard.sales_7days && dashboard.sales_7days.length > 0) {
      dashboard.sales_7days.forEach((item, idx) => {
        if (!item.sales || item.sales <= 0) return;
        const dayOffset = 6 - idx;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - dayOffset);
        const key = format(targetDate, 'yyyy-MM-dd');
        if (!map[key]) {
          map[key] = {
            sales: item.sales,
            orderCount: Math.max(1, Math.round(item.sales / 120)),
          };
        }
      });
    }

    return map;
  }, [orders, dashboard, today]);

  // Calendar calculations for 1-month view
  const currentYear = currentViewDate.getFullYear();
  const currentMonth = currentViewDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedRevenue = revenueMap[selectedDateKey] || { sales: 0, orderCount: 0 };

  const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-10 inline-flex items-center gap-2.5 px-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs select-none ${
          isOpen
            ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
            : 'bg-white text-stone-800 border-stone-200/90 hover:bg-stone-50 hover:border-stone-300'
        }`}
      >
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
          isOpen ? 'text-white stroke-2.8' : 'text-stone-700'
        }`}>
          <CalendarIcon className="w-3.5 h-3.5" />
        </div>

        <div className="text-left text-sm leading-tight">
          <div className="font-medium flex items-center gap-1.5">
            <span>{format(selectedDate, 'd MMM yyyy', { locale: th })}</span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white/80' : 'text-stone-400'
          }`}
        />
      </button>

      {/* Dropdown Floating Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[370px] bg-white rounded-2xl border border-stone-200/90 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header of Calendar Dropdown */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-stone-700" />
                <span>ปฏิทินรายได้รายวัน</span>
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between py-2.5 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-stone-800">
              {format(currentViewDate, 'MMMM yyyy', { locale: th })}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 text-center py-1 border-y border-stone-100 bg-stone-50/60 rounded-xl">
            {dayNames.map((name) => (
              <span key={name} className="text-xs font-semibold text-stone-400 py-0.5">
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid (1 Month View) */}
          <div className="grid grid-cols-7 gap-1 mt-2">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 w-full" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(currentYear, currentMonth, dayNum);
              const dateKey = format(dateObj, 'yyyy-MM-dd');
              const isToday = isSameDay(dateObj, today);
              const isSelected = isSameDay(dateObj, selectedDate);
              const info = revenueMap[dateKey];
              const sales = info ? info.sales : 0;
              const isGood = sales >= GOOD_REVENUE_THRESHOLD;

              let salesLabel = '';
              if (sales > 0) {
                salesLabel = sales >= 1000 ? `฿${(sales / 1000).toFixed(sales % 1000 === 0 ? 0 : 1)}k` : `฿${sales.toFixed(0)}`;
              }

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => setSelectedDate(dateObj)}
                  className={`h-12 w-full rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer select-none p-0.5 ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                      : isToday
                      ? 'bg-[#f5efe6] border border-[#e8ded0] text-stone-900 font-semibold'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span className={`text-xs ${isToday && !isSelected ? 'text-[#78350f] font-bold' : ''}`}>
                    {dayNum}
                  </span>

                  {sales > 0 ? (
                    <span
                      className={`text-xs font-mono tabular-nums leading-none mt-0.5 scale-90 ${
                        isSelected
                          ? 'text-white/80'
                          : isGood
                          ? 'text-[#78350f] font-semibold'
                          : 'text-stone-500'
                      }`}
                    >
                      {salesLabel}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-300 leading-none mt-0.5">-</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
