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
  Coffee,
  CheckCircle2,
  Check,
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
import { Ingredient, UnitSetting, StockMovement } from '@/types';
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
import { AddIngredientModal, IngredientFormData } from './components/AddIngredientModal';
import { AdjustStockModal } from './components/AdjustStockModal';
import { StockAuditTab } from './components/StockAuditTab';
import { TableSkeleton } from '@/components/Skeleton';
import { formatStockUnits, formatInteger } from '@/lib/cafePresets';

interface SortableIngredientRowProps {
  item: Ingredient;
  ratio: number;
  maxStock: number;
  onOpenEdit: (item: Ingredient) => void;
  onAdjust: (item: Ingredient) => void;
  onDelete: (id: number, name: string) => void;
  onQuickUpdateCost: (id: number, newCost: number) => Promise<boolean>;
}

function SortableIngredientRow({
  item,
  ratio,
  maxStock,
  onOpenEdit,
  onAdjust,
  onDelete,
  onQuickUpdateCost,
}: SortableIngredientRowProps) {
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [tempCost, setTempCost] = useState(String(item.cost_per_unit || ''));
  const [isSavingCost, setIsSavingCost] = useState(false);

  useEffect(() => {
    setTempCost(String(item.cost_per_unit || ''));
  }, [item.cost_per_unit]);

  const handleSaveInlineCost = async () => {
    const val = parseFloat(tempCost);
    if (isNaN(val) || val < 0) {
      setTempCost(String(item.cost_per_unit || ''));
      setIsEditingCost(false);
      return;
    }
    if (val === Number(item.cost_per_unit)) {
      setIsEditingCost(false);
      return;
    }
    setIsSavingCost(true);
    await onQuickUpdateCost(item.id, val);
    setIsSavingCost(false);
    setIsEditingCost(false);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const totalQty = Math.round(Number(item.quantity) || 0);
  const reorderPt = Math.round(Number(item.reorder_point) || 0);
  const isOut = totalQty <= 0;
  const isLow = !isOut && totalQty <= reorderPt;
  const isNormal = !isOut && !isLow;

  const formattedStock = formatStockUnits(
    item.quantity,
    item.package_size,
    item.package_unit,
    item.unit
  );

  const formattedReorder = formatStockUnits(
    item.reorder_point,
    item.package_size,
    item.package_unit,
    item.unit
  );

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
      <TableCell className="w-9 px-2 text-center whitespace-nowrap py-3">
        <button
          type="button"
          className="cursor-grab touch-none p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100 active:cursor-grabbing transition-colors inline-flex items-center justify-center"
          title="คลิกค้างเพื่อลากสลับลำดับ"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </TableCell>

      {/* Ingredient Name & Supplier */}
      <TableCell className="font-normal text-stone-800 py-3">
        <div>
          <div className="font-semibold text-stone-900 text-xs">{item.name}</div>
          {item.supplier && (
            <div className="text-[11px] text-stone-400 mt-0.5">{item.supplier}</div>
          )}
        </div>
      </TableCell>

      {/* Category */}
      <TableCell className="py-3 whitespace-nowrap">
        <span className="text-stone-500 text-xs font-normal">{item.category || '-'}</span>
      </TableCell>

      {/* Unit Cost with Inline Quick Edit */}
      <TableCell className="text-right whitespace-nowrap py-3">
        {isEditingCost ? (
          <div className="inline-flex items-center gap-1 justify-end">
            <span className="text-xs text-stone-400 font-mono">฿</span>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              disabled={isSavingCost}
              value={tempCost}
              onChange={(e) => {
                if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                  setTempCost(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveInlineCost();
                if (e.key === 'Escape') {
                  setTempCost(String(item.cost_per_unit || ''));
                  setIsEditingCost(false);
                }
              }}
              className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-stone-400 rounded focus:outline-none text-right text-stone-900"
            />
            <button
              type="button"
              disabled={isSavingCost}
              onClick={handleSaveInlineCost}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
              title="บันทึกต้นทุน"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={isSavingCost}
              onClick={() => {
                setTempCost(String(item.cost_per_unit || ''));
                setIsEditingCost(false);
              }}
              className="p-1 text-stone-400 hover:bg-stone-100 rounded cursor-pointer"
              title="ยกเลิก"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingCost(true)}
            className="group/cost inline-flex items-center gap-1 text-right font-mono text-xs text-stone-700 hover:text-stone-950 font-medium px-1.5 py-0.5 rounded hover:bg-stone-100 transition-colors cursor-pointer"
            title="คลิกเพื่อแก้ไขราคาต้นทุนทันที"
          >
            <span>฿{item.cost_per_unit}/{item.unit}</span>
            <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover/cost:opacity-60 text-stone-500" />
          </button>
        )}
      </TableCell>

      {/* Unified Total Stock Column: Base unit first, package in parentheses */}
      <TableCell className="text-left py-3">
        <div className="flex flex-col gap-1 w-44">
          <div className="flex items-baseline justify-between text-xs font-mono tabular-nums">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-stone-900 text-xs sm:text-sm">{formattedStock.baseText}</span>
              {formattedStock.packText && (
                <span className="text-stone-500 font-sans text-xs">
                  {formattedStock.packText}
                </span>
              )}
            </div>
            <span className={`text-[11px] font-semibold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-stone-400'}`}>
              {ratio}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-100 border border-stone-200/80 h-1.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOut ? 'bg-transparent' : isLow ? 'bg-amber-500' : 'bg-stone-900'
              }`}
              style={{ width: `${Math.max(isOut ? 0 : 4, ratio)}%` }}
            />
          </div>
        </div>
      </TableCell>

      {/* Reorder Point Column: Single clean line */}
      <TableCell className="text-right text-xs font-mono tabular-nums whitespace-nowrap py-3">
        <span className="font-medium text-stone-800">{formattedReorder.baseText}</span>{' '}
        {formattedReorder.packText && (
          <span className="text-stone-500 font-sans text-[11px]">{formattedReorder.packText}</span>
        )}
      </TableCell>

      {/* Status Column */}
      <TableCell className="text-center whitespace-nowrap py-3">
        {isNormal && (
          <Badge variant="outline" size="sm" className="border-emerald-200 bg-emerald-50 text-emerald-800 font-medium">
            ปกติ
          </Badge>
        )}
        {isLow && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
            ใกล้หมด
          </span>
        )}
        {isOut && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            สต็อกหมด
          </span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-center whitespace-nowrap py-3">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAdjust(item)}
            className="h-7 px-2.5 text-xs font-medium border-stone-200 text-stone-800 hover:bg-stone-100 cursor-pointer shadow-2xs rounded-lg"
          >
            ปรับสต็อก
          </Button>
          <button
            onClick={() => onOpenEdit(item)}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="แก้ไขข้อมูล"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id, item.name)}
            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="ลบ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface StockClientViewProps {
  initialIngredients?: Ingredient[];
  initialUnits?: UnitSetting[];
  initialMovements?: StockMovement[];
}

export function StockClientView({
  initialIngredients,
  initialUnits,
  initialMovements,
}: StockClientViewProps) {
  const {
    ingredients: ctxIngredients,
    movements: ctxMovements,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    adjustStock,
    reorderIngredients,
    isLoading,
    hydrateData,
  } = useStock();

  useEffect(() => {
    if (initialIngredients || initialUnits || initialMovements) {
      hydrateData({
        ingredients: initialIngredients,
        units: initialUnits,
        movements: initialMovements,
      });
    }
  }, [initialIngredients, initialUnits, initialMovements, hydrateData]);

  const ingredients = ctxIngredients && ctxIngredients.length > 0 ? ctxIngredients : initialIngredients || [];
  const movements = ctxMovements && ctxMovements.length > 0 ? ctxMovements : initialMovements || [];

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements' | 'audit'>('inventory');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Feedback Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Adjust modal state
  const [adjustTarget, setAdjustTarget] = useState<Ingredient | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'waste' | 'adjust'>('in');
  const [adjustAmount, setAdjustAmount] = useState<number | string>(1);
  const [adjustNote, setAdjustNote] = useState('');

  // Add/Edit modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    unit: 'กรัม',
    quantity: '',
    max_stock: '',
    reorder_point: '1000',
    cost_per_unit: '0.70',
    category: 'เมล็ดกาแฟ & ชา',
    supplier: '',
    tracking_type: 'strict',
    package_unit: 'ถุง',
    package_size: '500',
  });

  const filteredIngredients = React.useMemo(() => {
    return ingredients.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(search.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

      const totalQty = Math.round(Number(item.quantity) || 0);
      const reorderPt = Math.round(Number(item.reorder_point) || 0);
      const isOut = totalQty <= 0;
      const isLow = !isOut && totalQty <= reorderPt;

      if (filterStatus === 'normal') return matchSearch && !isOut && !isLow;
      if (filterStatus === 'low') return matchSearch && isLow;
      if (filterStatus === 'out') return matchSearch && isOut;
      return matchSearch;
    });
  }, [ingredients, search, filterStatus]);

  const paginatedIngredients = React.useMemo(() => {
    if (filteredIngredients.length <= pageSize) {
      return filteredIngredients;
    }
    const startIndex = (currentPage - 1) * pageSize;
    return filteredIngredients.slice(startIndex, startIndex + pageSize);
  }, [filteredIngredients, currentPage, pageSize]);

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
      reorder_point: '1000',
      cost_per_unit: '0.70',
      category: 'เมล็ดกาแฟ & ชา',
      supplier: '',
      tracking_type: 'strict',
      package_unit: 'ถุง',
      package_size: '500',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingTarget(ing);
    setFormData({
      name: ing.name,
      unit: ing.unit,
      quantity: Math.round(Number(ing.quantity) || 0),
      max_stock: Math.round(Number(ing.max_stock ?? ing.quantity)),
      reorder_point: Math.round(Number(ing.reorder_point) || 0),
      cost_per_unit: ing.cost_per_unit,
      category: ing.category || 'เมล็ดกาแฟ & ชา',
      supplier: ing.supplier || '',
      tracking_type: ing.tracking_type || 'strict',
      package_unit: ing.package_unit || '',
      package_size: ing.package_size ? Math.round(Number(ing.package_size)) : '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('กรุณากรอกชื่อวัตถุดิบ');
      return;
    }

    const packSize = typeof formData.package_size === 'number'
      ? Math.round(formData.package_size)
      : parseInt(String(formData.package_size || ''), 10) || undefined;

    let qty = typeof formData.quantity === 'number'
      ? Math.round(formData.quantity)
      : parseInt(String(formData.quantity || ''), 10) || 0;

    const maxStock = typeof formData.max_stock === 'number'
      ? Math.round(formData.max_stock)
      : parseInt(String(formData.max_stock || ''), 10) || qty;

    const reorder = typeof formData.reorder_point === 'number'
      ? Math.round(formData.reorder_point)
      : parseInt(String(formData.reorder_point || ''), 10) || 0;

    const cost = typeof formData.cost_per_unit === 'number'
      ? formData.cost_per_unit
      : parseFloat(String(formData.cost_per_unit || '')) || 0;

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
      });
    }

    if (success) {
      setIsAddModalOpen(false);
      setEditingTarget(null);
      showToast(editingTarget ? `แก้ไข ${formData.name} เรียบร้อยแล้ว` : `เพิ่ม ${formData.name} เข้าสต็อกเรียบร้อยแล้ว`);
    } else {
      alert(editingTarget ? 'ไม่สามารถบันทึกการแก้ไขได้ กรุณาลองใหม่อีกครั้ง' : 'ไม่สามารถเพิ่มวัตถุดิบได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleExecuteAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    const amt = typeof adjustAmount === 'number' ? Math.round(adjustAmount) : parseInt(String(adjustAmount || ''), 10) || 0;
    if (amt <= 0) {
      alert('กรุณาระบุจำนวนที่มากกว่า 0');
      return;
    }

    const success = await adjustStock(adjustTarget.id, adjustType, amt, adjustNote);
    if (success) {
      showToast(`ปรับปรุงสต็อก ${adjustTarget.name} สำเร็จ!`);
      setAdjustTarget(null);
      setAdjustAmount(1);
      setAdjustNote('');
    } else {
      alert('ไม่สามารถปรับปรุงสต็อกได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบวัตถุดิบ "${name}" ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      const success = await deleteIngredient(id);
      if (success) {
        showToast(`ลบวัตถุดิบ "${name}" สำเร็จ`);
      } else {
        alert('เกิดข้อผิดพลาดในการลบวัตถุดิบ');
      }
    }
  };

  const handleQuickUpdateCost = async (id: number, newCost: number): Promise<boolean> => {
    const ing = ingredients.find((i) => i.id === id);
    if (!ing) return false;
    const success = await updateIngredient(id, {
      ...ing,
      cost_per_unit: newCost,
    });
    if (success) {
      showToast(`อัปเดตต้นทุน ${ing.name} เป็น ฿${newCost}/${ing.unit} สำเร็จ`);
    } else {
      alert('ไม่สามารถอัปเดตต้นทุนได้ กรุณาลองใหม่อีกครั้ง');
    }
    return success;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-stone-50/50">
      <Topbar title="จัดการสต็อกวัตถุดิบ" />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`h-9 px-3.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-white text-stone-900 border border-stone-200 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-stone-700" />
              <span>สต็อกวัตถุดิบทั้งหมด</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-stone-200 text-stone-800 font-mono tabular-nums font-semibold">
                {ingredients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={`h-9 px-3.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'movements'
                  ? 'bg-white text-stone-900 border border-stone-200 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <History className="w-3.5 h-3.5 text-stone-600" />
              <span>ประวัติการปรับสต็อก</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-stone-200 text-stone-800 font-mono tabular-nums font-medium">
                {movements.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`h-9 px-3.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-white text-stone-900 border border-stone-200 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-stone-600" />
              <span>รีเช็คสต๊อก</span>
            </button>
          </div>

          {activeTab === 'inventory' && (
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

        {/* Tab 1: Single Unified Stock Inventory */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3.5 border-b border-stone-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 text-xs text-stone-600 shadow-2xs w-full sm:w-auto shrink-0">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-medium">
                  วัตถุดิบทั้งหมด (<span className="font-mono tabular-nums font-bold text-stone-900">{filteredIngredients.length}</span> รายการ)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อวัตถุดิบ, หมวดหมู่..."
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

            {/* Table - Optimized to fit desktop screens without horizontal scroll */}
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEndIngredients}
              >
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-stone-200 bg-stone-50/70">
                      <TableHead className="w-9 px-2 text-center text-stone-900 font-semibold text-xs">#</TableHead>
                      <TableHead className="text-stone-900 font-semibold text-xs min-w-[170px]">ชื่อวัตถุดิบ</TableHead>
                      <TableHead className="text-stone-900 font-semibold text-xs w-28">หมวดหมู่</TableHead>
                      <TableHead className="text-right whitespace-nowrap text-stone-900 font-semibold text-xs w-24">ต้นทุน</TableHead>
                      <TableHead className="text-left whitespace-nowrap text-stone-900 font-semibold text-xs w-48">
                        สต็อกคงเหลือ
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap text-stone-900 font-semibold text-xs w-28">จุดสั่งซื้อ</TableHead>
                      <TableHead className="text-center whitespace-nowrap text-stone-900 font-semibold text-xs w-20">สถานะ</TableHead>
                      <TableHead className="text-center whitespace-nowrap w-28 text-stone-900 font-semibold text-xs">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <TableSkeleton rows={6} cols={8} />
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
                                setAdjustAmount(target.package_size || 1);
                              }}
                              onDelete={handleDelete}
                              onQuickUpdateCost={handleQuickUpdateCost}
                            />
                          );
                        })}
                      </SortableContext>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>

            {/* Pagination */}
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

        {/* Tab 2: Movement History Log View */}
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
                    <TableHead className="text-stone-900 font-semibold text-xs">วัน-เวลา</TableHead>
                    <TableHead className="text-stone-900 font-semibold text-xs">วัตถุดิบ</TableHead>
                    <TableHead className="text-stone-900 font-semibold text-xs">ประเภท</TableHead>
                    <TableHead className="text-right text-stone-900 font-semibold text-xs">จำนวนที่ปรับ</TableHead>
                    <TableHead className="text-right text-stone-900 font-semibold text-xs">คงเหลือสุทธิ</TableHead>
                    <TableHead className="text-stone-900 font-semibold text-xs">หมายเหตุ / เหตุผล</TableHead>
                    <TableHead className="text-stone-900 font-semibold text-xs">ผู้บันทึก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mov) => (
                    <TableRow key={mov.id} className="hover:bg-stone-50/80 transition-colors">
                      <TableCell className="text-stone-500 font-mono tabular-nums text-xs">{mov.created_at}</TableCell>
                      <TableCell className="font-medium text-stone-900 text-xs">{mov.ingredient_name}</TableCell>
                      <TableCell>
                        {mov.type === 'in' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            รับเข้า
                          </span>
                        )}
                        {mov.type === 'open' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                            เปิดใช้งาน
                          </span>
                        )}
                        {mov.type === 'consume' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                            <Coffee className="w-3 h-3 text-stone-500" />
                            ตัดขาย (POS)
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
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
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
                        {mov.quantity > 0 ? `+${formatInteger(mov.quantity)}` : formatInteger(mov.quantity)} {mov.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs text-stone-900 font-semibold">
                        {formatInteger(mov.remaining_quantity)} {mov.unit}
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

        {/* Tab 3: Stock Audit Tab */}
        {activeTab === 'audit' && (
          <StockAuditTab
            ingredients={ingredients}
            onReconcileComplete={() => {
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
 