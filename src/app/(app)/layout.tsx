'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { StockProvider } from '@/lib/StockContext';
import { SidebarProvider } from '@/lib/SidebarContext';
import { useAuth } from '@/lib/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!token || !user)) {
      const redirectQuery = pathname
        ? `?redirect=${encodeURIComponent(pathname + (typeof window !== 'undefined' ? window.location.search : ''))}`
        : '';
      router.replace(`/login${redirectQuery}`);
    }
  }, [isLoading, token, user, router, pathname]);

  // Loading state during auth check to prevent flash of protected content
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#faf9f5] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2.5 shadow-sm bg-white border border-stone-200/80 animate-pulse">
            <img src="/images/logo_ss.png" alt="SmartStock" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!token || !user) {
    return null;
  }

  return (
    <StockProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-[#faf9f5]">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </StockProvider>
  );
}
