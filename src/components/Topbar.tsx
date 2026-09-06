'use client';

import React from 'react';
import { Bell, Search, UserCheck, LogOut, Shield } from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle }) => {
  const { dashboard } = useStock();
  const { user, logout } = useAuth();

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
    <header className="bg-white sticky top-0 z-20 border-b border-slate-200/80 px-6 py-3 flex items-center justify-between">
      {/* Left: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm text-slate-400 font-normal">
        <span className="hover:text-slate-600 transition-colors">คลังสินค้า</span>
        <span className="text-slate-300">›</span>
        <span className="text-slate-800 font-medium">{title.split('(')[0].trim()}</span>
      </div>

      {/* Center: System / Store Brand Title */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
        <span className="text-xs font-semibold tracking-widest text-slate-800 uppercase">
          SMARTSTOCK
        </span>
      </div>

      {/* Right: Notifications & User Avatar */}
      <div className="flex items-center gap-4">
        {/* Notification Bell with Badge Count */}
        <button
          aria-label="แจ้งเตือน"
          className="relative p-1.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {dashboard.low_stock_count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-3.5 h-3.5 px-1 bg-rose-500 text-white rounded-full text-[9px] font-medium flex items-center justify-center ring-2 ring-white">
              {dashboard.low_stock_count > 9 ? '9+' : dashboard.low_stock_count}
            </span>
          )}
        </button>

        {/* Circular User Avatar & Logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div
            title={`${user?.name || 'ผู้ใช้'} (${getRoleBadge(user?.roles)})`}
            className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-medium flex items-center justify-center text-xs overflow-hidden border border-slate-300/80"
          >
            {getInitials(user?.name)}
          </div>

          <button
            onClick={() => logout()}
            title="ออกจากระบบ"
            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
