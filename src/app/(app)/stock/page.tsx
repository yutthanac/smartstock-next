'use client';

import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  History,
  TrendingDown,
  TrendingUp,
  Trash2,
  Zap,
  Edit2,
  Calendar,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Ingredient } from '@/types';
import { Dropdown } from '@/components/Dropdown';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import {
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/Table';
import { AddIngredientModal } from './components/AddIngredientModal';
import { AdjustStockModal } from './components/AdjustStockModal';

export default function StockPage() {
  const { ingredients, movements, addIngredient, updateIngredient, deleteIngredient, adjustStock, bulkUseIngredient } = useStock();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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
    reorder_point: number | string;
    cost_per_unit: number | string;
    category: string;
    supplier: string;
    tracking_type: 'strict' | 'bulk_expense';
  }>({
    name: '',
    unit: 'กก.',
    quantity: '',
    reorder_point: '2',
    cost_per_unit: '350',
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

  const handleOpenCreate = () => {
    setEditingTarget(null);
    setFormData({
      name: '',
      unit: 'กก.',
      quantity: '',
      reorder_point: '2',
      cost_per_unit: '350',
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
    const reorder = typeof formData.reorder_point === 'number' ? formData.reorder_point : parseFloat(formData.reorder_point) || 0;
    const cost = typeof formData.cost_per_unit === 'number' ? formData.cost_per_unit : parseFloat(formData.cost_per_unit) || 0;

    let success = false;
    if (editingTarget) {
      success = await updateIngredient(editingTarget.id, {
        name: formData.name.trim(),
        unit: formData.unit,
        quantity: qty,
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
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Topbar
        title="จัดการสต็อกวัตถุดิบ (Stock Management)"
        subtitle="ควบคุมระดับสต็อก จุดสั่งซื้อซ้ำ (Reorder Point) และประวัติการเคลื่อนไหว"
      />

      <main className="p-6 md:p-8 space-y-5 max-w-7xl mx-auto w-full">
        {/* Navigation Sub-tabs & Action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-white text-slate-900 border border-slate-300 font-medium shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 font-normal'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>วัตถุดิบคงเหลือ</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-normal">
                {ingredients.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'movements'
                  ? 'bg-white text-slate-900 border border-slate-300 font-medium shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 font-normal'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>ประวัติการปรับสต็อก</span>
            </button>
          </div>

          <Button
            onClick={handleOpenCreate}
            icon={<Plus className="w-3.5 h-3.5" />}
            size="sm"
          >
            เพิ่มวัตถุดิบใหม่
          </Button>
        </div>

        {activeTab === 'inventory' ? (
          /* Inventory Table View */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3.5 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Date / Category Pill Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 shadow-2xs w-full sm:w-auto">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-normal">วัตถุดิบทั้งหมด ({filteredIngredients.length} รายการ)</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* Search Box */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อวัตถุดิบ..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors font-normal"
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
                  size="sm"
                  className="w-full sm:w-44"
                  buttonClassName="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-normal"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>ชื่อวัตถุดิบ</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead className="text-center">การตัดสต็อก</TableHead>
                    <TableHead className="text-right">ต้นทุน/หน่วย</TableHead>
                    <TableHead className="text-center w-36">ระดับสต็อก</TableHead>
                    <TableHead className="text-right">คงเหลือ</TableHead>
                    <TableHead className="text-right">จุดสั่งซื้อ</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedIngredients.map((item) => {
                    const ratio = Math.min(100, Math.round((item.quantity / (item.reorder_point * 2 || 1)) * 100));

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-normal text-slate-800">{item.name}</div>
                          {item.supplier && (
                            <div className="text-[10px] text-slate-400 font-normal">ซัพพลายเออร์: {item.supplier}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 font-normal">{item.category || '-'}</TableCell>
                        <TableCell className="text-center">
                          {item.tracking_type === 'bulk_expense' ? (
                            <Badge
                              variant="warning"
                              size="sm"
                              title="ตัดสต็อกเมื่อเปิดใช้/หมดจริง ไม่ตัดเศษตามจานขาย"
                            >
                              เบิกใช้/หมดจริง
                            </Badge>
                          ) : (
                            <Badge
                              variant="neutral"
                              size="sm"
                              title="ตัดสต็อกอัตโนมัติตามจานขายของ POS"
                            >
                              วัตถุดิบหลัก
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50/80 text-slate-500 text-xs font-mono inline-block font-normal">
                            ฿{item.cost_per_unit}/{item.unit}
                          </span>
                        </TableCell>

                        {/* Sleek Stock Level Tube */}
                        <TableCell className="text-center w-36">
                          <div className="flex flex-col gap-1 w-28 mx-auto">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-normal">
                              <span>{ratio}%</span>
                              <span>{item.quantity}/{Math.round(item.reorder_point * 2 || 1)}</span>
                            </div>

                            <div className="w-full bg-slate-100 border border-slate-200 h-1.5 rounded-full overflow-hidden relative">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.status === 'out'
                                    ? 'bg-transparent'
                                    : item.status === 'low'
                                    ? 'bg-amber-400'
                                    : 'bg-slate-700'
                                }`}
                                style={{ width: `${Math.max(item.status === 'out' ? 0 : 4, ratio)}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-normal text-slate-700 text-xs font-mono">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-right text-slate-400 font-normal text-xs font-mono">
                          {item.reorder_point} {item.unit}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.status === 'normal' && (
                            <Badge variant="outline" size="sm">
                              ปกติ
                            </Badge>
                          )}
                          {item.status === 'low' && (
                            <Badge variant="warning" size="sm">
                              ใกล้หมด
                            </Badge>
                          )}
                          {item.status === 'out' && (
                            <Badge variant="danger" size="sm">
                              สต็อกหมด
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลวัตถุดิบ"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAdjustTarget(item);
                                setAdjustType('in');
                                setAdjustAmount(1);
                              }}
                              className="h-7 px-2.5 text-[11px] font-normal"
                            >
                              ปรับสต็อก
                            </Button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination: only displays if items > 8 */}
            <div className="p-3 border-t border-slate-100">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredIngredients.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        ) : (
          /* Movement History Log View */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h3 className="font-normal text-slate-800 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              บันทึกประวัติการปรับสต็อก
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>วัน-เวลา</TableHead>
                    <TableHead>วัตถุดิบ</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">จำนวนที่ปรับ</TableHead>
                    <TableHead className="text-right">คงเหลือสุทธิ</TableHead>
                    <TableHead>หมายเหตุ / เหตุผล</TableHead>
                    <TableHead>ผู้บันทึก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-slate-400 font-mono text-[11px]">{mov.created_at}</TableCell>
                      <TableCell className="font-normal text-slate-800">{mov.ingredient_name}</TableCell>
                      <TableCell>
                        {mov.type === 'in' && (
                          <Badge variant="neutral" size="sm" icon={<TrendingUp className="w-3 h-3 text-slate-500" />}>
                            รับเข้า
                          </Badge>
                        )}
                        {mov.type === 'out' && (
                          <Badge variant="outline" size="sm" icon={<TrendingDown className="w-3 h-3 text-slate-400" />}>
                            ตัดขาย (POS)
                          </Badge>
                        )}
                        {mov.type === 'waste' && (
                          <Badge variant="warning" size="sm">
                            ของเสีย/ทิ้ง
                          </Badge>
                        )}
                        {mov.type === 'adjust' && (
                          <Badge variant="neutral" size="sm">
                            ปรับยอดนับสต็อก
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-normal ${
                          mov.quantity > 0 ? 'text-slate-700' : 'text-slate-500'
                        }`}
                      >
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} {mov.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono font-normal text-slate-600">
                        {mov.remaining_quantity} {mov.unit}
                      </TableCell>
                      <TableCell className="text-slate-500 font-normal">{mov.note || '-'}</TableCell>
                      <TableCell className="text-slate-400 font-normal">{mov.staff_name || '-'}</TableCell>
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
