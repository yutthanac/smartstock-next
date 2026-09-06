'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  Save,
  RotateCcw,
  Sparkles,
  Coffee,
  Cookie,
  CheckCircle2,
  X,
  Store as StoreIcon,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { ICON_MAP, AVAILABLE_ICONS } from './iconMap';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface MenuItemDef {
  key: string;
  defaultLabel: string;
  defaultIcon: string;
  category: string;
}

export const MENU_ITEMS: MenuItemDef[] = [
  { key: 'dashboard',       defaultLabel: 'แดชบอร์ด',               defaultIcon: 'LayoutDashboard', category: 'ภาพรวม' },
  { key: 'pos',             defaultLabel: 'ขายหน้าร้าน',            defaultIcon: 'Store',           category: 'การขาย' },
  { key: 'orders',          defaultLabel: 'ประวัติออเดอร์',         defaultIcon: 'Receipt',         category: 'การขาย' },
  { key: 'stock',           defaultLabel: 'จัดการสต็อก',           defaultIcon: 'Boxes',           category: 'คลังสินค้า' },
  { key: 'ingredients',     defaultLabel: 'วัตถุดิบทั้งหมด',        defaultIcon: 'Carrot',          category: 'คลังสินค้า' },
  { key: 'purchase_orders', defaultLabel: 'รายการซื้อของ/จ่ายตลาด', defaultIcon: 'ShoppingBag',     category: 'คลังสินค้า' },
  { key: 'menu',            defaultLabel: 'จัดการเมนู',            defaultIcon: 'UtensilsCrossed', category: 'เมนู' },
  { key: 'ai_insights',     defaultLabel: 'AI แนะนำเมนู',          defaultIcon: 'Sparkles',        category: 'เมนู' },
  { key: 'reports_sales',   defaultLabel: 'รายงานยอดขาย',          defaultIcon: 'BarChart3',       category: 'รายงาน' },
  { key: 'reports_profit',  defaultLabel: 'ต้นทุน & กำไร',         defaultIcon: 'TrendingUp',      category: 'รายงาน' },
  { key: 'staff',           defaultLabel: 'รายชื่อพนักงาน',        defaultIcon: 'Users',           category: 'ระบบ' },
  { key: 'roles',           defaultLabel: 'กำหนดสิทธิ์บทบาท',      defaultIcon: 'ShieldCheck',     category: 'ระบบ' },
  { key: 'settings',        defaultLabel: 'ตั้งค่าระบบ',           defaultIcon: 'Settings',        category: 'ระบบ' },
];

const PRESETS = {
  cafe: {
    labels: {
      pos: 'ออเดอร์หน้าร้าน (Cafe POS)',
      orders: 'ประวัติบิลเครื่องดื่ม',
      stock: 'สต็อกเมล็ด & วัตถุดิบ',
      ingredients: 'เมล็ดกาแฟ, นม & ไซรัป',
      menu: 'เมนูเครื่องดื่ม & เบเกอรี่',
      ai_insights: 'AI แนะนำเครื่องดื่ม',
      purchase_orders: 'สั่งซื้อของเข้าร้าน',
    },
    icons: {
      pos: 'CupSoda',
      orders: 'Receipt',
      stock: 'Package',
      ingredients: 'Milk',
      menu: 'Coffee',
      ai_insights: 'Sparkles',
      purchase_orders: 'ShoppingBag',
    },
    publish: {
      purchase_orders: false,
      roles: false,
    },
  },
  bakery: {
    labels: {
      pos: 'ขายหน้าร้าน (Bakery POS)',
      orders: 'ประวัติออเดอร์ขนม',
      stock: 'สต็อกขนมอบ & วัตถุดิบ',
      ingredients: 'แป้ง, เนย & ส่วนผสมขนม',
      menu: 'เมนูเค้ก & เบเกอรี่',
      purchase_orders: 'สั่งซื้อวัตถุดิบทำขนม',
    },
    icons: {
      pos: 'Cookie',
      orders: 'Receipt',
      stock: 'Boxes',
      ingredients: 'Wheat',
      menu: 'Cake',
      purchase_orders: 'ShoppingBag',
    },
    publish: {
      ai_insights: false,
      roles: false,
    },
  },
};

