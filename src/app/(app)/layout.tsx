'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { StockProvider } from '@/lib/StockContext';
import { SidebarProvider } from '@/lib/SidebarContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StockProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-slate-50/80">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </StockProvider>
  );
}
