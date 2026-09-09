'use client';

import React from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';
import { useSidebar } from '@/lib/SidebarContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const { dashboard } = useStock();
  const { user, logout } = useAuth();
  const { toggleMobileSidebar } = useSidebar();

  const getRoleBadge = (roles?: string[]) => {
    if (!roles || roles.length === 0) return 'ผู้ใช้งานทั่วไป';
    if (roles.includes('admin')) return 'ผู้ดูแลระบบ (Admin)';
    if (roles.includes('manager')) return 'ผู้จัดการร้าน (Manager)';
    if (roles.includes('chef')) return 'หัวหน้าครัว (Chef)';
    if (roles.includes('cashier')) return 'พนักงาน POS (Cashier)';
    return roles.join(', ');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.slice(0, 2);
  };

  return (
    <header className="bg-white sticky top-0 z-20 border-b border-stone-200/90 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          onClick={toggleMobileSidebar}
          aria-label="เปิดเมนูหลัก"
          className="lg:hidden p-2 -ml-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-stone-500 font-normal truncate">
          <span className="hidden md:inline hover:text-stone-700 transition-colors">คลังสินค้า</span>
          <span className="hidden md:inline text-stone-300">›</span>
          <span className="text-stone-900 font-semibold truncate">{title.split('(')[0].trim()}</span>
        </div>
      </div>

      {/* Center: System / Store Brand Title */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-xs font-bold tracking-widest text-stone-900 uppercase">
          SMARTSTOCK
        </span>
      </div>

      {/* Right: Notifications & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notification Bell with Badge Count */}
        <button
          aria-label="แจ้งเตือน"
          className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {dashboard.low_stock_count > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-stone-900 text-white rounded-full text-xs font-semibold flex items-center justify-center ring-2 ring-white">
              {dashboard.low_stock_count > 9 ? '9+' : dashboard.low_stock_count}
            </span>
          )}
        </button>

        {/* Circular User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
          <div
            title={`${user?.name || 'ผู้ใช้'} (${getRoleBadge(user?.roles)})`}
            className="w-8 h-8 rounded-full bg-stone-900 text-white font-semibold flex items-center justify-center text-xs overflow-hidden shadow-xs"
          >
            {getInitials(user?.name)}
          </div>

          <button
            onClick={() => logout()}
            title="ออกจากระบบ"
            className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
