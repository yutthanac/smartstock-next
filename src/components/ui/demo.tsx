'use client';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { useEffect, useState } from 'react';

export function Clock() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const d = new Date();
      setHours(d.getHours());
      setMinutes(d.getMinutes());
      setSeconds(d.getSeconds());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-0.5 font-mono tabular-nums text-stone-900">
        <span>00:00:00</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 font-mono tabular-nums text-stone-900">
      <SlidingNumber value={hours} padStart={true} />
      <span className="text-zinc-500">:</span>
      <SlidingNumber value={minutes} padStart={true} />
      <span className="text-zinc-500">:</span>
      <SlidingNumber value={seconds} padStart={true} />
    </div>
  );
}

export default function DemoSlidingNumber() {
  return (
    <div className="p-8 flex flex-col items-center justify-center gap-4">
      <h2 className="text-sm font-medium text-stone-500">Sliding Number Live Clock</h2>
      <div className="text-2xl font-bold bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <Clock />
      </div>
    </div>
  );
}
