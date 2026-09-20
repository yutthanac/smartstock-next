'use client';

import React, { useState, useMemo } from 'react';
import {
  Warehouse,
  Package,
  PackagePlus,
  Plus,
  Search,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ArrowRight,
  TrendingDown,
  Edit2,
  Trash2,
  X,
  Clock,
} from 'lucide-react';
import { Ingredient } from '@/types';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Dropdown } from '@/components/Dropdown';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/Table';
import { useStock } from '@/lib/StockContext';

type BackstockIngredient = Ingredient & {
  is_two_tier?: boolean;
  backstock_quantity?: number;
  bar_quantity?: number;
  opened_unit_remaining?: number;
};

interface BackstockTabProps {
  ingredients: BackstockIngredient[];
  onOpenEdit: (item: BackstockIngredient) => void;
  onOpenCreate: () => void;
  onToast: (msg: string) => void;
  onWaste?: (item: BackstockIngredient, tier: 'bar' | 'backstock') => void;
}

export function BackstockTab({
  ingredients,
  onOpenEdit,
  onOpenCreate,
  onToast,
  onWaste,
}: BackstockTabProps) {
  const { openPackage, addBackstock } = useStock();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Receive stock modal state
  const [receivingItem, setReceivingItem] = useState<BackstockIngredient | null>(null);
  const [receiveCount, setReceiveCount] = useState<number | string>(1);
  const [receivePackSize, setReceivePackSize] = useState<number | string>(1);
  const [updateDefaultPackSize, setUpdateDefaultPackSize] = useState(false);
  const [receiveNote, setReceiveNote] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);

  // Filter only 2-tier ingredients (or items with package tracking)
  const backstockItems = useMemo(() => {
    return ingredients.filter(
      (ing) => ing.is_two_tier || (ing.package_unit && (ing.package_size || 0) > 0)
    );
  }, [ingredients]);

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(backstockItems.map((i) => i.category || 'เมล็ดกาแฟ & ชา'))
    );
    return [
      { value: 'all', label: 'ทุกหมวดหมู่' },
      ...cats.map((c) => ({ value: c, label: c })),
    ];
  }, [backstockItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return backstockItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.supplier || '').toLowerCase().includes(search.toLowerCase());
      const matchCat =
        filterCategory === 'all' || item.category === filterCategory;

      const backstockQty = Number(item.backstock_quantity ?? 0);
      let matchStatus = true;
      if (filterStatus === 'ready') {
        matchStatus = backstockQty > 2;
      } else if (filterStatus === 'low') {
        matchStatus = backstockQty > 0 && backstockQty <= 2;
      } else if (filterStatus === 'out') {
        matchStatus = backstockQty <= 0;
      }

      return matchSearch && matchCat && matchStatus;
    });
  }, [backstockItems, search, filterCategory, filterStatus]);

  // Summary KPIs
  const totalPackages = useMemo(() => {
    return backstockItems.reduce(
      (sum, item) => sum + Number(item.backstock_quantity ?? 0),
      0
    );
  }, [backstockItems]);

  const lowBackstockCount = useMemo(() => {
    return backstockItems.filter(
      (item) => Number(item.backstock_quantity ?? 0) <= 2
    ).length;
  }, [backstockItems]);

  const totalBackstockValue = useMemo(() => {
    return backstockItems.reduce((sum, item) => {
      const packQty = Number(item.backstock_quantity ?? 0);
      const packSize = Number(item.package_size || 1);
      const costPerUnit = Number(item.cost_per_unit || 0);
      return sum + packQty * packSize * costPerUnit;
    }, 0);
  }, [backstockItems]);

  // Handle Transfer / Open 1 Package to Front Bar
  const handleTransferToBar = async (item: BackstockIngredient) => {
    const pkgUnit = item.package_unit || 'แพ็ค';
    const currentBack = Number(item.backstock_quantity ?? 0);
    if (currentBack <= 0) {
      alert(`สต็อกหลังร้านของ ${item.name} หมดแล้ว ไม่สามารถจ่ายไปหน้าบาร์ได้`);
      return;
    }

    const success = await openPackage(item.id, 1);
    if (success) {
      onToast(`📦 จ่าย ${item.name} 1 ${pkgUnit} ไปหน้าบาร์แล้ว! (หลังร้านลดเหลือ ${currentBack - 1} ${pkgUnit})`);
    }
  };

  // Handle Receive New Shipment into Backstock
  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingItem) return;

    const count = Number(receiveCount);
    const packSize = Number(receivePackSize);
    if (isNaN(count) || count <= 0) {
      alert('กรุณาระบุจำนวนที่รับเข้าที่มากกว่า 0');
      return;
    }
    if (isNaN(packSize) || packSize <= 0) {
      alert('กรุณาระบุขนาดบรรจุต่อแพ็คที่มากกว่า 0');
      return;
    }

    setIsReceiving(true);
    const pkgUnit = receivingItem.package_unit || 'แพ็ค';
    const success = await addBackstock(
      receivingItem.id,
      count,
      receiveNote,
      packSize,
      updateDefaultPackSize
    );
    setIsReceiving(false);

    if (success) {
      const addedBase = count * packSize;
      onToast(
        `📥 รับ ${receivingItem.name} เข้าหลังร้าน +${count} ${pkgUnit} (+${addedBase.toLocaleString()} ${receivingItem.unit}) สำเร็จ!`
      );
      setReceivingItem(null);
      setReceiveCount(1);
      setReceivePackSize(1);
      setUpdateDefaultPackSize(false);
      setReceiveNote('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Backstock Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-900 shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-normal block">รายการสินค้าในหลังร้าน</span>
            <div className="text-lg font-bold text-stone-900 font-mono tabular-nums">
              {backstockItems.length}{' '}
              <span className="text-xs font-sans font-normal text-stone-500">รายการ</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-normal block">สต็อกคงเหลือในห้องสต็อก</span>
            <div className="text-lg font-bold text-stone-900 font-mono tabular-nums">
              {totalPackages.toLocaleString()}{' '}
              <span className="text-xs font-sans font-normal text-stone-500">ถุง/แพ็ค/ลัง</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
            lowBackstockCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-stone-50 border-stone-200 text-stone-600'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-normal block">หลังร้านเหลือน้อย / หมด</span>
            <div className="text-lg font-bold text-stone-900 font-mono tabular-nums">
              {lowBackstockCount}{' '}
              <span className="text-xs font-sans font-normal text-stone-500">รายการ</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-normal block">มูลค่าสต็อกในคลังหลังร้าน</span>
            <div className="text-lg font-bold text-stone-900 font-mono tabular-nums">
              ฿{Math.round(totalBackstockValue).toLocaleString()}{' '}
              <span className="text-xs font-sans font-normal text-stone-500">บาท</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Backstock Table Container */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-3.5 border-b border-stone-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Counter */}
          <div className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 text-xs text-stone-700 shadow-2xs w-full sm:w-auto shrink-0 font-medium">
            <Warehouse className="w-3.5 h-3.5 text-stone-500" />
            <span>
              วัตถุดิบคลังหลังร้าน (<strong className="font-mono tabular-nums text-stone-900">{filteredItems.length}</strong> รายการ)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ ซัพพลายเออร์..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full pl-9 pr-3 text-xs sm:text-sm rounded-xl bg-white border border-stone-200/90 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors shadow-2xs"
              />
            </div>

            {/* Category Filter */}
            <Dropdown
              value={filterCategory}
              onChange={setFilterCategory}
              options={categories}
              size="md"
              className="w-full sm:w-40"
              buttonClassName="border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 shadow-2xs rounded-xl"
            />

            {/* Status Filter */}
            <Dropdown
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'สถานะหลังร้านทั้งหมด' },
                { value: 'ready', label: 'พร้อมจ่ายบาร์ (> 2 แพ็ค)' },
                { value: 'low', label: 'หลังร้านใกล้หมด (≤ 2 แพ็ค)' },
                { value: 'out', label: 'หลังร้านหมด (0 แพ็ค)' },
              ]}
              size="md"
              className="w-full sm:w-48"
              buttonClassName="border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 shadow-2xs rounded-xl"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-stone-200">
                <TableHead className="whitespace-nowrap text-stone-900 font-semibold">ชื่อวัตถุดิบ &amp; สเปคบรรจุภัณฑ์</TableHead>
                <TableHead className="whitespace-nowrap text-stone-900 font-semibold">หมวดหมู่</TableHead>
                <TableHead className="text-right whitespace-nowrap text-stone-900 font-semibold min-w-[150px]">
                  คงเหลือหลังร้าน (แพ็ค/ถุง/ขวด)
                </TableHead>
                <TableHead className="text-left whitespace-nowrap text-stone-900 font-semibold min-w-[140px]">
                  พร้อมใช้ที่หน้าบาร์
                </TableHead>
                <TableHead className="text-left whitespace-nowrap text-stone-900 font-semibold min-w-[170px]">
                  สต็อกรวมทั้งร้าน
                </TableHead>
                <TableHead className="text-center whitespace-nowrap text-stone-900 font-semibold">สถานะคลัง</TableHead>
                <TableHead className="text-center whitespace-nowrap text-stone-900 font-semibold min-w-[180px]">
                  จัดการสต็อกหลังร้าน
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400 text-sm">
                    {backstockItems.length === 0 ? (
                      <div className="space-y-3">
                        <p>ยังไม่มีวัตถุดิบที่เปิดใช้งานระบบ 2 คลัง (หลังร้าน &amp; หน้าบาร์)</p>
                        <Button
                          onClick={onOpenCreate}
                          size="sm"
                          className="bg-stone-900 text-white rounded-xl shadow-xs"
                        >
                          + เพิ่มวัตถุดิบระบบ 2 คลัง
                        </Button>
                      </div>
                    ) : (
                      'ไม่พบวัตถุดิบหลังร้านที่ตรงกับเงื่อนไขการค้นหา'
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const backstockQty = Number(item.backstock_quantity ?? 0);
                  const packSize = Number(item.package_size || 1);
                  const barQty = Number(item.bar_quantity ?? 0);
                  const totalQty = Number(item.quantity ?? 0);
                  const maxStock = item.max_stock && item.max_stock > 0
                    ? Math.max(item.max_stock, totalQty)
                    : Math.max(totalQty, (item.reorder_point || 0) * 2 || 1);
                  const totalRatio = Math.min(100, Math.round((totalQty / (maxStock || 1)) * 100));

                  const isBackstockOut = backstockQty <= 0;
                  const isBackstockLow = !isBackstockOut && backstockQty <= 2;
                  const isTotalOut = totalQty <= 0;
                  const isTotalLow = !isTotalOut && totalQty <= Number(item.reorder_point || 0);

                  return (
                    <TableRow key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Name & Packaging Specification */}
                      <TableCell className="font-normal text-stone-800">
                        <div>
                          <div className="font-medium text-stone-900 flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.is_two_tier && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                2 คลัง
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                            {item.supplier && <span>{item.supplier}</span>}
                            {item.package_unit && item.package_size && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded border border-stone-200">
                                1 {item.package_unit} = {packSize.toLocaleString()} {item.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <span className="text-stone-600 text-xs font-normal">{item.category}</span>
                      </TableCell>

                      {/* Backstock Quantity (Big, Prominent Packages) */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-lg font-bold font-mono tabular-nums ${
                              isBackstockOut ? 'text-rose-600' : isBackstockLow ? 'text-amber-700' : 'text-stone-900'
                            }`}>
                              {backstockQty.toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-stone-700 font-sans">
                              {item.package_unit || 'แพ็ค'}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 font-mono tabular-nums">
                            (= {(backstockQty * packSize).toLocaleString()} {item.unit})
                          </span>
                        </div>
                      </TableCell>

                      {/* Current Front Bar Status */}
                      <TableCell className="text-left whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold tabular-nums text-stone-800">
                            <Coffee className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{barQty.toLocaleString()}</span>
                            <span className="text-stone-500 font-normal font-sans">{item.unit}</span>
                          </div>
                          {barQty <= 0 ? (
                            <span className="text-[11px] text-rose-500 font-medium font-sans">บาร์หมด (ต้องเติม)</span>
                          ) : item.opened_unit_remaining !== undefined && item.opened_unit_remaining !== null && item.opened_unit_remaining > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium font-sans w-fit">
                              <span>⚡</span>
                              <span>เปิดค้าง <strong className="font-mono font-semibold">{item.opened_unit_remaining.toLocaleString()}</strong> {item.unit}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400 font-sans">
                              เปิด {Math.ceil(barQty / packSize)} {item.package_unit || 'แพ็ค'}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Total Store Stock */}
                      <TableCell className="text-left whitespace-nowrap font-mono text-xs tabular-nums">
                        <div className="flex flex-col gap-1 w-36">
                          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                            <span className="font-bold text-stone-900">
                              {totalQty.toLocaleString()}{' '}
                              <span className="text-stone-500 font-normal font-sans">{item.unit}</span>
                            </span>
                            <span className={`text-[11px] font-semibold ${
                              isTotalOut ? 'text-rose-500' : isTotalLow ? 'text-amber-600' : 'text-stone-500'
                            }`}>
                              {isTotalOut ? 'หมด' : `${totalRatio}%`}
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 border border-stone-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isTotalOut
                                  ? 'bg-transparent'
                                  : isTotalLow
                                  ? 'bg-amber-500'
                                  : 'bg-stone-800'
                              }`}
                              style={{ width: `${Math.max(isTotalOut ? 0 : 4, totalRatio)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-stone-400 font-sans">
                            จุดเตือน: {Number(item.reorder_point || 0).toLocaleString()} {item.unit}
                          </span>
                        </div>
                      </TableCell>

                      {/* Backstock Readiness Status */}
                      <TableCell className="text-center whitespace-nowrap">
                        {isBackstockOut ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                            หลังร้านหมด
                          </span>
                        ) : isBackstockLow ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
                            หลังร้านใกล้หมด
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200/80 shadow-2xs">
                            พร้อมจ่ายบาร์
                          </span>
                        )}
                      </TableCell>

                      {/* Quick Backstock Actions */}
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Transfer 1 package to Front Bar */}
                          <button
                            type="button"
                            disabled={backstockQty <= 0}
                            onClick={() => handleTransferToBar(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all shadow-2xs ${
                              backstockQty > 0
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 active:scale-95 cursor-pointer'
                                : 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                            }`}
                            title={`จ่าย 1 ${item.package_unit || 'แพ็ค'} (${packSize.toLocaleString()} ${item.unit}) ไปหน้าบาร์ทันที (หลังร้านจะลดลง 1)`}
                          >
                            <Coffee className="w-3.5 h-3.5" />
                            <span>จ่ายไปบาร์</span>
                          </button>

                          {/* Inbound Receive Packages */}
                          <button
                            type="button"
                            onClick={() => {
                              setReceivingItem(item);
                              setReceiveCount(1);
                              setReceivePackSize(item.package_size || 1);
                              setUpdateDefaultPackSize(false);
                              setReceiveNote('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                            title={`รับของเข้าหลังร้าน`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>รับเข้า</span>
                          </button>

                          {/* Waste / Spillage Action */}
                          {onWaste && (
                            <button
                              type="button"
                              onClick={() => onWaste(item, 'backstock')}
                              className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                              title="บันทึกของเสีย / เสียหายในหลังร้าน"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Item */}
                          <button
                            type="button"
                            onClick={() => onOpenEdit(item)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                            title="แก้ไขวัตถุดิบ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal: Quick Receive Inbound into Backstock */}
      {receivingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 text-sm">รับของเข้าคลังหลังร้าน</h3>
                  <p className="text-xs text-stone-500 font-normal">{receivingItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setReceivingItem(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceive} className="space-y-3.5">
              {/* Info summary */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">คงเหลือหลังร้านปัจจุบัน:</span>
                  <span className="font-bold text-stone-900 font-mono">
                    {receivingItem.backstock_quantity ?? 0} {receivingItem.package_unit || 'แพ็ค'}
                  </span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>ขนาดมาตรฐานที่บันทึกไว้:</span>
                  <span className="font-medium text-stone-700">
                    1 {receivingItem.package_unit || 'แพ็ค'} = {Number(receivingItem.package_size || 1).toLocaleString()} {receivingItem.unit}
                  </span>
                </div>
              </div>

              {/* Package size of this inbound batch & Count */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      ขนาดบรรจุของล็อตนี้ *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        value={receivePackSize}
                        onChange={(e) => setReceivePackSize(e.target.value)}
                        className="h-10 w-full px-3 text-sm font-mono font-semibold rounded-xl bg-white border border-stone-200 text-stone-800 focus:outline-none focus:border-stone-400 shadow-2xs"
                        placeholder="เช่น 500"
                      />
                      <span className="text-xs font-medium text-stone-600 shrink-0">
                        {receivingItem.unit}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      จำนวนที่รับเข้า ({receivingItem.package_unit || 'แพ็ค'}) *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        value={receiveCount}
                        onChange={(e) => setReceiveCount(e.target.value)}
                        className="h-10 w-full px-3 text-sm font-mono font-semibold rounded-xl bg-white border border-stone-200 text-stone-800 focus:outline-none focus:border-stone-400 shadow-2xs"
                        placeholder="เช่น 5"
                        autoFocus
                      />
                      <span className="text-xs font-medium text-stone-600 shrink-0">
                        {receivingItem.package_unit || 'แพ็ค'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live total calculated preview */}
                {(() => {
                  const countVal = parseFloat(String(receiveCount)) || 0;
                  const packVal = parseFloat(String(receivePackSize)) || 0;
                  const totalGrams = countVal * packVal;
                  const defaultSize = Number(receivingItem.package_size || 1);
                  const isSizeDifferent = packVal > 0 && packVal !== defaultSize;

                  return (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-0.5">
                        <div className="flex items-center justify-between font-medium">
                          <span>จะเพิ่มเข้าสต็อกรวม:</span>
                          <span className="font-mono font-bold text-sm text-amber-950">
                            +{totalGrams.toLocaleString()} {receivingItem.unit}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-700/80">
                          ({countVal.toLocaleString()} {receivingItem.package_unit || 'แพ็ค'} × {packVal.toLocaleString()} {receivingItem.unit})
                        </p>
                      </div>

                      {/* Checkbox to update default standard size */}
                      {isSizeDifferent && (
                        <label className="flex items-start gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs cursor-pointer hover:bg-stone-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={updateDefaultPackSize}
                            onChange={(e) => setUpdateDefaultPackSize(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 accent-stone-900"
                          />
                          <div className="text-stone-700">
                            <span className="font-medium text-stone-900">เปลี่ยนขนาดมาตรฐานถาวร</span>
                            <p className="text-[11px] text-stone-500">
                              ใช้วันนี้และครั้งถัดไปเป็น 1 {receivingItem.package_unit || 'แพ็ค'} = {packVal.toLocaleString()} {receivingItem.unit}
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  บันทึกหมายเหตุ / ใบส่งของ (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={receiveNote}
                  onChange={(e) => setReceiveNote(e.target.value)}
                  placeholder="เช่น สั่งซื้อล็อตใหม่ จากร้านค้าส่ง"
                  className="h-9 w-full px-3 text-xs rounded-xl bg-white border border-stone-200 text-stone-800 focus:outline-none focus:border-stone-400 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReceivingItem(null)}
                  className="border-stone-200 text-stone-700"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isReceiving}
                  className="bg-stone-900 text-white hover:bg-stone-800"
                >
                  ยืนยันรับเข้าหลังร้าน
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
