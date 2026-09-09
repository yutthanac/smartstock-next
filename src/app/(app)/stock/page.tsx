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
  FileCheck,
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
import { ReceiptInboundTab } from './components/ReceiptInboundTab';
import { TableSkeleton } from '@/components/Skeleton';

interface SortableIngredientRowProps {
  item: Ingredient;
  ratio: number;
  maxStock: number;
  onOpenEdit: (item: Ingredient) => void;
  onAdjust: (item: Ingredient) => void;
  onDelete: (id: number, name: string) => void;
}

function SortableIngredientRow({
  item,
  ratio,
  maxStock,
  onOpenEdit,
  onAdjust,
  onDelete,
}: SortableIngredientRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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
        {item.tracking_type === 'bulk_expense' ? (
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

      {/* Sleek Stock Level Tube */}
      <TableCell className="text-center w-36">
        <div className="flex flex-col gap-1 w-28 mx-auto">
          <div className="flex items-center justify-between text-xs text-stone-400 font-mono tabular-nums font-normal">
            <span>{ratio}%</span>
            <span>{item.quantity}/{maxStock}</span>
          </div>

          <div className="w-full bg-stone-100 border border-stone-200 h-1.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                item.status === 'out'
                  ? 'bg-transparent'
                  : item.status === 'low'
                  ? 'bg-amber-500'
                  : 'bg-stone-800'
              }`}
              style={{ width: `${Math.max(item.status === 'out' ? 0 : 4, ratio)}%` }}
            ></div>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-right font-normal text-stone-700 text-xs font-mono tabular-nums">
        {item.quantity} {item.unit}
      </TableCell>
      <TableCell className="text-right text-stone-400 font-normal text-xs font-mono tabular-nums">
        {item.reorder_point} {item.unit}
      </TableCell>
      <TableCell className="text-center">
        {item.status === 'normal' && (
          <Badge variant="outline" size="sm" className="border-stone-200 text-stone-700">
            ปกติ
          </Badge>
        )}
        {item.status === 'low' && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
            ใกล้หมด
          </span>
        )}
        {item.status === 'out' && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
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
            className="h-7 px-2.5 text-xs font-normal border-stone-200 text-stone-700 hover:bg-stone-50"
          >
            ปรับสต็อก
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
  const { ingredients, movements, addIngredient, updateIngredient, deleteIngredient, adjustStock, reorderIngredients, isLoading } = useStock();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'inbound' | 'movements'>('inventory');
  const [pendingReceiptsCount, setPendingReceiptsCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Track pending receipts from POs in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartstock_shopping_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        const count = parsed.filter((p: any) => p.status === 'receipt_uploaded').length;
        setPendingReceiptsCount(count);
      }
    } catch {}
  }, [activeTab]);

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
  });

  const filteredIngredients = ingredients.filter((ing) => {
    const matchSearch = ing.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || ing.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginatedIngredients = filteredIngredients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const paginatedIngredientIds = React.useMemo(
    () => paginatedIngredients.map((i) => i.id),
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
    });
    setIsAddModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('กรุณากรอกชื่อวัตถุดิบ');
      return;
    }

    const qty = typeof formData.quantity === 'number' ? formData.quantity : parseFloat(formData.quantity) || 0;
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
      });
    }

    if (success) {
      setIsAddModalOpen(false);
      setEditingTarget(null);
      setFormData({
        name: '',
        unit: 'กก.',
        quantity: '',
        max_stock: '',
        reorder_point: '2',
        cost_per_unit: '350',
        category: 'เมล็ดกาแฟ & ชา',
        supplier: '',
        tracking_type: 'strict',
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

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">
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
              <Boxes className="w-3.5 h-3.5" />
              <span>วัตถุดิบคงเหลือ</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-stone-200 text-stone-700 font-mono tabular-nums font-medium">
                {ingredients.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('inbound')}
              className={`h-9 px-3.5 rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'inbound'
                  ? 'bg-white text-stone-900 border border-stone-200 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-stone-700" />
              <span>ตรวจสอบ & รับเข้าจากบิล</span>
              {pendingReceiptsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-stone-900 text-white font-mono tabular-nums font-medium shadow-2xs">
                  {pendingReceiptsCount} บิลใหม่
                </span>
              )}
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
                      <TableHead className="text-center w-36 whitespace-nowrap text-stone-900 font-semibold">ระดับสต็อก</TableHead>
                      <TableHead className="text-right whitespace-nowrap text-stone-900 font-semibold">คงเหลือ</TableHead>
                      <TableHead className="text-right whitespace-nowrap text-stone-900 font-semibold">จุดสั่งซื้อ</TableHead>
                      <TableHead className="text-center whitespace-nowrap text-stone-900 font-semibold">สถานะ</TableHead>
                      <TableHead className="text-center whitespace-nowrap w-28 text-stone-900 font-semibold">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <TableSkeleton rows={6} cols={7} />
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

        {/* Receipt Inbound Tab */}
        {activeTab === 'inbound' && (
          <ReceiptInboundTab />
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
                        {mov.type === 'out' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-600 border border-stone-200">
                            <TrendingDown className="w-3 h-3 text-stone-400" />
                            ตัดขาย (POS)
                          </span>
                        )}
                        {mov.type === 'waste' && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            ของเสีย/ทิ้ง
                          </span>
                        )}
                        {mov.type === 'adjust' && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
                            ปรับยอดนับสต็อก
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
    </div>
  );
}
