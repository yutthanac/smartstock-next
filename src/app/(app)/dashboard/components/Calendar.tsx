'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Calendar as CalendarIcon, ArrowRight, Store } from 'lucide-react';

const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface CalendarDayProps {
  day: number | string;
  isHeader?: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  isHeader,
  isToday,
  isSelected,
  onClick,
}) => {
  let dayClass = 'text-stone-400 hover:text-stone-700 hover:bg-stone-50';

  if (isHeader) {
    dayClass = 'text-stone-400 font-semibold';
  } else if (isSelected) {
    dayClass = 'bg-stone-900 text-white shadow-2xs font-semibold';
  } else if (isToday) {
    dayClass = 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] font-bold';
  }

  return (
    <button
      type="button"
      disabled={isHeader}
      onClick={onClick}
      className={`col-span-1 row-span-1 flex h-8 w-8 items-center justify-center transition-all cursor-pointer ${
        isHeader ? 'cursor-default' : 'rounded-xl'
      } ${dayClass}`}
    >
      <span className="font-medium text-xs">
        {day}
      </span>
    </button>
  );
};

export function Calendar() {
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('th-TH', { month: 'long' });
  const currentMonthEn = currentDate.toLocaleString('en-US', { month: 'short' });
  const currentYear = currentDate.getFullYear();
  const todayDate = currentDate.getDate();

  const [selectedDay, setSelectedDay] = useState<number>(todayDate);

  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(
    currentYear,
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const ordersLink = '/sales/orders';

  const renderCalendarDays = () => {
    const days: React.ReactNode[] = [
      ...dayNames.map((day) => (
        <CalendarDay key={`header-${day}`} day={day} isHeader />
      )),
      ...Array(firstDayOfWeek)
        .fill(null)
        .map((_, i) => (
          <div
            key={`empty-start-${i}`}
            className="col-span-1 row-span-1 h-8 w-8"
          />
        )),
      ...Array(daysInMonth)
        .fill(null)
        .map((_, i) => {
          const dayNum = i + 1;
          const isToday = dayNum === todayDate;
          const isSelected = dayNum === selectedDay;

          return (
            <CalendarDay
              key={`date-${dayNum}`}
              day={dayNum}
              isToday={isToday}
              isSelected={isSelected}
              onClick={() => setSelectedDay(dayNum)}
            />
          );
        }),
    ];

    return days;
  };

  return (
    <BentoCard height="h-auto" linkTo={ordersLink} className="rounded-2xl border border-stone-200/90 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 h-full">
        {/* Left Info Column */}
        <div className="space-y-3 max-w-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5efe6] border border-[#e8ded0] text-[#78350f] text-xs font-medium">
            <Store className="w-3.5 h-3.5 text-[#78350f]" />
            <span>เปิดให้บริการปกติ (08:00 - 18:00)</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
            ปฏิทินร้าน & ยอดขายประจำวัน
          </h2>
          <p className="text-xs md:text-sm text-stone-500 font-normal leading-relaxed">
            เลือกดูสถิติและประวัติบิลออเดอร์ของวันที่ {selectedDay} {currentMonthName} {currentYear}
          </p>

          <div className="pt-2">
            <Link href={ordersLink}>
              <Button size="sm" variant="primary" className="rounded-xl font-medium text-xs bg-stone-900 text-white hover:bg-stone-800">
                ดูประวัติบิลทั้งหมด
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Calendar Column */}
        <div className="w-full max-w-[360px] mx-auto md:mx-0">
          <div className="w-full rounded-2xl border border-stone-200/80 bg-white p-2 shadow-2xs">
            <div className="rounded-xl border border-stone-200 p-3 bg-stone-50/70">
              {/* Calendar Header */}
              <div className="flex items-center justify-between px-2 pb-2">
                <p className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-stone-500" />
                  <span>
                    {currentMonthName} ({currentMonthEn}), {currentYear}
                  </span>
                </p>
                <span className="text-xs text-stone-500 font-medium">
                  {daysInMonth} วัน
                </span>
              </div>

              {/* Days Grid */}
              <div className="mt-2 grid grid-cols-7 gap-1 place-items-center">
                {renderCalendarDays()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

interface BentoCardProps {
  children: React.ReactNode;
  height?: string;
  rowSpan?: number;
  colSpan?: number;
  className?: string;
  showHoverGradient?: boolean;
  hideOverflow?: boolean;
  linkTo?: string;
}

export function BentoCard({
  children,
  height = 'h-auto',
  rowSpan = 8,
  colSpan = 7,
  className = '',
  showHoverGradient = true,
  hideOverflow = true,
  linkTo,
}: BentoCardProps) {
  return (
    <div
      className={`group relative flex flex-col rounded-2xl border border-stone-200/90 bg-white p-6 transition-all duration-300 hover:border-stone-300 ${
        hideOverflow && 'overflow-hidden'
      } ${height} ${className}`}
    >
      {linkTo && (
        <Link
          href={linkTo}
          title="ดูรายการออเดอร์"
          className="absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 border border-stone-200 opacity-70 transition-all duration-200 hover:opacity-100 hover:bg-stone-900 hover:text-white"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      <div className="relative z-20 w-full h-full">{children}</div>
    </div>
  );
}
