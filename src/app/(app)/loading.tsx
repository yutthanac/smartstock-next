import React from 'react';
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      {/* Topbar Placeholder */}
      <header className="bg-white sticky top-0 z-20 border-b border-stone-200/90 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>

      {/* Main Page Skeleton */}
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
        {/* Top actions/filter bar skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>

        {/* 4 KPI Cards */}
        <CardSkeleton count={4} />

        {/* Main Content Box Skeleton */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden p-2">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
          <TableSkeleton rows={7} cols={5} />
        </div>
      </main>
    </div>
  );
}
