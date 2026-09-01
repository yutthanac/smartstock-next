'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Receipt,
  Boxes,
  Carrot,
  FileSpreadsheet,
  UtensilsCrossed,
  Sparkles,
  BarChart3,
  TrendingUp,
  Users,
  ShieldCheck,
  Settings,
  ChefHat,
  AlertTriangle,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';

interface SidebarProps {
  collapsed?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
  alertCount?: number;
  requiredPermission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const { dashboard } = useStock();
  const { user, logout, hasPermission, hasRole } = useAuth();

  const menuSections: NavSection[] = [
    {
      title: 'ภาพรวม',
      items: [
        { label: 'แดชบอร์ด', href: '/dashboard', icon: LayoutDashboard, requiredPermission: 'view_dashboard' },
      ],
    },
    {
      title: 'การขาย (Sales)',
      items: [
        { label: 'ขายหน้าร้าน (POS)', href: '/sales/pos', icon: Store, badge: 'Active', requiredPermission: 'access_pos' },
        { label: 'ประวัติออเดอร์', href: '/sales/orders', icon: Receipt, requiredPermission: 'access_pos' },
      ],
    },
    {
      title: 'คลังสินค้า (Stock)',
      items: [
        {
          label: 'จัดการสต็อก',
          href: '/stock',
          icon: Boxes,
          alertCount: dashboard.low_stock_count > 0 ? dashboard.low_stock_count : undefined,
          requiredPermission: 'view_stock',
        },
        { label: 'วัตถุดิบทั้งหมด', href: '/stock/ingredients', icon: Carrot, requiredPermission: 'view_stock' },
        { label: 'ใบสั่งซื้อ / ซัพพลายเออร์', href: '/stock/purchase-orders', icon: FileSpreadsheet, requiredPermission: 'view_stock' },
      ],
    },
    {
      title: 'เมนู & สูตรอาหาร',
      items: [
        { label: 'สูตร/เมนู (Recipe BOM)', href: '/menu', icon: UtensilsCrossed, requiredPermission: 'view_menu' },
        { label: 'AI แนะนำเมนู', href: '/menu/ai-insights', icon: Sparkles, highlight: true, requiredPermission: 'view_menu' },
      ],
    },
    {
      title: 'วิเคราะห์รายงาน',
      items: [
        { label: 'รายงานยอดขาย', href: '/reports/sales', icon: BarChart3, requiredPermission: 'view_reports' },
        { label: 'ต้นทุน & กำไร', href: '/reports/profit', icon: TrendingUp, requiredPermission: 'view_reports' },
      ],
    },
    {
      title: 'ระบบ & สิทธิ์ผู้ใช้',
      items: [
        { label: 'รายชื่อพนักงาน', href: '/staff', icon: Users, requiredPermission: 'manage_users' },
        { label: 'กำหนดสิทธิ์บทบาท', href: '/roles', icon: ShieldCheck, requiredPermission: 'manage_users' },
        { label: 'ตั้งค่าระบบ', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-[#12312d] text-slate-200 flex flex-col h-screen sticky top-0 border-r border-[#1a423d] select-none z-30 transition-all duration-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1a423d] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-[#4fb0a5]/20 group-hover:scale-105 transition-transform overflow-hidden">
            <img
              src="/images/logo_ss.png"
              alt="SmartStock Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="font-bold text-white tracking-wide text-lg flex items-center gap-1.5">
              SmartStock
            </div>
            <div className="text-xs text-slate-400">ระบบจัดการสต็อก & ขาย</div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuSections.map((section, idx) => {
          // Filter items based on permission (if any defined)
          const visibleItems = section.items.filter(
            (item) => !item.requiredPermission || hasPermission(item.requiredPermission) || hasRole('admin')
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold tracking-wider text-[#4fb0a5]/80 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5 mt-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#4fb0a5] text-slate-950 shadow-md font-semibold shadow-[#4fb0a5]/25'
                          : 'text-slate-300 hover:bg-[#1a423d] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-5 h-5 transition-colors ${
                            isActive
                              ? 'text-slate-950'
                              : item.highlight
                              ? 'text-[#4fb0a5] group-hover:text-white'
                              : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {/* Badges and Alerts */}
                      <div className="flex items-center gap-1.5">
                        {item.highlight && !isActive && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4fb0a5] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4fb0a5]"></span>
                          </span>
                        )}
                        {item.alertCount && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-500/90 text-white font-bold shadow-sm">
                            <AlertTriangle className="w-3 h-3" />
                            {item.alertCount}
                          </span>
                        )}
                        {item.badge && !isActive && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1e4842] text-[#4fb0a5] font-medium border border-[#4fb0a5]/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer User Info & Logout Button */}
      <div className="p-3 border-t border-[#1a423d] bg-[#0c221f]/50 space-y-2">
        <div className="p-2.5 rounded-xl bg-[#173e39] border border-[#235851] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#4fb0a5]/20 text-[#4fb0a5] flex items-center justify-center font-bold text-xs shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name || 'ผู้ใช้'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="ออกจากระบบ"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
