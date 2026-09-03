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
    <header className="bg-[#ebecf0]/95 backdrop-blur-md sticky top-0 z-20 border-b border-[#d9dbe3] px-6 py-3.5 flex items-center justify-between shadow-[0_4px_12px_rgba(186,190,204,0.3)]">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3.5">
        {/* Search quickbar */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเมนู, วัตถุดิบ, หรือออเดอร์..."
            className="pl-9 pr-4 py-2 text-xs rounded-xl skeuo-input focus:outline-none transition-all w-64 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Notifications Icon with low stock badge */}
        <button
          aria-label="แจ้งเตือน"
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 skeuo-btn-secondary"
        >
          <Bell className="w-4 h-4" />
          {dashboard.low_stock_count > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          )}
        </button>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl skeuo-btn-primary font-bold flex items-center justify-center text-xs">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
              {user?.name || 'กำลังโหลด...'}
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{getRoleBadge(user?.roles)}</div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            title="ออกจากระบบ"
            className="p-2 ml-1 text-slate-600 hover:text-rose-600 skeuo-btn-secondary rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline text-[11px]">ออก</span>
          </button>
        </div>
      </div>
    </header>
  );
};
