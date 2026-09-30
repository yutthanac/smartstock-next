'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth, StoreInfo } from '@/lib/AuthContext';
import { useSidebar } from '@/lib/SidebarContext';
import { ICON_MAP } from '@/app/(app)/settings/components/iconMap';

export interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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

import { getRoleDisplayName } from '@/lib/role-utils';

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { dashboard } = useStock();
  const { user, logout, hasPermission, hasRole, activeStore, stores, setActiveStore } = useAuth();
  const sidebarContext = useSidebar();
  const isMobileOpen = mobileOpen !== undefined ? mobileOpen : sidebarContext.isMobileOpen;
  const closeMobileSidebar = onMobileClose || sidebarContext.closeMobileSidebar;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    closeMobileSidebar();
  }, [pathname]);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStoreDropdownOpen(false);
        setStoreSearchQuery('');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStoreDropdownOpen) {
        setIsStoreDropdownOpen(false);
        setStoreSearchQuery('');
      }
    };
    if (isStoreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
    setStoreSearchQuery('');
    router.push('/dashboard');
  };

  const isModuleEnabled = (moduleKey?: string): boolean => {
    if (!moduleKey) return true;
    if (!activeStore?.menu_config) return true;
    return activeStore.menu_config[moduleKey] !== false;
  };

  // Determine Effective Role
  const isSystemAdmin = user?.role === 'admin' || user?.roles?.includes('admin') || user?.username === 'admin';
  const effectiveRole = isSystemAdmin
    ? 'admin'
    : (activeStore?.my_role || (user?.roles?.[0] as string) || user?.role || 'owner');

  const isItemPermitted = (item: NavItem): boolean => {
    // System admin or owner has master access to everything
    if (effectiveRole === 'admin' || effectiveRole === 'owner') return true;
    if (user?.permissions?.includes('all')) return true;

    // Check specific requiredPermission
    if (item.requiredPermission) {
      if (user?.permissions && user.permissions.length > 0) {
        return user.permissions.includes(item.requiredPermission);
      }
    }

    return item.allowedRoles.includes(effectiveRole);
  };

  const themeColor = activeStore?.theme_color || '#059669';

  // Complete Menu Hierarchy with Role Mapping & Store Module Keys
  const menuSections: NavSection[] = React.useMemo(() => [
    {
      title: 'ภาพรวม',
      items: [
        {
          label: 'แดชบอร์ด',
          href: '/dashboard',
          icon: LayoutDashboard,
          moduleKey: 'dashboard',
          requiredPermission: 'dashboard.view',
          allowedRoles: ['admin', 'owner', 'manager'],
        },
      ],
    },
    {
      title: 'การขาย',
      items: [
        {
          label: 'ขายหน้าร้าน',
          href: '/sales/pos',
          icon: Store,
          badge: 'Active',
          moduleKey: 'pos',
          requiredPermission: 'pos.order',
          allowedRoles: ['admin', 'owner', 'manager', 'cashier', 'staff'],
        },
        {
          label: 'ประวัติออเดอร์',
          href: '/sales/orders',
          icon: Receipt,
          moduleKey: 'orders',
          requiredPermission: 'pos.order',
          allowedRoles: ['admin', 'owner', 'manager', 'cashier', 'staff'],
        },
      ],
    },
    {
      title: 'คลังสินค้า',
      items: [
        {
          label: 'จัดการสต็อกวัตถุดิบ',
          href: '/stock',
          icon: Boxes,
          alertCount: dashboard.low_stock_count > 0 ? dashboard.low_stock_count : undefined,
          moduleKey: 'stock',
          requiredPermission: 'inventory.view',
          allowedRoles: ['admin', 'owner', 'manager', 'chef'],
        },
        {
          label: 'รายการซื้อของ & ใบเสร็จ',
          href: '/stock/purchase-orders',
          icon: ShoppingBag,
          moduleKey: 'purchase_orders',
          requiredPermission: 'inventory.view',
          allowedRoles: ['admin', 'owner', 'manager', 'chef', 'cashier', 'staff'],
        },
      ],
    },
    {
      title: 'เมนู & สูตร',
      items: [
        {
          label: 'จัดการเมนู',
          href: '/menu',
          icon: UtensilsCrossed,
          moduleKey: 'menu',
          requiredPermission: 'menu.view',
          allowedRoles: ['admin', 'owner', 'manager', 'chef', 'cashier'],
        },
        {
          label: 'AI แนะนำเมนู',
          href: '/menu/ai-insights',
          icon: Sparkles,
          highlight: true,
          moduleKey: 'ai_insights',
          requiredPermission: 'menu.view',
          allowedRoles: ['admin', 'owner', 'manager', 'chef'],
        },
      ],
    },
    {
      title: 'รายงาน',
      items: [
        {
          label: 'รายงานยอดขาย',
          href: '/reports/sales',
          icon: BarChart3,
          moduleKey: 'reports_sales',
          requiredPermission: 'reports.view',
          allowedRoles: ['admin', 'owner', 'manager'],
        },
        {
          label: 'ต้นทุน & กำไร',
          href: '/reports/profit',
          icon: TrendingUp,
          moduleKey: 'reports_profit',
          requiredPermission: 'reports.view',
          allowedRoles: ['admin', 'owner', 'manager'],
        },
      ],
    },
    {
      title: 'จัดการระบบ',
      items: [
        {
          label: 'รายชื่อพนักงาน',
          href: '/staff',
          icon: Users,
          moduleKey: 'staff',
          requiredPermission: 'system.users',
          allowedRoles: ['admin', 'owner', 'manager', 'chef', 'cashier', 'staff'],
        },
        {
          label: 'กำหนดสิทธิ์บทบาท',
          href: '/roles',
          icon: ShieldCheck,
          moduleKey: 'roles',
          requiredPermission: 'system.roles',
          allowedRoles: ['admin', 'owner'],
        },
        {
          label: 'ตั้งค่าระบบ',
          href: '/settings',
          icon: Settings,
          moduleKey: 'settings',
          requiredPermission: 'system.settings',
          allowedRoles: ['admin'],
        },
      ],
    },
  ], [dashboard.low_stock_count]);

  // Store search & filtering
  const filteredStores = useMemo(() => {
    if (!storeSearchQuery.trim()) return stores;
    const q = storeSearchQuery.trim().toLowerCase();
    return stores.filter((s) => {
      const nameMatch = s.name?.toLowerCase().includes(q);
      const typeMatch = getStoreTypeName(s.type)?.toLowerCase().includes(q) || s.type?.toLowerCase().includes(q);
      const descMatch = s.description?.toLowerCase().includes(q);
      const addressMatch = s.address?.toLowerCase().includes(q);
      return Boolean(nameMatch || typeMatch || descMatch || addressMatch);
    });
  }, [stores, storeSearchQuery]);

  // Store switching and search allowed for admin, owner, or whenever stores exist
  const canSwitchStore = Boolean(
    hasRole('admin') ||
    user?.role === 'admin' ||
    effectiveRole === 'admin' ||
    effectiveRole === 'owner' ||
    hasRole('owner') ||
    user?.role === 'owner' ||
    stores.length > 0
  );

  return (
    <>
      <aside
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } shrink-0 hidden md:flex flex-col bg-slate-50 border-r border-slate-200/80 transition-[width] duration-300 ease-in-out sticky top-0 h-screen z-30 select-none print:hidden`}
      >
      {/* Top brand header & Store Switcher */}
      <div
        ref={dropdownRef}
        className="h-16 flex items-center justify-between px-3 border-b border-slate-200/80 relative"
      >
        {/* Store Logo Switcher Button (Logo only - no name) */}
        <button
          type="button"
          onClick={() => {
            if (canSwitchStore) {
              const nextState = !isStoreDropdownOpen;
              setIsStoreDropdownOpen(nextState);
              if (nextState) {
                setStoreSearchQuery('');
                setTimeout(() => searchInputRef.current?.focus(), 80);
              }
            }
          }}
          disabled={!canSwitchStore}
          className={`flex items-center gap-1.5 p-1 rounded-2xl transition-all ${
            canSwitchStore
              ? 'hover:bg-slate-200/60 cursor-pointer group/switcher'
              : 'cursor-default'
          }`}
          title={
            canSwitchStore
              ? `สลับร้านค้า (${activeStore?.name || 'ร้านค้า'})`
              : (activeStore?.name || 'ร้านค้า')
          }
        >
          {/* Store Logo Avatar */}
          <div className="w-10 h-10 rounded-2xl items-center justify-center shrink-0 overflow-hidden bg-white text-slate-900 border border-slate-200 p-0.5 flex shadow-2xs group-hover/switcher:border-slate-300 group-hover/switcher:shadow-xs group-hover/switcher:scale-105 transition-all">
            {activeStore?.logo_url ? (
              <img
                src={activeStore.logo_url}
                alt={activeStore.name}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <img
                src="/images/logo_ss.png"
                alt="SmartStock Logo"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Subtle dropdown indicator when not collapsed */}
          {!isCollapsed && canSwitchStore && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 group-hover/switcher:text-slate-700 transition-colors">
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isStoreDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          )}
        </button>

        {/* Toggle Collapse button */}
        <button
          type="button"
          onClick={toggleCollapse}
          title={isCollapsed ? 'ขยายแถบเมนู' : 'ย่อเมนูเหลือแต่ไอคอน'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0 cursor-pointer ml-1"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Store Quick Switcher & Search Dropdown Modal / Popover */}
        {isStoreDropdownOpen && canSwitchStore && (
          <div
            className={`absolute top-full z-50 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 animate-scale-in w-72 ${
              isCollapsed ? 'left-2' : 'left-2'
            }`}
          >
            {/* Header with store count */}
            <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                <span>เลือกร้านค้า</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono font-medium">
                {stores.length} ร้าน
              </span>
            </div>

            {/* Stores List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 no-scrollbar">
              {filteredStores.length > 0 ? (
                filteredStores.map((s) => {
                  const isCurrent = s.id === activeStore?.id;
                  const SIcon = getStoreIcon(s.type);
                  const sColor = s.theme_color || '#059669';

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStore(s)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-stone-100 border border-stone-200/90 font-medium text-stone-900 shadow-2xs'
                          : 'hover:bg-stone-50 text-stone-600 border border-transparent'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-stone-200 bg-white shadow-2xs"
                        style={{ backgroundColor: `${sColor}10` }}
                      >
                        {s.logo_url ? (
                          <img
                            src={s.logo_url}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <SIcon className="w-4 h-4" style={{ color: sColor }} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-stone-900 truncate flex items-center gap-1.5">
                          <span className="truncate">{s.name}</span>
                          {isCurrent && (
                            <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full font-medium border border-emerald-200 shrink-0">
                              ร้านนี้
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">
                          {getStoreTypeName(s.type)}
                        </div>
                      </div>

                      {isCurrent && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center px-4">
                  <Store className="w-6 h-6 text-stone-300 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-stone-600">ไม่พบร้านค้าที่ค้นหา</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    ลองค้นหาด้วยชื่อหรือประเภทอื่น
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links (Filtered by Store Menu Mask AND User Role) */}
      <div className={`flex-1 overflow-y-auto no-scrollbar py-3 space-y-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => {
            if (!isModuleEnabled(item.moduleKey)) return false;
            if (!isItemPermitted(item)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-0.5">
              {!isCollapsed ? (
                <div className="px-3 text-xs font-semibold tracking-wider text-stone-400 uppercase truncate mb-1">
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
                      prefetch={true}
                      title={isCollapsed ? displayLabel : undefined}
                      className={`flex items-center text-sm transition-all duration-150 group relative ${
                        isCollapsed
                          ? 'justify-center p-2.5 rounded-2xl mx-1'
                          : 'justify-between px-3.5 py-2.5 rounded-2xl'
                      } ${
                        isActive
                          ? 'bg-stone-900 text-white font-semibold shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 font-medium'
                      }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                        <div
                          className={`flex items-center justify-center transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-stone-400 group-hover:text-stone-700'
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
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
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
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-stone-900 text-white text-xs font-normal rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap flex items-center gap-2">
                          <span>{displayLabel}</span>
                          {item.alertCount && (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-xs font-semibold">
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
      <div className={`p-3 border-t border-slate-100 ${isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'}`}>
        {!isCollapsed ? (
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-medium text-xs shrink-0 overflow-hidden shadow-2xs">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {user?.name || 'ผู้ใช้'}
                </div>
                <div className="text-xs text-slate-400 truncate font-normal">
                  {getRoleDisplayName(effectiveRole, undefined, activeStore?.type)}
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="ออกจากระบบ"
              className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              title={`${user?.name || 'ผู้ใช้'} (${getRoleDisplayName(effectiveRole, undefined, activeStore?.type)})`}
              className="w-9 h-9 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-medium text-xs shrink-0 cursor-pointer overflow-hidden shadow-2xs"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </div>
            <button
              onClick={() => logout()}
              title="ออกจากระบบ"
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>

    {/* Mobile Drawer (Visible on screens < lg when isMobileOpen is true) */}
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
        isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
    >
      {/* Dark Backdrop */}
      <div
        onClick={closeMobileSidebar}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Drawer Slide-out Panel */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out z-10 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header with Close Button */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full items-center justify-center shrink-0 overflow-hidden bg-white text-slate-900 border border-slate-200 p-0.5 flex shadow-2xs">
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
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 text-sm truncate">
                {activeStore?.name || 'SmartStock'}
              </div>
              {activeStore?.type && (
                <div className="text-xs text-stone-500 truncate font-medium">
                  {getStoreTypeName(activeStore.type)}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={closeMobileSidebar}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar">
          {menuSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => {
              if (!isModuleEnabled(item.moduleKey)) return false;
              if (!isItemPermitted(item)) return false;
              return true;
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 text-xs font-semibold text-stone-400 tracking-wider uppercase">
                  {section.title}
                </div>
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
                        prefetch={true}
                        onClick={closeMobileSidebar}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-stone-900 text-white shadow-xs font-semibold'
                            : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-stone-400'
                            }`}
                          />
                          <span className="truncate">{displayLabel}</span>
                        </div>
                        {item.alertCount && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                            {item.alertCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer User Info Footer */}
        <div className="p-3 border-t border-stone-200 bg-stone-50/50">
          <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-medium text-xs shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-800 truncate">
                  {user?.name || 'ผู้ใช้'}
                </div>
                <div className="text-xs text-stone-500 truncate font-normal">
                  {getRoleDisplayName(effectiveRole, undefined, activeStore?.type)}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                closeMobileSidebar();
                logout();
              }}
              title="ออกจากระบบ"
              className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
  );
};