export default function SidebarCustomizer() {
  const { activeStore, stores, token, refreshStores, setActiveStore } = useAuth();

  const [selectedStoreId, setSelectedStoreId] = useState<number>(activeStore?.id ?? (stores[0]?.id ?? 1));
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({});
  const [publishMap, setPublishMap] = useState<Record<string, boolean>>({});
  const [filterPublish, setFilterPublish] = useState<'all' | 'published' | 'hidden'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Sync selectedStoreId initially
  useEffect(() => {
    if (activeStore?.id && !selectedStoreId) {
      setSelectedStoreId(activeStore.id);
    }
  }, [activeStore?.id]);

  const currentStore = stores.find((s) => s.id === selectedStoreId) || activeStore || stores[0];

  // Load menu config from currentStore
  useEffect(() => {
    const cfg = (currentStore?.menu_config as any) || {};
    setCustomLabels(cfg.custom_labels || {});
    setCustomIcons(cfg.custom_icons || {});

    const pMap: Record<string, boolean> = {};
    MENU_ITEMS.forEach((it) => {
      pMap[it.key] = cfg[it.key] !== false;
    });
    setPublishMap(pMap);
  }, [selectedStoreId, currentStore]);

  // Click outside to close icon picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPickerKey(null);
      }
    };
    if (pickerKey) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [pickerKey]);

  const togglePublish = (key: string) => {
    setPublishMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setLabel = (key: string, val: string) => {
    setCustomLabels((prev) => ({ ...prev, [key]: val }));
  };

  const selectIcon = (key: string, iconKey: string) => {
    setCustomIcons((prev) => ({ ...prev, [key]: iconKey }));
    setPickerKey(null);
  };

  const resetItem = (key: string) => {
    setCustomLabels((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCustomIcons((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPublishMap((prev) => ({ ...prev, [key]: true }));
  };

  const applyPreset = (type: 'cafe' | 'bakery') => {
    const p = PRESETS[type];
    setCustomLabels((prev) => ({ ...prev, ...p.labels }));
    setCustomIcons((prev) => ({ ...prev, ...p.icons }));
    setPublishMap((prev) => ({ ...prev, ...p.publish }));
  };

  const setAllPublish = (status: boolean) => {
    const next: Record<string, boolean> = {};
    MENU_ITEMS.forEach((it) => {
      next[it.key] = status;
    });
    setPublishMap(next);
  };

  const resetAll = () => {
    if (confirm(`คืนค่าเริ่มต้นเมนูทั้งหมดของร้าน "${currentStore?.name}"?`)) {
      setCustomLabels({});
      setCustomIcons({});
      const next: Record<string, boolean> = {};
      MENU_ITEMS.forEach((it) => {
        next[it.key] = true;
      });
      setPublishMap(next);
    }
  };

  const handleSave = async () => {
    if (!currentStore) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const existing = (currentStore.menu_config as any) || {};
      const updatedConfig = {
        ...existing,
        ...publishMap,
        custom_labels: customLabels,
        custom_icons: customIcons,
      };

      const res = await fetch(`${API_BASE_URL}/stores/${currentStore.id}/menu-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ menu_config: updatedConfig }),
      });

      if (res.ok) {
        if (activeStore && activeStore.id === currentStore.id) {
          setActiveStore({ ...activeStore, menu_config: updatedConfig });
        }
        await refreshStores();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'บันทึกไม่สำเร็จ');
      }
    } catch {
      alert('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const publishedCount = Object.values(publishMap).filter(Boolean).length;
  const hiddenCount = MENU_ITEMS.length - publishedCount;

  const categories = Array.from(new Set(MENU_ITEMS.map((it) => it.category)));

  const filteredItems = MENU_ITEMS.filter((item) => {
    const isPub = publishMap[item.key] !== false;
    if (filterPublish === 'published' && !isPub) return false;
    if (filterPublish === 'hidden' && isPub) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* 1. Header & Store Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200"
              style={{ backgroundColor: `${currentStore?.theme_color || '#059669'}15` }}
            >
              {currentStore?.logo_url ? (
                <img src={currentStore.logo_url} alt={currentStore.name} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon className="w-5 h-5" style={{ color: currentStore?.theme_color || '#059669' }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">{currentStore?.name || 'เลือกร้าน'}</h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: currentStore?.theme_color || '#059669' }}
                >
                  {currentStore?.type === 'cafe' ? 'คาเฟ่' : currentStore?.type === 'bakery' ? 'เบเกอรี่' : 'ร้านอาหาร'}
                </span>
                {activeStore?.id === currentStore?.id && (
                  <span className="text-[10px] font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    กำลังใช้งาน
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">เปิด-ปิดเมนู ปรับชื่อ และไอคอนของร้าน</p>
            </div>
          </div>

          {/* Store Switcher */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shrink-0">
            <span className="text-xs font-normal text-slate-600 pl-1">ร้าน:</span>
            <Dropdown
              value={selectedStoreId}
              onChange={(val) => setSelectedStoreId(Number(val))}
              options={stores.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              size="sm"
              buttonClassName="font-normal bg-white border border-slate-300 text-slate-800 rounded-xl"
            />

            {activeStore?.id !== currentStore?.id && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (currentStore) {
                    setActiveStore(currentStore);
                    refreshStores();
                  }
                }}
                className="text-[11px] h-7 px-2.5"
                icon={<ArrowRight className="w-3 h-3" />}
                iconPosition="right"
                title="สลับไปใช้งานร้านนี้"
              >
                สลับใช้ร้านนี้
              </Button>
            )}
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            แม่แบบ:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('cafe')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold hover:bg-amber-100 transition-all cursor-pointer"
          >
            <Coffee className="w-3 h-3 text-amber-600" />
            คาเฟ่
          </button>
          <button
            type="button"
            onClick={() => applyPreset('bakery')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold hover:bg-rose-100 transition-all cursor-pointer"
          >
            <Cookie className="w-3 h-3 text-rose-600" />
            เบเกอรี่
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => setAllPublish(true)}
            className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
          >
            เปิดทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setAllPublish(false)}
            className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
          >
            ปิดทั้งหมด
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            รีเซ็ต
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-normal flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300" />
            <span>บันทึกการตั้งค่าเมนูของร้าน "{currentStore?.name}" เรียบร้อยแล้ว</span>
          </div>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">อัปเดตแล้ว</span>
        </div>
      )}

      {/* 2. Menu Table Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Filters & Save Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterPublish('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-all cursor-pointer ${
                filterPublish === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({MENU_ITEMS.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterPublish('published')}
              className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-all cursor-pointer ${
                filterPublish === 'published'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              เปิดใช้งาน ({publishedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterPublish('hidden')}
              className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-all cursor-pointer ${
                filterPublish === 'hidden'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ซ่อน ({hiddenCount})
            </button>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            isLoading={saving}
            icon={<Save className="w-4 h-4" />}
            size="sm"
          >
            บันทึก
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-slate-400 font-normal flex items-center gap-1 shrink-0 text-[11px]">
            <Filter className="w-3 h-3" />
            หมวดหมู่:
          </span>
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-normal shrink-0 transition-all cursor-pointer ${
              filterCategory === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-normal shrink-0 transition-all cursor-pointer ${
                filterCategory === cat ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Single Column Table with Status on the RIGHT */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-transparent border-b border-slate-200 text-xs font-normal text-slate-700">
                <th className="py-3 px-3 w-10 text-center font-normal">#</th>
                <th className="py-3 px-3 w-28 font-normal">หมวดหมู่</th>
                <th className="py-3 px-3 w-14 text-center font-normal">ไอคอน</th>
                <th className="py-3 px-4 min-w-[200px] font-normal">ชื่อเมนู</th>
                <th className="py-3 px-4 min-w-[170px] font-normal">ตัวอย่าง Sidebar</th>
                <th className="py-3 px-4 w-40 text-center font-normal">สถานะ</th>
                <th className="py-3 px-3 w-20 text-right font-normal">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.map((item, index) => {
                const isPublished = publishMap[item.key] !== false;
                const currentLabel = customLabels[item.key] || item.defaultLabel;
                const currentIconKey = customIcons[item.key] || item.defaultIcon;
                const IconComponent = ICON_MAP[currentIconKey] || ICON_MAP[item.defaultIcon];
                const isCustomized = Boolean(customLabels[item.key] || customIcons[item.key]);

                return (
                  <tr
                    key={item.key}
                    className={`transition-colors relative ${
                      !isPublished
                        ? 'bg-slate-50/70 text-slate-400 hover:bg-slate-100/70'
                        : isCustomized
                        ? 'bg-slate-50/50 hover:bg-slate-50/80 text-slate-700'
                        : 'hover:bg-slate-50/60 text-slate-600'
                    }`}
                  >
                    {/* 1. Index */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {index + 1}
                    </td>

                    {/* 2. Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-normal text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {item.category}
                      </span>
                    </td>

                    {/* 3. Icon */}
                    <td className="py-3 px-3 text-center relative">
                      <div className="flex justify-center relative">
                        <button
                          type="button"
                          onClick={() => setPickerKey(pickerKey === item.key ? null : item.key)}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center hover:scale-105 hover:border-slate-400 transition-all cursor-pointer text-slate-700"
                          title="เปลี่ยนไอคอน"
                        >
                          {IconComponent && (
                            <IconComponent className="w-4 h-4 text-slate-700" />
                          )}
                        </button>

                        {/* Icon Picker Popover */}
                        {pickerKey === item.key && (
                          <div
                            ref={popoverRef}
                            className="absolute left-0 top-11 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 w-72 text-left"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                              <span className="text-xs font-medium text-slate-700">เลือกไอคอน</span>
                              <button
                                type="button"
                                onClick={() => setPickerKey(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto no-scrollbar p-1">
                              {AVAILABLE_ICONS.map((ic) => {
                                const IconEl = ic.icon;
                                const isSelected = currentIconKey === ic.key;

                                return (
                                  <button
                                    key={ic.key}
                                    type="button"
                                    onClick={() => selectIcon(item.key, ic.key)}
                                    className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-slate-900 text-white shadow-xs scale-105'
                                        : 'hover:bg-slate-100 text-slate-600'
                                    }`}
                                    title={ic.label}
                                  >
                                    <IconEl className="w-4 h-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 4. Menu Name Input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={currentLabel}
                        onChange={(e) => setLabel(item.key, e.target.value)}
                        placeholder={item.defaultLabel}
                        className="w-full text-xs font-normal px-3 py-1.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-800"
                      />
                    </td>

                    {/* 5. Live Sidebar Preview */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-normal ${
                          isPublished
                            ? 'bg-slate-100 text-slate-800 border border-slate-200/80 shadow-2xs'
                            : 'bg-slate-100/60 text-slate-400 line-through'
                        }`}
                      >
                        {IconComponent && <IconComponent className="w-3.5 h-3.5 text-slate-600" />}
                        <span className="truncate max-w-[130px]">{currentLabel}</span>
                      </span>
                    </td>

                    {/* 6. STATUS SWITCH (PLACED ON THE RIGHT SIDE) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => togglePublish(item.key)}
                          className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-all"
                        >
                          {/* iOS Toggle Switch */}
                          <div
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                              isPublished ? 'bg-slate-900' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                                isPublished ? 'translate-x-4.5' : 'translate-x-0.5'
                              }`}
                            />
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`text-[11px] font-normal px-2 py-0.5 rounded-lg w-12 text-center ${
                              isPublished
                                ? 'bg-slate-100 text-slate-900 border border-slate-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isPublished ? 'เปิด' : 'ปิด'}
                          </span>
                        </button>
                      </div>
                    </td>

                    {/* 7. Action Reset */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isCustomized ? (
                        <button
                          type="button"
                          onClick={() => resetItem(item.key)}
                          className="text-[11px] font-normal text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="คืนค่าเดิมเฉพาะเมนูนี้"
                        >
                          รีเซ็ต
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-xs">ไม่พบเมนูตามตัวกรอง</div>
        )}

        {/* Bottom Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <Button
            type="button"
            onClick={handleSave}
            isLoading={saving}
            icon={<Save className="w-4 h-4" />}
            size="md"
          >
            บันทึกการตั้งค่า
          </Button>
        </div>
      </div>
    </div>
  );
}
