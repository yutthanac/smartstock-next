'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  HelpCircle,
  AlertOctagon,
  Search,
  Filter,
  DollarSign,
  ArrowUpDown,
  BookOpen,
  Info,
  ChevronRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { MenuItem, DashboardKPI } from '@/types';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { PriceAdjustModal } from './PriceAdjustModal';

export type BcgQuadrant = 'star' | 'cash_cow' | 'puzzle' | 'dog';

export interface BcgMenuItem extends MenuItem {
  effectiveVolume: number;
  effectiveMargin: number;
  totalRevenue: number;
  totalProfit: number;
  quadrant: BcgQuadrant;
  quadrantLabel: string;
}

interface BcgMenuMatrixProps {
  menuItems: MenuItem[];
  dashboard?: DashboardKPI;
  onUpdatePrice: (menuId: number, newPrice: number) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

export function BcgMenuMatrix({
  menuItems,
  dashboard,
  onUpdatePrice,
  onShowToast,
}: BcgMenuMatrixProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<BcgQuadrant | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'margin' | 'revenue' | 'profit'>('volume');
  const [sortAsc, setSortAsc] = useState(false);

  // Price adjust modal state
  const [adjustTarget, setAdjustTarget] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate profitability and order counts
  const bcgItems: BcgMenuItem[] = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];

    // Map order counts from dashboard.menu_profitability if available
    const profitMap = new Map<number, { sales_count: number; margin: number }>();
    if (dashboard?.menu_profitability) {
      dashboard.menu_profitability.forEach((p) => {
        profitMap.set(p.id, { sales_count: p.sales_count, margin: p.margin });
      });
    }

    const tempItems = menuItems.map((item) => {
      const pm = profitMap.get(item.id);
      const volume = pm?.sales_count ?? (item.order_count && item.order_count > 0 ? item.order_count : 0);
      const margin = pm?.margin ?? (item.margin_percent && item.margin_percent > 0 ? item.margin_percent : (
        item.price > 0 && item.recipe_cost
          ? Math.round(((item.price - item.recipe_cost) / item.price) * 100)
          : 50
      ));
      const cost = item.recipe_cost || (item.price * (1 - margin / 100));
      const revenue = volume * item.price;
      const profit = volume * Math.max(0, item.price - cost);

      return {
        ...item,
        effectiveVolume: volume,
        effectiveMargin: margin,
        totalRevenue: revenue,
        totalProfit: profit,
        quadrant: 'star' as BcgQuadrant,
        quadrantLabel: '',
      };
    });

    // Calculate dynamic thresholds
    const volumes = tempItems.map((i) => i.effectiveVolume).filter((v) => v > 0);
    const avgVolume = volumes.length > 0
      ? volumes.reduce((a, b) => a + b, 0) / volumes.length
      : 8;
    const volThreshold = Math.max(5, Math.round(avgVolume));
    const marginThreshold = 55; // 55% gross margin standard for cafes

