'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  History,
  TrendingDown,
  TrendingUp,
  Trash2,
  Edit2,
  Calendar,
  GripVertical,
  ClipboardCheck,
  Warehouse,
  Package,
  Coffee,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Ingredient } from '@/types';
import { Dropdown } from '@/components/Dropdown';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/Table';
import { AddIngredientModal } from './components/AddIngredientModal';
import { AdjustStockModal } from './components/AdjustStockModal';
import { StockAuditTab } from './components/StockAuditTab';
import { BackstockTab } from './components/BackstockTab';
import { QuickWasteModal } from './components/QuickWasteModal';
import { TableSkeleton } from '@/components/Skeleton';

interface SortableIngredientRowProps {
  item: Ingredient;
  ratio: number;
  maxStock: number;
  onOpenEdit: (item: Ingredient) => void;
  onAdjust: (item: Ingredient) => void;
  onDelete: (id: number, name: string) => void;
  onOpenPackage?: (id: number) => void;
  onWaste: (item: Ingredient) => void;
}

function SortableIngredientRow({
  item,
  ratio,
  maxStock,
  onOpenEdit,
  onAdjust,
  onDelete,
  onOpenPackage,
  onWaste,
}: SortableIngredientRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const totalQty = Number(item.quantity);
  const reorderPt = Number(item.reorder_point);
  const isOut = totalQty <= 0;
  const isLow = !isOut && totalQty <= reorderPt;
  const isNormal = !isOut && !isLow;

  // Front Bar calculations for 2-tier items
  const barQty = Number(item.bar_quantity ?? 0);
  const packSize = Number(item.package_size || 1);
  const barCapacity = Math.max(packSize, barQty);
  const barRatio = Math.min(100, Math.round((barQty / (barCapacity || 1)) * 100));
  const backstockQty = Number(item.backstock_quantity ?? 0);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: isDragging ? 'relative' : undefined,
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'bg-stone-100 shadow-md ring-1 ring-stone-300' : 'hover:bg-stone-50/80 transition-colors'}
    >
      {/* Drag Handle */}
      <TableCell className="w-10 px-2 text-center whitespace-nowrap">
        <button
          type="button"
          className="cursor-grab touch-none p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 active:cursor-grabbing transition-colors inline-flex items-center justify-center"
          title="คลิกค้างเพื่อลากสลับลำดับ"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </TableCell>

      <TableCell className="font-normal text-stone-800">
        <div>
          <div className="font-medium text-stone-900">{item.name}</div>
          {item.supplier && (
            <div className="text-xs text-stone-400">{item.supplier}</div>
          )}
        </div>
      </TableCell>

      <TableCell>
        <span className="text-stone-600 text-xs font-normal">{item.category}</span>
      </TableCell>

      <TableCell className="text-center">
        {item.is_two_tier ? (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
            ระบบ 2 คลัง
          </span>
        ) : item.tracking_type === 'bulk_expense' ? (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
            เปิดใช้ทั้งแพ็ค
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200/80">
            ตัดตามแก้ว
          </span>
        )}
      </TableCell>

      <TableCell className="text-right">
        <span className="px-2 py-0.5 rounded-full border border-stone-200 bg-stone-50 text-stone-600 text-xs font-mono tabular-nums inline-block font-normal">
          ฿{item.cost_per_unit}/{item.unit}
        </span>
      </TableCell>

      {/* Front Bar Level & Quick Refill Button */}
      <TableCell className="text-left w-56">
        {item.is_two_tier ? (
          <div className="flex flex-col gap-1 w-44 py-0.5">
            {/* Front Bar Amount */}
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold tabular-nums text-stone-900">
              <Coffee className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{barQty.toLocaleString()}</span>
              <span className="text-stone-500 font-normal font-sans">{item.unit}</span>
              <span className="text-[10px] text-stone-400 font-sans font-normal ml-0.5">
                (เปิด {Math.ceil(barQty / packSize)} {item.package_unit || 'แพ็ค'})
              </span>
            </div>

            {/* Opened package remainder pill */}
            {item.opened_unit_remaining !== undefined && item.opened_unit_remaining !== null && item.opened_unit_remaining > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-sans font-medium w-fit">
                <span>⚡</span>
                <span>เปิดค้าง <strong className="font-mono font-semibold">{item.opened_unit_remaining.toLocaleString()}</strong> {item.unit}</span>
              </div>
            )}

            {/* Quick Refill Button & Backstock count */}
            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              <span className="text-[11px] text-stone-500 font-sans truncate" title={`หลังร้านคงเหลือ ${backstockQty} ${item.package_unit || 'แพ็ค'}`}>
                หลังร้าน: <strong className="text-stone-900 font-mono font-semibold">{backstockQty.toLocaleString()}</strong> {item.package_unit || 'แพ็ค'}
              </span>

              {backstockQty > 0 && onOpenPackage ? (
                <button
                  type="button"
                  onClick={() => onOpenPackage(item.id)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                  title={`ดึง 1 ${item.package_unit || 'แพ็ค'} (${packSize.toLocaleString()} ${item.unit}) จากหลังร้านเข้าหน้าบาร์`}
                >
                  <Package className="w-3 h-3 text-amber-800" />
                  <span>ดึง 1 {item.package_unit || 'ถุง'}</span>
                </button>
              ) : (
                <span className="text-[10px] text-stone-400 font-medium bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 shrink-0">
                  หลังร้านหมด
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 w-40 py-0.5">
            <div className="flex items-center justify-between text-xs text-stone-500 font-mono tabular-nums">
              <span className="font-medium text-stone-800">{Number(item.quantity).toLocaleString()} {item.unit}</span>
              <span className="text-stone-400 font-sans">({ratio}%)</span>
            </div>
            <div className="w-full bg-stone-100 border border-stone-200/90 h-1.5 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOut ? 'bg-transparent' : isLow ? 'bg-amber-500' : 'bg-stone-800'
                }`}
                style={{ width: `${Math.max(isOut ? 0 : 4, ratio)}%` }}
              />
            </div>
            <span className="text-[10px] text-stone-400 font-sans">ตัดสต็อกตรง (ไม่มีคลังบาร์)</span>
          </div>
        )}
      </TableCell>

      {/* Total Store Stock Column */}
      <TableCell className="text-right font-normal text-stone-700 text-xs font-mono tabular-nums whitespace-nowrap">
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-900 text-sm">{Number(item.quantity).toLocaleString()}</span>{' '}
            <span className="text-stone-600">{item.unit}</span>
            {Boolean(item.is_two_tier) && (
              <span className={`text-[11px] font-semibold ${isOut ? 'text-rose-500' : isLow ? 'text-amber-600' : 'text-stone-500'}`}>
                ({ratio}%)
              </span>
            )}
          </div>
          {Boolean(item.is_two_tier) && (
            <div className="w-24 bg-stone-100 border border-stone-200/90 h-1.5 rounded-full overflow-hidden relative mt-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOut ? 'bg-transparent' : isLow ? 'bg-amber-500' : 'bg-stone-800'
                }`}
                style={{ width: `${Math.max(isOut ? 0 : 4, ratio)}%` }}
              />
            </div>
          )}
          {Boolean(item.package_unit && item.package_size && item.package_size > 0 && item.is_two_tier) && (
            <span className="block text-[10px] text-stone-500 font-sans font-medium">
              ≈ {(item.quantity / item.package_size!).toFixed(1)} {item.package_unit}
            </span>
          )}
        </div>
      </TableCell>

      {/* Reorder Point Column */}
      <TableCell className="text-right text-stone-400 font-normal text-xs font-mono tabular-nums whitespace-nowrap">
        <div>
          <span className="font-medium text-stone-700">{Number(item.reorder_point).toLocaleString()}</span>{' '}
          <span>{item.unit}</span>
          {Boolean(item.package_unit && item.package_size && item.package_size > 0 && item.is_two_tier) && (
            <span className="block text-[10px] text-stone-400 font-sans">
              ({(item.reorder_point / item.package_size!).toFixed(1)} {item.package_unit})
            </span>
          )}
        </div>
      </TableCell>

      {/* Status Column - Strictly based on total store stock vs reorder_point */}
      <TableCell className="text-center whitespace-nowrap">
        {isNormal && (
          <Badge variant="outline" size="sm" className="border-stone-200 text-stone-700 font-medium">
            ปกติ
          </Badge>
        )}
        {isLow && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#92400e] border border-[#fde68a] shadow-2xs">
              ใกล้หมด
            </span>
            <span className="text-[9px] text-amber-700 font-sans font-medium">สต็อกรวมต่ำกว่าจุดเตือน</span>
          </div>
        )}
        {isOut && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            สต็อกหมด
          </span>
        )}
      </TableCell>

      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => onOpenEdit(item)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="แก้ไขข้อมูลวัตถุดิบ"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAdjust(item)}
            className="h-7 px-2 text-xs font-normal border-stone-200 text-stone-700 hover:bg-stone-50"
          >
            ปรับสต็อก
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWaste(item)}
            className="h-7 px-2 text-xs font-normal border-stone-200 text-stone-700 hover:bg-stone-50"
            title="บันทึกของเสีย / ทำหก / เสีย"
          >
            🗑️ ของเสีย
          </Button>
          <button
            onClick={() => onDelete(item.id, item.name)}
            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="ลบรายการ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function StockPage() {
  const { ingredients, movements, addIngredient, updateIngredient, deleteIngredient, adjustStock, reorderIngredients, openPackage, isLoading } = useStock();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'backstock' | 'movements' | 'audit'>('inventory');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Waste Modal State
  const [wasteModalItem, setWasteModalItem] = useState<Ingredient | null>(null);
  const [wasteDefaultTier, setWasteDefaultTier] = useState<'bar' | 'backstock'>('bar');

  // Feedback Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Backstock count (2-tier or packaged items)
  const backstockCount = React.useMemo(() => {
    return ingredients.filter(
      (i) => i.is_two_tier || (i.package_unit && (i.package_size || 0) > 0)
    ).length;
  }, [ingredients]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Ingredient | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Ingredient | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'waste' | 'adjust'>('in');
  const [adjustAmount, setAdjustAmount] = useState<number | string>(1);
  const [adjustNote, setAdjustNote] = useState<string>('');

  // Form State for Add Ingredient
  const [formData, setFormData] = useState<{
    name: string;
    unit: string;
    quantity: number | string;
    max_stock?: number | string;
    reorder_point: number | string;
    cost_per_unit: number | string;
    category: string;
    supplier: string;
    tracking_type: 'strict' | 'bulk_expense';
    package_unit?: string;
    package_size?: number | string;
    is_two_tier?: boolean;
    backstock_quantity?: number | string;
    bar_quantity?: number | string;
  }>({
    name: '',
    unit: 'กรัม',
    quantity: '',
    max_stock: '',
    reorder_point: '200',
    cost_per_unit: '0.5',
    category: 'เมล็ดกาแฟ & ชา',
    supplier: '',
    tracking_type: 'strict',
    package_unit: '',
    package_size: '',
    is_two_tier: false,
    backstock_quantity: '',
    bar_quantity: '',
  });

  const filteredIngredients = ingredients.filter((ing) => {
    const matchSearch = ing.name.toLowerCase().includes(search.toLowerCase());
    const totalQty = Number(ing.quantity);
    const reorderPt = Number(ing.reorder_point);
    const calculatedStatus = totalQty <= 0 ? 'out' : totalQty <= reorderPt ? 'low' : 'normal';
    const matchStatus = filterStatus === 'all' || calculatedStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginatedIngredients = filteredIngredients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const paginatedIngredientIds = React.useMemo(
    () => paginatedIngredients.map((ing) => ing.id),
    [paginatedIngredients]
  );

  const handleDragEndIngredients = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = paginatedIngredientIds.indexOf(active.id as number);
    const newIndex = paginatedIngredientIds.indexOf(over.id as number);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedPage = arrayMove(paginatedIngredients, oldIndex, newIndex);
    const updatedFullList = [...ingredients];
    const startIndex = (currentPage - 1) * pageSize;
    updatedFullList.splice(startIndex, paginatedIngredients.length, ...reorderedPage);

    await reorderIngredients(updatedFullList.map((i) => i.id));
  };

  const handleOpenCreate = () => {
    setEditingTarget(null);
    setFormData({
      name: '',
      unit: 'กรัม',
      quantity: '',
      max_stock: '',
      reorder_point: '200',
      cost_per_unit: '0.5',
      category: 'เมล็ดกาแฟ & ชา',
      supplier: '',
      tracking_type: 'strict',
      package_unit: '',
      package_size: '',
      is_two_tier: false,
      backstock_quantity: '',
      bar_quantity: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingTarget(ing);
    setFormData({
      name: ing.name,
      unit: ing.unit,
      quantity: ing.quantity,
      max_stock: ing.max_stock ?? ing.quantity,
      reorder_point: ing.reorder_point,
      cost_per_unit: ing.cost_per_unit,
      category: ing.category || 'เมล็ดกาแฟ & ชา',
      supplier: ing.supplier || '',
      tracking_type: ing.tracking_type || 'strict',
      package_unit: ing.package_unit || '',
      package_size: ing.package_size ?? '',
      is_two_tier: !!ing.is_two_tier,
      backstock_quantity: ing.backstock_quantity ?? '',
      bar_quantity: ing.bar_quantity ?? '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenPackage = async (id: number) => {
    const ing = ingredients.find((i) => i.id === id);
    const pkgUnit = ing?.package_unit || 'ถุง';
    const prevBack = Number(ing?.backstock_quantity ?? 0);
    const success = await openPackage(id, 1);
    if (success) {
      showToast(`📦 ดึง ${ing?.name || 'วัตถุดิบ'} 1 ${pkgUnit} จากหลังร้านเข้าหน้าบาร์สำเร็จ! (หลังร้านลดเหลือ ${Math.max(0, prevBack - 1)} ${pkgUnit})`);
    }
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('กรุณากรอกชื่อวัตถุดิบ');
      return;
    }

    const isTwoTier = !!formData.is_two_tier;
    const packSize = typeof formData.package_size === 'number' ? formData.package_size : parseFloat(String(formData.package_size || '')) || undefined;
    const backstockQty = typeof formData.backstock_quantity === 'number' ? formData.backstock_quantity : parseFloat(String(formData.backstock_quantity || '')) || 0;
    const barQty = typeof formData.bar_quantity === 'number' ? formData.bar_quantity : parseFloat(String(formData.bar_quantity || '')) || 0;

    if (isTwoTier) {
      if (!formData.package_unit?.trim()) {
        alert('กรุณากรอกหน่วยบรรจุภัณฑ์ (เช่น ขวด, ลัง, ถุง) เมื่อเปิดใช้ระบบ 2 คลัง');
        return;
      }
      if (!packSize || packSize <= 0) {
        alert('กรุณากรอกขนาดบรรจุต่อแพ็ค/ขวด ให้มากกว่า 0 เมื่อเปิดใช้ระบบ 2 คลัง');
        return;
      }
    }

    let qty = typeof formData.quantity === 'number' ? formData.quantity : parseFloat(formData.quantity) || 0;
    if (isTwoTier && packSize && packSize > 0) {
      qty = (backstockQty * packSize) + barQty;
    }

    const maxStock = typeof formData.max_stock === 'number' ? formData.max_stock : parseFloat(String(formData.max_stock || '')) || qty;
    const reorder = typeof formData.reorder_point === 'number' ? formData.reorder_point : parseFloat(formData.reorder_point) || 0;
    const cost = typeof formData.cost_per_unit === 'number' ? formData.cost_per_unit : parseFloat(formData.cost_per_unit) || 0;

    let success = false;
    if (editingTarget) {
      success = await updateIngredient(editingTarget.id, {
        name: formData.name.trim(),
        unit: formData.unit,
        quantity: qty,
        max_stock: Math.max(qty, maxStock),
        reorder_point: reorder,
        cost_per_unit: cost,
        category: formData.category,
        supplier: formData.supplier.trim() || undefined,
        tracking_type: formData.tracking_type,
        package_unit: formData.package_unit?.trim() || undefined,
        package_size: packSize,
        is_two_tier: isTwoTier,
        backstock_quantity: backstockQty,
        bar_quantity: barQty,
      });
    } else {
      success = await addIngredient({
        name: formData.name.trim(),
        unit: formData.unit,
        quantity: qty,
        max_stock: Math.max(qty, maxStock),
        reorder_point: reorder,
        cost_per_unit: cost,
        category: formData.category,
        supplier: formData.supplier.trim() || undefined,
        tracking_type: formData.tracking_type,
        package_unit: formData.package_unit?.trim() || undefined,
        package_size: packSize,
        is_two_tier: isTwoTier,
        backstock_quantity: backstockQty,
        bar_quantity: barQty,
      });
    }

    if (success) {
      setIsAddModalOpen(false);
      setEditingTarget(null);
      setFormData({
        name: '',
        unit: 'กรัม',
        quantity: '',
        max_stock: '',
        reorder_point: '200',
        cost_per_unit: '0.5',
        category: 'เมล็ดกาแฟ & ชา',
        supplier: '',
        tracking_type: 'strict',
        package_unit: '',
        package_size: '',
        is_two_tier: false,
        backstock_quantity: '',
        bar_quantity: '',
      });
    } else {
      alert(editingTarget ? 'ไม่สามารถบันทึกการแก้ไขได้ กรุณาลองใหม่อีกครั้ง' : 'ไม่สามารถเพิ่มวัตถุดิบได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleExecuteAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    const amt = typeof adjustAmount === 'number' ? adjustAmount : parseFloat(adjustAmount) || 0;
    if (amt <= 0) {
      alert('กรุณาระบุจำนวนที่มากกว่า 0');
      return;
    }

    const success = await adjustStock(adjustTarget.id, adjustType, amt, adjustNote);
    if (success) {
      setAdjustTarget(null);
      setAdjustAmount(1);
      setAdjustNote('');
    } else {
      alert('ปรับปรุงสต็อกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`คุณต้องการลบวัตถุดิบ "${name}" หรือไม่?`)) return;
    await deleteIngredient(id);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar
        title="จัดการสต็อกวัตถุดิบ (Stock Management)"
        subtitle="ควบคุมระดับสต็อก จุดสั่งซื้อซ้ำ (Reorder Point) และประวัติการเคลื่อนไหว"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto w-full">
        {/* Navigation Sub-tabs & Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/80 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`h-9 px-3.5 rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-white text-stone-900 border border-stone-200 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>สต็อกหน้าบาร์</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-stone-200 text-stone-700 font-mono tabular-nums font-medium">
                {ingredients.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('backstock')}
              className={`h-9 px-3.5 rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'backstock'
                  ? 'bg-white text-stone-900 border border-stone-200 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5 text-stone-600" />
              <span>สต็อกหลังร้าน</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-amber-100 text-amber-900 font-mono tabular-nums font-semibold border border-amber-200/80">
                {backstockCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`h-9 px-3.5 rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'movements'
                  ? 'bg-white text-stone-900 border border-stone-200 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>ประวัติการปรับสต็อก</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`h-9 px-3.5 rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-white text-stone-900 border border-stone-200 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>รีเช็คสต๊อก</span>
            </button>
          </div>

          {(activeTab === 'inventory' || activeTab === 'backstock') && (
            <Button
              onClick={handleOpenCreate}
              icon={<Plus className="w-4 h-4" />}
              size="md"
              className="shrink-0 whitespace-nowrap shadow-xs w-full sm:w-auto bg-stone-900 text-white hover:bg-stone-800 rounded-xl"
            >
              เพิ่มวัตถุดิบใหม่
            </Button>
          )}
        </div>

        {activeTab === 'inventory' && (
          /* Inventory Table View */
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3.5 border-b border-stone-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Count Indicator */}
              <div className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 text-xs text-stone-600 shadow-2xs w-full sm:w-auto shrink-0">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-medium">วัตถุดิบทั้งหมด (<span className="font-mono tabular-nums font-bold">{filteredIngredients.length}</span> รายการ)</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อวัตถุดิบ..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 w-full pl-9 pr-3 text-xs sm:text-sm rounded-xl bg-white border border-stone-200/90 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors font-normal shadow-2xs"
                  />
                </div>

                {/* Status Filter */}
                <Dropdown
                  value={filterStatus}
                  onChange={(val) => {
                    setFilterStatus(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'สถานะทั้งหมด' },
                    { value: 'normal', label: 'ปกติ (Normal)' },
                    { value: 'low', label: 'ใกล้หมด (Low Stock)' },
                    { value: 'out', label: 'หมดแล้ว (Out of Stock)' },
                  ]}
                  size="md"
                  className="w-full sm:w-44"
                  buttonClassName="border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 shadow-2xs rounded-xl"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEndIngredients}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-stone-200">
                      <TableHead className="w-10 px-2 text-center whitespace-nowrap text-stone-400 font-normal text-xs" title="ลากเพื่อสลับลำดับ">
                        ย้าย
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-stone-900 font-semibold">ชื่อวัตถุดิบ</TableHead>
                      <TableHead className="whitespace-nowrap text-stone-900 font-semibold">หมวดหมู่</TableHead>
                      <TableHead className="text-center whitespace-nowrap text-stone-900 font-semibold">การตัดสต็อก</TableHead>
                      <TableHead className="text-right whitespace-nowrap text-stone-900 font-semibold">ต้นทุน/หน่วย</TableHead>
                      <TableHead className="text-left whitespace-nowrap text-stone-900 font-semibold min-w-[210px]">
                        หน้าบาร์ &amp; เติมด่วน
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap text-stone-900 font-semibold">รวมทั้งร้าน</TableHead>
                      <TableHead className="text-right whitespace-nowrap text-stone-900 font-semibold">จุดสั่งซื้อ</TableHead>
                      <TableHead className="text-center whitespace-nowrap text-stone-900 font-semibold">สถานะ</TableHead>
                      <TableHead className="text-center whitespace-nowrap w-28 text-stone-900 font-semibold">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <TableSkeleton rows={6} cols={10} />
                        </td>
                      </tr>
                    ) : (
                      <SortableContext items={paginatedIngredientIds} strategy={verticalListSortingStrategy}>
                        {paginatedIngredients.map((item) => {
                          const maxStock = item.max_stock && item.max_stock > 0 
                            ? Math.max(item.max_stock, item.quantity) 
                            : Math.max(item.quantity, item.reorder_point * 2 || 1);
                          const ratio = Math.min(100, Math.round((item.quantity / (maxStock || 1)) * 100));

                          return (
                            <SortableIngredientRow
                              key={item.id}
                              item={item}
                              ratio={ratio}
                              maxStock={maxStock}
                              onOpenEdit={handleOpenEdit}
                              onAdjust={(target) => {
                                setAdjustTarget(target);
                                setAdjustType('in');
                                setAdjustAmount(1);
                              }}
                              onDelete={handleDelete}
                              onOpenPackage={handleOpenPackage}
                              onWaste={(target) => {
                                setWasteModalItem(target);
                                setWasteDefaultTier('bar');
                              }}
                            />
                          );
                        })}
                      </SortableContext>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>

            {/* Pagination: only displays if items > 8 */}
            <div className="p-3 border-t border-stone-100">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredIngredients.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}

        {/* Backstock Tab View */}
        {activeTab === 'backstock' && (
          <BackstockTab
            ingredients={ingredients}
            onOpenEdit={handleOpenEdit}
            onOpenCreate={handleOpenCreate}
            onToast={showToast}
            onWaste={(target, tier) => {
              setWasteModalItem(target);
              setWasteDefaultTier(tier);
            }}
          />
        )}

        {/* Movement History Log View */}
        {activeTab === 'movements' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 space-y-3">
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700 shrink-0">
                <History className="w-4 h-4" />
              </div>
              <span>บันทึกประวัติการปรับสต็อก</span>
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-stone-200">
                    <TableHead className="text-stone-900 font-semibold">วัน-เวลา</TableHead>
                    <TableHead className="text-stone-900 font-semibold">วัตถุดิบ</TableHead>
                    <TableHead className="text-stone-900 font-semibold">ประเภท</TableHead>
                    <TableHead className="text-right text-stone-900 font-semibold">จำนวนที่ปรับ</TableHead>
                    <TableHead className="text-right text-stone-900 font-semibold">คงเหลือสุทธิ</TableHead>
                    <TableHead className="text-stone-900 font-semibold">หมายเหตุ / เหตุผล</TableHead>
                    <TableHead className="text-stone-900 font-semibold">ผู้บันทึก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mov) => (
                    <TableRow key={mov.id} className="hover:bg-stone-50/80 transition-colors">
                      <TableCell className="text-stone-500 font-mono tabular-nums text-xs">{mov.created_at}</TableCell>
                      <TableCell className="font-medium text-stone-900">{mov.ingredient_name}</TableCell>
                      <TableCell>
                        {mov.type === 'in' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                            <TrendingUp className="w-3 h-3 text-stone-600" />
                            รับเข้า
                          </span>
                        )}
                        {mov.type === 'open' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                            <Package className="w-3 h-3 text-amber-800" />
                            เปิดเข้าบาร์
                          </span>
                        )}
                        {mov.type === 'consume' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-600 border border-stone-200">
                            <Coffee className="w-3 h-3 text-stone-500" />
                            ตัดชง (POS)
                          </span>
                        )}
                        {mov.type === 'out' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-600 border border-stone-200">
                            <TrendingDown className="w-3 h-3 text-stone-400" />
                            ตัดออก
                          </span>
                        )}
                        {mov.type === 'waste' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            ของเสีย/ทิ้ง
                          </span>
                        )}
                        {mov.type === 'adjust' && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
                            ปรับยอดนับสต็อก
                          </span>
                        )}
                        {mov.type === 'audit_adjustment' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                            <ClipboardCheck className="w-3 h-3" />
                            รีเช็คสต๊อก
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono tabular-nums text-xs font-medium ${
                          mov.quantity > 0 ? 'text-stone-800' : 'text-stone-500'
                        }`}
                      >
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} {mov.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs text-stone-600 font-medium">
                        {mov.remaining_quantity} {mov.unit}
                      </TableCell>
                      <TableCell className="text-stone-600 font-normal text-xs">{mov.note || '-'}</TableCell>
                      <TableCell className="text-stone-500 font-normal text-xs">{mov.staff_name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Stock Audit Tab */}
        {activeTab === 'audit' && (
          <StockAuditTab
            ingredients={ingredients}
            onReconcileComplete={() => {
              // Reload stock data after reconcile
              window.location.reload();
            }}
          />
        )}
      </main>

      {/* Modular Add / Edit Ingredient Modal */}
      <AddIngredientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSaveIngredient}
        formData={formData}
        setFormData={setFormData}
        editingTarget={editingTarget}
      />

      {/* Quick Waste Modal */}
      <QuickWasteModal
        ingredient={wasteModalItem}
        isOpen={Boolean(wasteModalItem)}
        onClose={() => setWasteModalItem(null)}
        defaultTier={wasteDefaultTier}
      />

      {/* Modular Adjust Stock Modal */}
      <AdjustStockModal
        adjustTarget={adjustTarget}
        adjustType={adjustType}
        adjustAmount={adjustAmount}
        adjustNote={adjustNote}
        onClose={() => setAdjustTarget(null)}
        onSubmit={handleExecuteAdjust}
        setAdjustType={setAdjustType}
        setAdjustAmount={setAdjustAmount}
        setAdjustNote={setAdjustNote}
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-stone-900 text-white rounded-2xl shadow-xl border border-stone-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
            <button
              onClick={() => setToastMsg(null)}
              className="ml-2 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
