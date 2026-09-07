'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const defaultClassNames = {
    months: 'relative flex flex-col sm:flex-row gap-4',
    month: 'w-full',
    month_caption: 'relative mx-8 mb-2 flex h-9 items-center justify-center z-20',
    caption_label: 'text-sm font-semibold text-slate-800',
    nav: 'absolute top-0 flex w-full justify-between z-10 px-1',
    button_previous: cn(
      buttonVariants({ variant: 'ghost' }),
      'size-8 text-slate-500 hover:text-slate-900 p-0 rounded-lg',
    ),
    button_next: cn(
      buttonVariants({ variant: 'ghost' }),
      'size-8 text-slate-500 hover:text-slate-900 p-0 rounded-lg',
    ),
    weekday: 'w-10 h-8 p-0 text-xs font-semibold text-slate-400 text-center flex items-center justify-center',
    day_button:
      'relative flex w-10 h-10 items-center justify-center whitespace-nowrap rounded-xl p-0 text-slate-700 outline-none focus:outline-none hover:bg-slate-100 transition-colors group-data-[selected]:bg-slate-900 group-data-[selected]:text-white',
    day: 'group w-10 h-10 px-0 text-sm flex items-center justify-center',
    range_start: 'range-start',
    range_end: 'range-end',
    range_middle: 'range-middle',
    today: 'font-bold text-emerald-600',
    outside: 'text-slate-300 opacity-40',
    hidden: 'invisible',
    week_number: 'size-8 p-0 text-xs font-medium text-slate-400',
  };

  const mergedClassNames: typeof defaultClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: (classNames as any)?.[key]
        ? cn(
            (defaultClassNames as any)[key],
            (classNames as any)[key],
          )
        : (defaultClassNames as any)[key],
    }),
    {} as typeof defaultClassNames,
  );

  const defaultComponents = {
    Chevron: (chevronProps: any) => {
      if (chevronProps.orientation === 'left') {
        return <ChevronLeft size={16} strokeWidth={2} {...chevronProps} aria-hidden="true" />;
      }
      return <ChevronRight size={16} strokeWidth={2} {...chevronProps} aria-hidden="true" />;
    },
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('w-fit select-none', className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
