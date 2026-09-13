'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Store,
  Database,
  Scale,
  Plus,
  Trash2,
  CheckCircle2,
  Pencil,
  Check,
  X,
  Tag,
  Layers,
  Sliders,
} from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';
import { UnitSetting } from '@/types';
import StoresSettingsPage from './stores/page';
import SidebarCustomizer from './components/SidebarCustomizer';

export default function SettingsPage() {
  const { units, addUnit, updateUnit, deleteUnit } = useStock();
  const { user, hasRole } = useAuth();

  useEffect(() => {
    if (user && !hasRole('admin')) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const [activeTab, setActiveTab] = useState<'sidebar' | 'stores' | 'units'>('sidebar');

  // Form states for adding new unit
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitDesc, setNewUnitDesc] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const handleAddUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) {
      alert('กรุณากรอกชื่อหน่วย');
      return;
    }

    const success = await addUnit(newUnitName, newUnitDesc);
    if (success) {
      setNewUnitName('');
      setNewUnitDesc('');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    }
  };

  // Edit states
  const [editingUnitId, setEditingUnitId] = useState<number | string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDesc, setEditingDesc] = useState('');

  const handleStartEdit = (unit: UnitSetting) => {
    setEditingUnitId(unit.id);
    setEditingName(unit.name);
    setEditingDesc(unit.description || '');
  };

  const handleCancelEdit = () => {
    setEditingUnitId(null);
  };

  const handleSaveEdit = async (id: number | string) => {
    if (!editingName.trim()) {
      alert('กรุณากรอกชื่อหน่วย');
      return;
    }

    const success = await updateUnit(id, editingName, editingDesc);
    if (success) {
      setEditingUnitId(null);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    }
  };

  const handleDeleteUnit = async (id: number | string, name: string) => {
    if (confirm(`คุณต้องการลบหน่วย "${name}" หรือไม่?`)) {
      await deleteUnit(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar
        title="ตั้งค่าระบบ"
        subtitle="จัดการหน่วยนับ ปรับแต่งเมนู และสิทธิ์ร้านค้า"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl w-fit border border-stone-200/80">
          <button
            onClick={() => setActiveTab('sidebar')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sidebar'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>เมนู Sidebar</span>
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'stores'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ร้านค้า</span>
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'units'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>หน่วยนับ ({units.length})</span>
          </button>
        </div>

        {/* Tab: Sidebar Management */}
        {activeTab === 'sidebar' && (
          <SidebarCustomizer />
        )}

        {/* Tab: Stores Management */}
        {activeTab === 'stores' && (
          <div className="bg-white rounded-3xl shadow-xs border border-stone-200/90 overflow-hidden">
            <StoresSettingsPage />
          </div>
        )}

        {/* Tab 1: Unit Management */}
        {activeTab === 'units' && (
          <div className="space-y-6">
            {/* Add New Unit Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 text-base">เพิ่มหน่วยนับใหม่เข้าระบบ</h3>
                    <p className="text-xs text-stone-500">
                      หน่วยที่บันทึกตรงนี้จะปรากฏให้เลือกในระบบสต็อกและใบจัดซื้อ/จ่ายตลาดทันที
                    </p>
                  </div>
                </div>
                {saveToast && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-stone-800 bg-stone-100 px-3 py-1 rounded-full border border-stone-200 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" /> บันทึกสำเร็จ!
                  </span>
                )}
              </div>

              <form onSubmit={handleAddUnitSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-1 space-y-1">
                  <label className="font-medium text-stone-800">
                    ชื่อหน่วยนับ / ตัวย่อ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กก., กรัม, ลิตร, ขวด, แพ็ค..."
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200/80 text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
                  />
                </div>

                <div className="sm:col-span-1 space-y-1">
                  <label className="font-medium text-stone-800">คำอธิบายเพิ่มเติม (ไม่บังคับ)</label>
                  <input
                    type="text"
                    placeholder="เช่น กิโลกรัม, ขวดแก้ว..."
                    value={newUnitDesc}
                    onChange={(e) => setNewUnitDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200/80 text-stone-900 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
                  />
                </div>

                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Save className="w-4 h-4" /> + บันทึกหน่วยนับ
                  </button>
                </div>
              </form>
            </div>

            {/* Units List Table */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-900 text-base flex items-center gap-2">
                    <Scale className="w-5 h-5 text-stone-800" />
                    รายการหน่วยนับที่มีอยู่ในระบบ ({units.length} หน่วย)
                  </h3>
                  <p className="text-xs text-stone-500">หน่วยนับเหล่านี้จะปรากฏในเมนูเลือกของระบบสต็อกและจัดซื้อทันที</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 w-16 text-center">#</th>
                      <th className="py-3 px-4 font-semibold">ชื่อหน่วยนับ</th>
                      <th className="py-3 px-4 font-semibold">คำอธิบาย</th>
                      <th className="py-3 px-4 text-center w-24">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {units.map((unit, idx) => {
                      const isEditing = editingUnitId === unit.id;
                      return (
                        <tr key={unit.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 text-center text-stone-400 font-mono tabular-nums">{idx + 1}</td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="w-28 px-2 py-1 bg-stone-50 rounded-lg border border-stone-300 font-medium text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
                                autoFocus
                              />
                            ) : (
                              <span className="font-semibold text-stone-900 text-sm">{unit.name}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingDesc}
                                onChange={(e) => setEditingDesc(e.target.value)}
                                placeholder="คำอธิบายเพิ่มเติม..."
                                className="w-full max-w-sm px-2 py-1 bg-stone-50 rounded-lg border border-stone-300 text-stone-700 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                              />
                            ) : (
                              <span>{unit.description || '-'}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(unit.id)}
                                  className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer shadow-xs"
                                  title="บันทึกการแก้ไข"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer border border-stone-200"
                                  title="ยกเลิก"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(unit)}
                                  className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
                                  title="แก้ไขหน่วยนี้"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUnit(unit.id, unit.name)}
                                  className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="ลบหน่วยนี้"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
