'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { useStock } from '@/lib/StockContext';
import { UnitSetting } from '@/types';

export default function SettingsPage() {
  const { units, addUnit, updateUnit, deleteUnit } = useStock();

  const [activeTab, setActiveTab] = useState<'store' | 'units' | 'api'>('units');

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
    setEditingName('');
    setEditingDesc('');
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
    if (confirm(`คุณต้องการลบหน่วยนับ "${name}" ออกจากระบบหรือไม่?`)) {
      await deleteUnit(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#ebecf0]">
      <Topbar
        title="ตั้งค่าระบบ (System Settings)"
        subtitle="จัดการหน่วยนับวัตถุดิบ ข้อมูลร้านอาหาร และการเชื่อมต่อระบบ"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 skeuo-inset p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('units')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'units'
                ? 'neu-raised text-emerald-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>จัดการหน่วยนับวัตถุดิบ ({units.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'store'
                ? 'neu-raised text-emerald-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>ข้อมูลร้านอาหาร</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'api'
                ? 'neu-raised text-emerald-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>เชื่อมต่อ Backend API</span>
          </button>
        </div>

        {/* Tab 1: Unit Management */}
        {activeTab === 'units' && (
          <div className="space-y-6">
            {/* Add New Unit Card */}
            <div className="skeuo-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl skeuo-inset flex items-center justify-center text-emerald-800">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">เพิ่มหน่วยนับใหม่เข้าระบบ</h3>
                    <p className="text-xs text-slate-500">
                      หน่วยที่บันทึกตรงนี้จะปรากฏให้เลือกในระบบสต็อกและใบจัดซื้อ/จ่ายตลาดทันที
                    </p>
                  </div>
                </div>
                {saveToast && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกสำเร็จ!
                  </span>
                )}
              </div>

              <form onSubmit={handleAddUnitSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-1 space-y-1">
                  <label className="font-bold text-slate-800">
                    ชื่อหน่วยนับ / ตัวย่อ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กก., กรัม, ลิตร, ขวด, แพ็ค..."
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="w-full p-2.5 skeuo-input rounded-xl text-slate-800 font-bold focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1 space-y-1">
                  <label className="font-bold text-slate-800">คำอธิบายเพิ่มเติม (ไม่บังคับ)</label>
                  <input
                    type="text"
                    placeholder="เช่น กิโลกรัม, ขวดแก้ว..."
                    value={newUnitDesc}
                    onChange={(e) => setNewUnitDesc(e.target.value)}
                    className="w-full p-2.5 skeuo-input rounded-xl text-slate-800 font-medium focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl skeuo-btn-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> + บันทึกหน่วยนับ
                  </button>
                </div>
              </form>
            </div>

            {/* Units List Table */}
            <div className="skeuo-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-800" />
                    รายการหน่วยนับที่มีอยู่ในระบบ ({units.length} หน่วย)
                  </h3>
                  <p className="text-xs text-slate-500">หน่วยนับเหล่านี้จะปรากฏในเมนูเลือกของระบบสต็อกและจัดซื้อทันที</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-200/60 border-b border-slate-300/70 text-slate-700 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4 w-16 text-center">#</th>
                      <th className="py-3 px-4 font-bold">ชื่อหน่วยนับ</th>
                      <th className="py-3 px-4 font-bold">คำอธิบาย</th>
                      <th className="py-3 px-4 text-center w-24">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {units.map((unit, idx) => {
                      const isEditing = editingUnitId === unit.id;
                      return (
                        <tr key={unit.id} className="hover:bg-slate-200/30 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="w-28 p-1.5 skeuo-input rounded-lg font-bold text-slate-900 text-sm focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              <span className="font-black text-slate-900 text-base">{unit.name}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingDesc}
                                onChange={(e) => setEditingDesc(e.target.value)}
                                placeholder="คำอธิบายเพิ่มเติม..."
                                className="w-full max-w-sm p-1.5 skeuo-input rounded-lg text-slate-700 text-xs focus:outline-none"
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
                                  className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                                  title="บันทึกการแก้ไข"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
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
                                  className="p-1.5 rounded-xl hover:bg-emerald-100 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                                  title="แก้ไขหน่วยนี้"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUnit(unit.id, unit.name)}
                                  className="p-1.5 rounded-xl hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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

        {/* Tab 2: Store Information */}
        {activeTab === 'store' && (
          <div className="skeuo-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-300/60">
              <Store className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-slate-900 text-base">ข้อมูลร้านอาหาร</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ชื่อร้านอาหาร</label>
                <input
                  type="text"
                  defaultValue="Smart Gourmet & Bistro"
                  className="w-full p-2.5 skeuo-input rounded-xl focus:outline-none font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">สาขา</label>
                <input
                  type="text"
                  defaultValue="สาขาหลัก (Main Kitchen)"
                  className="w-full p-2.5 skeuo-input rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">อัตราภาษีมูลค่าเพิ่ม (VAT %)</label>
                <input
                  type="number"
                  defaultValue="7"
                  className="w-full p-2.5 skeuo-input rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  defaultValue="02-123-4567"
                  className="w-full p-2.5 skeuo-input rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button className="px-5 py-2.5 rounded-xl skeuo-btn-primary font-bold text-xs flex items-center gap-2 cursor-pointer">
                <Save className="w-4 h-4" /> บันทึกข้อมูลร้าน
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Backend API */}
        {activeTab === 'api' && (
          <div className="skeuo-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-300/60">
              <Database className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-slate-900 text-base">การเชื่อมต่อ Backend (Laravel API)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Laravel API Endpoint (NEXT_PUBLIC_API_URL)
                </label>
                <input
                  type="text"
                  defaultValue="http://localhost:8000/api"
                  className="w-full p-2.5 skeuo-input rounded-xl focus:outline-none font-mono text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  เชื่อมต่อ Laravel REST API บน Laragon (เช่น http://stockapp.test/api หรือ http://localhost:8000/api)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-center justify-between">
                <span>สถานะเชื่อมต่อ: พร้อมใช้งาน (โหมด Local Client-Side Cache & Fallback เปิดใช้งานอยู่)</span>
                <span className="font-bold">Online</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button className="px-5 py-2.5 rounded-xl skeuo-btn-primary font-bold text-xs flex items-center gap-2 cursor-pointer">
                <Save className="w-4 h-4" /> บันทึกการเชื่อมต่อ
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
