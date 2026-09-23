import React from 'react';
import { Skeleton } from '@/components/Skeleton';

export default function AppLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      {/* Top subtle indeterminate progress bar */}
      <div className="w-full h-1 bg-stone-200/50 overflow-hidden relative">
        <div className="h-full bg-stone-900 rounded-full animate-[progress_1s_ease-in-out_infinite] w-1/3" />
      </div>

      {/* Main Skeleton Placeholder */}
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/60">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200/90 space-y-4">
          <Skeleton className="h-6 w-52 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
