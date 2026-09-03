'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

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
        { label: 'ขายหน้าร้าน', href: '/sales/pos', icon: Store, badge: 'Active', requiredPermission: 'access_pos' },
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
        { label: 'ใบสั่งซื้อ', href: '/stock/purchase-orders', icon: FileSpreadsheet, requiredPermission: 'view_stock' },
      ],
    },
    {
      title: 'เมนู & สูตรอาหาร',
      items: [
        { label: 'จัดการเมนู', href: '/menu', icon: UtensilsCrossed, requiredPermission: 'view_menu' },
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
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } bg-white text-slate-700 flex flex-col h-screen sticky top-0 border-r border-slate-200/80 select-none z-30 shadow-xs transition-all duration-300 relative group/sidebar`}
    >
      {/* Brand Header */}
      <div className={`p-3.5 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 p-1.5 flex items-center justify-center border border-emerald-100 shadow-xs shrink-0 hover:scale-105 transition-transform overflow-hidden">
              <img
                src="/images/logo_ss.png"
                alt="SmartStock Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 transition-opacity duration-200">
              <div className="font-bold text-slate-900 tracking-wide text-lg flex items-center gap-1.5 whitespace-nowrap">
                SmartStock
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap truncate">ระบบจัดการสต็อก & ขาย</div>
            </div>
          </Link>
        )}

        {/* Toggle button */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? 'ขยายแถบเมนู' : 'ย่อเมนูเหลือแต่ไอคอน'}
          className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-200 transition-all shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className={`flex-1 overflow-y-auto no-scrollbar py-3 space-y-5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {menuSections.map((section, idx) => {
          // Filter items based on permission (if any defined)
          const visibleItems = section.items.filter(
            (item) => !item.requiredPermission || hasPermission(item.requiredPermission) || hasRole('admin')
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 text-[12px] font-normal tracking-wider text-slate-400 uppercase truncate">
                  {section.title}
                </div>
              ) : (
                <div className="w-6 h-0.5 bg-slate-100 mx-auto my-2 rounded-full" />
              )}

              <div className="space-y-1 mt-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex items-center rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                        isCollapsed
                          ? 'justify-center p-2.5'
                          : 'justify-between px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                        <Icon
                          className={`w-5 h-5 shrink-0 transition-colors ${
                            isActive
                              ? 'text-emerald-700'
                              : item.highlight
                              ? 'text-emerald-600 group-hover:text-emerald-700'
                              : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {/* Badges and Alerts for Expanded View */}
                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.highlight && !isActive && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                          {item.alertCount && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold shadow-sm">
                              <AlertTriangle className="w-3 h-3" />
                              {item.alertCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Small Dot Indicator for Collapsed View */}
                      {isCollapsed && (item.alertCount || (item.highlight && !isActive)) && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                      )}

                      {/* Hover Tooltip when Collapsed */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.alertCount && (
                            <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                              {item.alertCount}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer User Info & Logout Button */}
      <div className={`p-3 border-t border-slate-100 bg-slate-50/50 ${isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'}`}>
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200/50">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">{user?.name || 'ผู้ใช้'}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="ออกจากระบบ"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              title={`${user?.name || 'ผู้ใช้'} (${user?.email || ''})`}
              className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200/50 cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
            </div>
            <button
              onClick={() => logout()}
              title="ออกจากระบบ"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