    // Assign quadrant
    return tempItems.map((item) => {
      const isHighVol = item.effectiveVolume >= volThreshold;
      const isHighMargin = item.effectiveMargin >= marginThreshold;

      let quadrant: BcgQuadrant = 'star';
      let quadrantLabel = 'ดาวรุ่ง (Stars)';

      if (isHighVol && isHighMargin) {
        quadrant = 'star';
        quadrantLabel = 'ดาวรุ่ง (Stars)';
      } else if (isHighVol && !isHighMargin) {
        quadrant = 'cash_cow';
        quadrantLabel = 'สินค้าหลัก (Cash Cows)';
      } else if (!isHighVol && isHighMargin) {
        quadrant = 'puzzle';
        quadrantLabel = 'โอกาสเติบโต (Puzzles)';
      } else {
        quadrant = 'dog';
        quadrantLabel = 'สินค้าปรับปรุง (Dogs)';
      }

      return {
        ...item,
        quadrant,
        quadrantLabel,
      };
    });
  }, [menuItems, dashboard]);

  // Quadrant aggregations
  const stats = useMemo(() => {
    const totalRev = bcgItems.reduce((acc, i) => acc + i.totalRevenue, 0) || 1;

    const stars = bcgItems.filter((i) => i.quadrant === 'star');
    const cashCows = bcgItems.filter((i) => i.quadrant === 'cash_cow');
    const puzzles = bcgItems.filter((i) => i.quadrant === 'puzzle');
    const dogs = bcgItems.filter((i) => i.quadrant === 'dog');

    return {
      stars: {
        items: stars,
        count: stars.length,
        revShare: Math.round((stars.reduce((acc, i) => acc + i.totalRevenue, 0) / totalRev) * 100),
      },
      cashCows: {
        items: cashCows,
        count: cashCows.length,
        revShare: Math.round((cashCows.reduce((acc, i) => acc + i.totalRevenue, 0) / totalRev) * 100),
      },
      puzzles: {
        items: puzzles,
        count: puzzles.length,
        revShare: Math.round((puzzles.reduce((acc, i) => acc + i.totalRevenue, 0) / totalRev) * 100),
      },
      dogs: {
        items: dogs,
        count: dogs.length,
        revShare: Math.round((dogs.reduce((acc, i) => acc + i.totalRevenue, 0) / totalRev) * 100),
      },
    };
  }, [bcgItems]);

  // Filtered and sorted list for the table
  const displayedItems = useMemo(() => {
    return bcgItems
      .filter((item) => {
        const matchesQuadrant = selectedQuadrant === 'all' || item.quadrant === selectedQuadrant;
        const matchesSearch =
          !searchQuery.trim() ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesQuadrant && matchesSearch;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === 'volume') {
          valA = a.effectiveVolume;
          valB = b.effectiveVolume;
        } else if (sortBy === 'margin') {
          valA = a.effectiveMargin;
          valB = b.effectiveMargin;
        } else if (sortBy === 'revenue') {
          valA = a.totalRevenue;
          valB = b.totalRevenue;
        } else if (sortBy === 'profit') {
          valA = a.totalProfit;
          valB = b.totalProfit;
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [bcgItems, selectedQuadrant, searchQuery, sortBy, sortAsc]);

  const toggleSort = (field: 'volume' | 'margin' | 'revenue' | 'profit') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 2x2 QUADRANT VISUAL MATRIX
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900">
                การจัดกลุ่มเมนู (วิเคราะห์ยอดขายและกำไร)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                ข้อมูลจริงจากระบบ POS
              </span>
            </div>
            <p className="text-xs text-stone-500 font-normal mt-0.5">
              แบ่งหมวดหมู่เมนูตามยอดขายและอัตรากำไร เพื่อช่วยตัดสินใจโปรโมทหรือปรับราคา
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> แกนตั้ง: ยอดคำสั่งซื้อ
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> แกนนอน: อัตรากำไร (%)
            </span>
          </div>
        </div>

        {/* 2x2 Quadrant Visual Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[380px]">
          {/* Top-Left: Cash Cows (High Volume + Low Margin) */}
          <div
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'cash_cow' ? 'all' : 'cash_cow')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedQuadrant === 'cash_cow'
                ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-xs'
                : 'bg-sky-50/40 border-sky-200/70 hover:bg-sky-50/70 hover:border-sky-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-bold text-xs">
                  สินค้าหลัก (Cash Cows)
                </span>
                <span className="text-xs font-mono font-bold text-sky-800">
                  {stats.cashCows.count} เมนู ({stats.cashCows.revShare}% รายได้)
                </span>
              </div>
              <p className="text-[11px] text-sky-800/80 mt-2 leading-relaxed">
                ขายดี ยอดสั่งเยอะ แต่กำไรต่อแก้วปานกลาง ช่วยดึงลูกค้าเข้าร้าน
              </p>

              {/* Sample Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {stats.cashCows.items.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-sky-200 text-xs font-semibold text-stone-800 shadow-2xs"
                  >
                    <span>{m.name}</span>
                    <span className="text-[10px] text-sky-700 font-mono">฿{m.price}</span>
                  </span>
                ))}
                {stats.cashCows.count > 4 && (
                  <span className="text-[11px] text-sky-600 font-medium self-center">
                    +{stats.cashCows.count - 4} รายการ
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-sky-200/50 flex items-center justify-between text-[11px] text-sky-900">
              <span className="font-semibold">กลยุทธ์: แนะนำขายคู่กับเบเกอรี่หรือของทานเล่น เพื่อเพิ่มกำไรต่อบิล</span>
              <ChevronRight className="w-3.5 h-3.5 text-sky-500" />
            </div>
          </div>

          {/* Top-Right: Stars (High Volume + High Margin) */}
          <div
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'star' ? 'all' : 'star')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedQuadrant === 'star'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                : 'bg-amber-50/40 border-amber-200/70 hover:bg-amber-50/70 hover:border-amber-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-bold text-xs">
                  ดาวรุ่ง (Stars)
                </span>
                <span className="text-xs font-mono font-bold text-amber-900">
                  {stats.stars.count} เมนู ({stats.stars.revShare}% รายได้)
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 mt-2 leading-relaxed">
                เมนูพระเอก ขายดีและได้กำไรต่อแก้วสูงที่สุดของร้าน
              </p>

              {/* Sample Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {stats.stars.items.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-amber-200 text-xs font-semibold text-stone-900 shadow-2xs"
                  >
                    <span>{m.name}</span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">มาร์จิ้น {m.effectiveMargin}%</span>
                  </span>
                ))}
                {stats.stars.count > 4 && (
                  <span className="text-[11px] text-amber-700 font-medium self-center">
                    +{stats.stars.count - 4} รายการ
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-amber-200/50 flex items-center justify-between text-[11px] text-amber-900">
              <span className="font-semibold">กลยุทธ์: รักษามาตรฐานให้คงที่ แนะนำชวนลูกค้าเพิ่มไซส์หรือท็อปปิ้ง</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>

          {/* Bottom-Left: Dogs (Low Volume + Low Margin) */}
          <div
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'dog' ? 'all' : 'dog')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedQuadrant === 'dog'
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 shadow-xs'
                : 'bg-rose-50/30 border-rose-200/60 hover:bg-rose-50/60 hover:border-rose-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-bold text-xs">
                  สินค้าปรับปรุง (Dogs)
                </span>
                <span className="text-xs font-mono font-bold text-rose-800">
                  {stats.dogs.count} เมนู ({stats.dogs.revShare}% รายได้)
                </span>
              </div>
              <p className="text-[11px] text-rose-900/80 mt-2 leading-relaxed">
                ยอดขายน้อยและกำไรต่ำ เสี่ยงวัตถุดิบค้างสต็อกและเปลืองพื้นที่จัดเก็บ
              </p>

              {/* Sample Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {stats.dogs.items.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-rose-200 text-xs font-semibold text-stone-700 shadow-2xs"
                  >
                    <span>{m.name}</span>
                    <span className="text-[10px] text-rose-600 font-mono">฿{m.price}</span>
                  </span>
                ))}
                {stats.dogs.count > 4 && (
                  <span className="text-[11px] text-rose-600 font-medium self-center">
                    +{stats.dogs.count - 4} รายการ
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-rose-200/50 flex items-center justify-between text-[11px] text-rose-900">
              <span className="font-semibold">กลยุทธ์: ปรับสูตรลดต้นทุน จัดโปรระบายของ หรือพิจารณาตัดออก</span>
              <ChevronRight className="w-3.5 h-3.5 text-rose-500" />
            </div>
          </div>

          {/* Bottom-Right: Puzzles / Question Marks (Low Volume + High Margin) */}
          <div
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'puzzle' ? 'all' : 'puzzle')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedQuadrant === 'puzzle'
                ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300 shadow-xs'
                : 'bg-purple-50/30 border-purple-200/60 hover:bg-purple-50/60 hover:border-purple-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold text-xs">
                  โอกาสเติบโต (Puzzles)
                </span>
                <span className="text-xs font-mono font-bold text-purple-800">
                  {stats.puzzles.count} เมนู ({stats.puzzles.revShare}% รายได้)
                </span>
              </div>
              <p className="text-[11px] text-purple-900/80 mt-2 leading-relaxed">
                กำไรต่อแก้วสูงมาก แต่ลูกค้ารู้จักน้อย มีโอกาสดันให้ขายดียิ่งขึ้น
              </p>

              {/* Sample Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {stats.puzzles.items.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-purple-200 text-xs font-semibold text-stone-800 shadow-2xs"
                  >
                    <span>{m.name}</span>
                    <span className="text-[10px] text-purple-700 font-mono font-bold">มาร์จิ้น {m.effectiveMargin}%</span>
                  </span>
                ))}
                {stats.puzzles.count > 4 && (
                  <span className="text-[11px] text-purple-600 font-medium self-center">
                    +{stats.puzzles.count - 4} รายการ
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-purple-200/50 flex items-center justify-between text-[11px] text-purple-900">
              <span className="font-semibold">กลยุทธ์: ทำป้ายแนะนำหน้าร้าน หรือนำขึ้นเป็นเมนูแนะนำบน POS</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FILTERABLE & SEARCHABLE BCG TABLE
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Toolbar & Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/40">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { key: 'all', label: `ทั้งหมด (${bcgItems.length})` },
              { key: 'star', label: `ดาวรุ่ง Stars (${stats.stars.count})` },
              { key: 'cash_cow', label: `สินค้าหลัก Cash Cows (${stats.cashCows.count})` },
              { key: 'puzzle', label: `โอกาสเติบโต Puzzles (${stats.puzzles.count})` },
              { key: 'dog', label: `ปรับปรุง Dogs (${stats.dogs.count})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedQuadrant(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedQuadrant === tab.key
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเมนู หรือหมวด..."
              className="w-full pl-8 pr-3 py-1.5 text-xs text-stone-800 bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:border-stone-900"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 text-[11px] text-stone-500 font-semibold bg-stone-50/60">
                <th className="py-3 px-4">ชื่อเมนู</th>
                <th className="py-3 px-3">หมวดหมู่</th>
                <th className="py-3 px-3 cursor-pointer hover:text-stone-900" onClick={() => toggleSort('revenue')}>
                  <div className="flex items-center gap-1">
                    <span>ราคาขาย</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th className="py-3 px-3">ต้นทุน BOM</th>
                <th className="py-3 px-3 cursor-pointer hover:text-stone-900" onClick={() => toggleSort('margin')}>
                  <div className="flex items-center gap-1">
                    <span>มาร์จิ้น (%)</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-stone-900" onClick={() => toggleSort('volume')}>
                  <div className="flex items-center gap-1">
                    <span>ยอดขาย (แก้ว)</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th className="py-3 px-3">กลุ่ม BCG Matrix</th>
                <th className="py-3 px-4 text-right">ดำเนินการด่วน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 text-xs">
                    ไม่พบรายการเมนูที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                displayedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      <div>
                        <span>{item.name}</span>
                        {item.description && (
                          <p className="text-[10px] text-stone-400 font-normal truncate max-w-xs">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-500">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-medium text-stone-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-stone-900">
                      ฿{item.price.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-500">
                      ฿{(item.recipe_cost || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-mono font-bold ${
                        item.effectiveMargin >= 65
                          ? 'text-emerald-700'
                          : item.effectiveMargin >= 50
                          ? 'text-amber-700'
                          : 'text-rose-600'
                      }`}>
                        {item.effectiveMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-stone-800">
                      {item.effectiveVolume}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.quadrant === 'star'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : item.quadrant === 'cash_cow'
                            ? 'bg-sky-100 text-sky-900 border border-sky-200'
                            : item.quadrant === 'puzzle'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-rose-100 text-rose-900 border border-rose-200'
                        }`}
                      >
                        {item.quadrantLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdjustTarget(item);
                          setIsModalOpen(true);
                        }}
                        icon={<Zap className="w-3 h-3 text-amber-600" />}
                        className="rounded-xl text-[11px] py-1 px-2.5 border-stone-200 hover:bg-stone-100"
                      >
                        ปรับราคา
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Adjust Modal */}
      <PriceAdjustModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menuItem={adjustTarget}
        recommendedPrice={adjustTarget ? adjustTarget.price + 10 : undefined}
        reason="ปรับราคาเพื่อให้ได้กำไรที่เหมาะสม โดยยังคงความคุ้มค่าสำหรับลูกค้า"
        onConfirm={async (id, p) => {
          const ok = await onUpdatePrice(id, p);
          if (ok) {
            onShowToast(`ปรับราคา "${adjustTarget?.name}" เป็น ฿${p} เรียบร้อยแล้ว`);
          }
          return ok;
        }}
      />
    </div>
  );
}
