'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Receipt,
  Boxes,
  Carrot,
  UtensilsCrossed,
  Sparkles,
  BarChart3,
  TrendingUp,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Coffee,
  Cookie,
  Building2,
  Check,
  Plus,
  Eye,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth, StoreInfo } from '@/lib/AuthContext';
import { ICON_MAP } from '@/app/(app)/settings/components/iconMap';

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
  moduleKey: string;
  allowedRoles: string[]; // Roles allowed to view this menu item
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin:   'ผู้ดูแลระบบ (Admin)',
  owner:   'เจ้าของร้าน (Owner)',
  manager: 'ผู้จัดการร้าน (Manager)',
  chef:    'หัวหน้าครัว (Chef)',
  cashier: 'แคชเชียร์ (Cashier)',
  staff:   'พนักงานทั่วไป (Staff)',
};

const SIMULATE_ROLES = ['admin', 'manager', 'chef', 'cashier', 'staff'];

export const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { dashboard } = useStock();
  const { user, logout, hasPermission, hasRole, activeStore, stores, setActiveStore } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStoreDropdownOpen(false);
      }
    };
    if (isStoreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStoreDropdownOpen]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const getStoreIcon = (type?: string) => {
    switch (type) {
      case 'cafe':
        return Coffee;
      case 'bakery':
        return Cookie;
      case 'restaurant':
        return UtensilsCrossed;
      default:
        return Building2;
    }
  };

  const getStoreTypeName = (type?: string) => {
    switch (type) {
      case 'cafe':
        return 'คาเฟ่ & เครื่องดื่ม';
      case 'bakery':
        return 'เบเกอรี่ & ขนมอบ';
      case 'restaurant':
        return 'ร้านอาหาร';
      default:
        return 'ร้านค้าทั่วไป';
    }
  };

  const handleSelectStore = (store: StoreInfo) => {
    setActiveStore(store);
    setIsStoreDropdownOpen(false);
    router.push('/dashboard');
  };

  const isModuleEnabled = (moduleKey?: string): boolean => {
    if (!moduleKey) return true;
    if (!activeStore?.menu_config) return true;
    return activeStore.menu_config[moduleKey] !== false;
  };

  // Determine Effective Role
  const actualRole = activeStore?.my_role || (user?.roles?.[0] as string) || 'admin';
  const effectiveRole = simulatedRole || actualRole;

  const isRoleAllowed = (allowedRoles: string[]): boolean => {
    // Admin and Owner have master access to all enabled store modules
    if (effectiveRole === 'admin' || effectiveRole === 'owner') return true;
    return allowedRoles.includes(effectiveRole);
  };

  const themeColor = activeStore?.theme_color || '#059669';

  // Complete Menu Hierarchy with Role Mapping & Store Module Keys
  const menuSections: NavSection[] = [
    {
      title: 'ภาพรวม',
      items: [
        {
          label: 'แดชบอร์ด',
          href: '/dashboard',
          icon: LayoutDashboard,
          moduleKey: 'dashboard',
          allowedRoles: ['admin', 'owner', 'manager'],
        },
      ],
    },
    {
      title: 'การขาย (Sales)',
      items: [
        {
          label: 'ขายหน้าร้าน',
          href: '/sales/pos',
          icon: Store,
          badge: 'Active',
          moduleKey: 'pos',
          allowedRoles: ['admin', 'owner', 'manager', 'cashier', 'staff'],
        },
        {
          label: 'ประวัติออเดอร์',
          href: '/sales/orders',
          icon: Receipt,
          moduleKey: 'orders',
          allowedRoles: ['admin', 'owner', 'manager', 'cashier', 'staff'],
        },
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
          moduleKey: 'stock',
          allowedRoles: ['admin', 'owner', 'manager', 'chef'],
        },
        {
          label: 'วัตถุดิบทั้งหมด',
          href: '/stock/ingredients',
          icon: Carrot,
          moduleKey: 'ingredients',
          allowedRoles: ['admin', 'owner', 'manager', 'chef'],
        },
        {
          label: 'รายการซื้อของ/จ่ายตลาด',
          href: '/stock/purchase-orders',
          icon: ShoppingBag,
          moduleKey: 'purchase_orders',
          allowedRoles: ['admin', 'owner', 'manager', 'chef'],
        },
      ],
    },
    {
      title: 'เมนู & สูตรอาหาร',
      items: [
        {
          label: 'จัดการเมนู',
          href: '/menu',
          icon: UtensilsCrossed,
          moduleKey: 'menu',
          allowedRoles: ['admin', 'owner', 'manager', 'chef', 'cashier'],
        },
        {
          label: 'AI แนะนำเมนู',
          href: '/menu/ai-insights',
          icon: Sparkles,
          highlight: true,
          moduleKey: 'ai_insights',
          allowedRoles: ['admin', 'owner', 'manager', 'chef'],
        },
      ],
    },
    {
      title: 'วิเคราะห์รายงาน',
      items: [
        {
          label: 'รายงานยอดขาย',
          href: '/reports/sales',
          icon: BarChart3,
          moduleKey: 'reports_sales',
          allowedRoles: ['admin', 'owner', 'manager'],
        },
        {
          label: 'ต้นทุน & กำไร',
          href: '/reports/profit',
          icon: TrendingUp,
          moduleKey: 'reports_profit',
          allowedRoles: ['admin', 'owner', 'manager'],
        },
      ],
    },
    {
      title: 'ระบบ & สิทธิ์ผู้ใช้',
      items: [
        {
          label: 'รายชื่อพนักงาน',
          href: '/staff',
          icon: Users,
          moduleKey: 'staff',
          allowedRoles: ['admin', 'owner', 'manager'],
        },
        {
          label: 'กำหนดสิทธิ์บทบาท',
          href: '/roles',
          icon: ShieldCheck,
          moduleKey: 'roles',
          allowedRoles: ['admin', 'owner'],
        },
        {
          label: 'ตั้งค่าระบบ',
          href: '/settings',
          icon: Settings,
          moduleKey: 'settings',
          allowedRoles: ['admin', 'owner'],
        },
      ],
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-[#ebecf0] text-slate-700 flex flex-col h-screen sticky top-0 border-r border-slate-300/70 select-none z-30 transition-all duration-300 relative group/sidebar shadow-sm`}
    >
      {/* Brand Header with Store Switcher Trigger */}
      <div
        ref={dropdownRef}
        className={`p-3.5 border-b border-slate-300/60 flex items-center relative ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!isCollapsed ? (
          <button
            onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
            className="flex items-center gap-2.5 overflow-hidden text-left p-1.5 rounded-2xl hover:bg-slate-200/50 transition-all cursor-pointer group/switcher flex-1 min-w-0"
            title="คลิกเพื่อสลับร้านค้า / เลือกระบบ"
          >
            {/* Store Logo or Default Circular Logo */}
            <div className="w-8 h-8 rounded-full items-center justify-center shrink-0 overflow-hidden bg-slate-900 text-white border border-slate-200/80 p-0.5 flex shadow-2xs">
              {activeStore?.logo_url ? (
                <img
                  src={activeStore.logo_url}
                  alt={activeStore.name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <img
                  src="/images/logo_ss.png"
                  alt="SmartStock Logo"
                  className="w-full h-full object-contain invert"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 tracking-tight text-sm flex items-center gap-1.5 whitespace-nowrap">
                <span>SmartStock</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover/switcher:text-slate-700 transition-transform duration-200 ${
                    isStoreDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <div className="text-[11px] text-slate-400 font-normal whitespace-nowrap truncate flex items-center gap-1">
                {activeStore ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="truncate">{activeStore.name}</span>
                  </>
                ) : (
                  <span>Enterprise</span>
                )}
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
            title={activeStore ? `สลับร้าน: ${activeStore.name}` : 'สลับร้าน'}
            className="w-9 h-9 rounded-full items-center justify-center shrink-0 hover:scale-105 transition-transform overflow-hidden bg-slate-900 text-white border border-slate-200 p-0.5 flex cursor-pointer"
          >
            {activeStore?.logo_url ? (
              <img
                src={activeStore.logo_url}
                alt={activeStore.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <img
                src="/images/logo_ss.png"
                alt="SmartStock Logo"
                className="w-full h-full object-contain invert"
              />
            )}
          </button>
        )}

        {/* Toggle Collapse button */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? 'ขยายแถบเมนู' : 'ย่อเมนูเหลือแต่ไอคอน'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0 cursor-pointer ml-1"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Store Quick Switcher Dropdown Modal / Popover */}
        {isStoreDropdownOpen && (
          <div
            className={`absolute top-full z-50 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 animate-scale-in ${
              isCollapsed ? 'left-2 w-64' : 'left-3 right-3'
            }`}
          >
            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                สลับร้านค้า / เลือกระบบ
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                {stores.length} ร้าน
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
              {stores.map((s) => {
                const isCurrent = s.id === activeStore?.id;
                const SIcon = getStoreIcon(s.type);
                const sColor = s.theme_color || '#059669';

                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStore(s)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-50 border border-slate-200 font-medium text-slate-900'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/80"
                      style={{ backgroundColor: `${sColor}15` }}
                    >
                      {s.logo_url ? (
                        <img
                          src={s.logo_url}
                          alt={s.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <SIcon className="w-3.5 h-3.5" style={{ color: sColor }} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-800 truncate flex items-center gap-1.5">
                        <span className="truncate">{s.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-normal px-1 py-0.2 rounded bg-slate-200 text-slate-700">
                            ปัจจุบัน
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-normal">
                        {getStoreTypeName(s.type)}
                      </div>
                    </div>

                    {isCurrent && (
                      <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5 mt-1 border-t border-slate-100 px-2 flex flex-col gap-1">
              <Link
                href="/settings/stores"
                onClick={() => setIsStoreDropdownOpen(false)}
                className="flex items-center gap-2 p-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มร้านใหม่ / จัดการสิทธิ์ร้านค้า</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links (Filtered by Store Menu Mask AND User Role) */}
      <div className={`flex-1 overflow-y-auto no-scrollbar py-3 space-y-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => {
            if (!isModuleEnabled(item.moduleKey)) return false;
            if (!isRoleAllowed(item.allowedRoles)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-0.5">
              {!isCollapsed ? (
                <div className="px-3 text-[11px] font-normal tracking-wider text-slate-400 uppercase truncate mb-1">
                  {section.title}
                </div>
              ) : (
                <div className="w-6 h-0.5 bg-slate-100 mx-auto my-1.5 rounded-full" />
              )}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const customLabels = (activeStore?.menu_config as any)?.custom_labels || {};
                  const customIcons = (activeStore?.menu_config as any)?.custom_icons || {};

                  const customIconKey = customIcons[item.moduleKey];
                  const Icon = (customIconKey && ICON_MAP[customIconKey]) ? ICON_MAP[customIconKey] : item.icon;
                  const displayLabel = customLabels[item.moduleKey] || item.label;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? displayLabel : undefined}
                      className={`flex items-center text-sm transition-all duration-150 group relative ${
                        isCollapsed
                          ? 'justify-center p-2.5 rounded-2xl mx-1'
                          : 'justify-between px-3.5 py-2.5 rounded-2xl'
                      } ${
                        isActive
                          ? 'skeuo-card text-slate-900 font-semibold shadow-xs border border-slate-300/80 bg-white'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium'
                      }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                        <div
                          className={`flex items-center justify-center transition-colors ${
                            isActive
                              ? 'text-slate-900'
                              : 'text-slate-500 group-hover:text-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                        {!isCollapsed && <span className="truncate">{displayLabel}</span>}
                      </div>

                      {/* Badges and Alerts for Expanded View */}
                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.highlight && !isActive && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
                            </span>
                          )}
                          {item.alertCount && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full skeuo-inset text-rose-700 font-semibold">
                              {item.alertCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Small Dot Indicator for Collapsed View */}
                      {isCollapsed && (item.alertCount || (item.highlight && !isActive)) && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
                      )}

                      {/* Hover Tooltip when Collapsed */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-normal rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap flex items-center gap-2">
                          <span>{displayLabel}</span>
                          {item.alertCount && (
                            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-normal">
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

      {/* Role Simulation Switcher for Testing (only when expanded) */}
      {!isCollapsed && (
        <div className="px-3 py-2.5 border-t border-slate-300/60 bg-transparent">
          <div className="flex items-center justify-between text-xs font-normal text-slate-500 mb-1.5">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              จำลองมุมมอง:
            </span>
            {simulatedRole && (
              <button
                onClick={() => setSimulatedRole(null)}
                className="text-[11px] text-slate-700 hover:underline font-medium cursor-pointer"
              >
                รีเซ็ต
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {SIMULATE_ROLES.map((r) => {
              const isActive = effectiveRole === r;
              return (
                <button
                  key={r}
                  onClick={() => setSimulatedRole(r === actualRole ? null : r)}
                  className={`py-1.5 text-xs font-medium rounded-xl transition-all capitalize cursor-pointer ${
                    isActive
                      ? 'skeuo-card text-slate-900 bg-white shadow-2xs font-semibold'
                      : 'skeuo-inset text-slate-600 hover:text-slate-900'
                  }`}
                  title={`ดูเมนูในมุมมอง ${ROLE_DISPLAY_NAMES[r]}`}
                >
                  {r === 'admin' ? 'Admin' : r === 'manager' ? 'Mgr' : r === 'chef' ? 'Chef' : r === 'cashier' ? 'POS' : 'Staff'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer User Info & Logout Button */}
      <div className={`p-3 border-t border-slate-300/60 ${isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'}`}>
        {!isCollapsed ? (
          <div className="p-2.5 rounded-2xl skeuo-card flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full skeuo-inset text-slate-700 flex items-center justify-center font-medium text-xs shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {user?.name || 'ผู้ใช้'}
                </div>
                <div className="text-xs text-slate-500 truncate font-normal">
                  {ROLE_DISPLAY_NAMES[effectiveRole] ?? effectiveRole}
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="ออกจากระบบ"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              title={`${user?.name || 'ผู้ใช้'} (${ROLE_DISPLAY_NAMES[effectiveRole] ?? effectiveRole})`}
              className="w-9 h-9 rounded-full skeuo-inset text-slate-700 flex items-center justify-center font-medium text-xs shrink-0 cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
            </div>
            <button
              onClick={() => logout()}
              title="ออกจากระบบ"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
