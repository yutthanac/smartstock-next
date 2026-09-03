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
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Ingredient } from '@/types';
import { Dropdown } from '@/components/Dropdown';
import { Pagination } from '@/components/Pagination';
import { AddIngredientModal } from './components/AddIngredientModal';
import { AdjustStockModal } from './components/AdjustStockModal';

export default function StockPage() {
  const { ingredients, movements, addIngredient, deleteIngredient, adjustStock } = useStock();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
  }>({
    name: '',
    unit: 'กก.',
    quantity: '',
    reorder_point: '5',
    cost_per_unit: '100',
    category: 'เนื้อสัตว์',
    supplier: '',
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

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('กรุณากรอกชื่อวัตถุดิบ');
      return;
    }

    const qty = typeof formData.quantity === 'number' ? formData.quantity : parseFloat(formData.quantity) || 0;
    const reorder = typeof formData.reorder_point === 'number' ? formData.reorder_point : parseFloat(formData.reorder_point) || 0;
    const cost = typeof formData.cost_per_unit === 'number' ? formData.cost_per_unit : parseFloat(formData.cost_per_unit) || 0;

    const success = await addIngredient({
      name: formData.name.trim(),
      unit: formData.unit,
      quantity: qty,
      reorder_point: reorder,
      cost_per_unit: cost,
      category: formData.category,
      supplier: formData.supplier.trim() || undefined,
    });

    if (success) {
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        unit: 'กก.',
        quantity: '',
        reorder_point: '5',
        cost_per_unit: '100',
        category: 'เนื้อสัตว์',
        supplier: '',
      });
    } else {
      alert('ไม่สามารถเพิ่มวัตถุดิบได้ กรุณาลองใหม่อีกครั้ง');
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
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar
        title="จัดการสต็อกวัตถุดิบ (Stock Management)"
        subtitle="ควบคุมระดับสต็อก จุดสั่งซื้อซ้ำ (Reorder Point) และประวัติการเคลื่อนไหว"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Sub-tabs & Action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-xl text-sm font-normal transition-all flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'bg-[#12312d] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-4 h-4" />
              วัตถุดิบคงเหลือ ({ingredients.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-4 py-2 rounded-xl text-sm font-normal transition-all flex items-center gap-2 ${
                activeTab === 'movements'
                  ? 'bg-[#12312d] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              ประวัติการปรับสต๊อค
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#4fb0a5] hover:bg-[#3d9b90] text-slate-950 font-normal text-sm shadow-lg shadow-[#4fb0a5]/20 flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> เพิ่มวัตถุดิบใหม่
          </button>
        </div>

        {activeTab === 'inventory' ? (
          /* Inventory Table View */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อวัตถุดิบ..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30 focus:border-[#4fb0a5]"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
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
                  className="w-full sm:w-48"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300  uppercase tracking-wide font-bold text-slate-800">
                    <th className="py-3.5 px-4">ชื่อวัตถุดิบ</th>
                    <th className="py-3.5 px-4">หมวดหมู่</th>
                    <th className="py-3.5 px-4 text-right">ต้นทุน/หน่วย</th>
                    <th className="py-3.5 px-4 text-center">ระดับสต็อก</th>
                    <th className="py-3.5 px-4 text-right">จำนวนคงเหลือ</th>
                    <th className="py-3.5 px-4 text-right">จุดสั่งซื้อ</th>
                    <th className="py-3.5 px-4 text-center">สถานะ</th>
                    <th className="py-3.5 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedIngredients.map((item) => {
                    const ratio = Math.min(100, Math.round((item.quantity / (item.reorder_point * 2 || 1)) * 100));

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-normal text-slate-800">
                          {item.name}
                          {item.supplier && (
                            <div className="text-[11px] text-slate-400 font-normal">ซัพพลายเออร์: {item.supplier}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{item.category || '-'}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                          ฿{item.cost_per_unit} / {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center w-36">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.status === 'out'
                                  ? 'bg-rose-600'
                                  : item.status === 'low'
                                  ? 'bg-amber-500'
                                  : 'bg-[#4fb0a5]'
                              }`}
                              style={{ width: `${ratio}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-normal text-slate-900 text-sm">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                          {item.reorder_point} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.status === 'normal' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" /> ปกติ
                            </span>
                          )}
                          {item.status === 'low' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> ใกล้หมด
                            </span>
                          )}
                          {item.status === 'out' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" /> สต็อกหมด
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setAdjustTarget(item);
                                setAdjustType('in');
                                setAdjustAmount(1);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#4fb0a5]/20 hover:text-[#12312d] text-slate-700 font-bold text-xs transition-colors"
                            >
                              ปรับสต็อก
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination: only displays if items > 8 */}
            <div className="p-4 pt-0">
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
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <History className="w-5 h-5 text-[#4fb0a5]" />
              บันทึกประวัติการปรับสต็อก
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-300 border border-slate-400 rounded-lg uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">วัน-เวลา</th>
                    <th className="py-3 px-4">วัตถุดิบ</th>
                    <th className="py-3 px-4">ประเภท</th>
                    <th className="py-3 px-4 text-right">จำนวนที่ปรับ</th>
                    <th className="py-3 px-4 text-right">คงเหลือสุทธิ</th>
                    <th className="py-3 px-4">หมายเหตุ / เหตุผล</th>
                    <th className="py-3 px-4">ผู้บันทึก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-500 font-mono">{mov.created_at}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{mov.ingredient_name}</td>
                      <td className="py-3 px-4">
                        {mov.type === 'in' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700">
                            <TrendingUp className="w-3 h-3" /> รับเข้า
                          </span>
                        )}
                        {mov.type === 'out' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700">
                            <TrendingDown className="w-3 h-3" /> ตัดขาย (POS)
                          </span>
                        )}
                        {mov.type === 'waste' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700">
                            ของเสีย/ทิ้ง
                          </span>
                        )}
                        {mov.type === 'adjust' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                            ปรับยอดนับสต็อก
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          mov.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} {mov.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {mov.remaining_quantity} {mov.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{mov.note}</td>
                      <td className="py-3 px-4 text-slate-500">{mov.staff_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modular Add Ingredient Modal */}
      <AddIngredientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateIngredient}
        formData={formData}
        setFormData={setFormData}
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
