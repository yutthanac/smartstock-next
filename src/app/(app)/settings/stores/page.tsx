'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth, StoreInfo } from '@/lib/AuthContext';
import {
  Store, Plus, Edit2, Trash2, Coffee, UtensilsCrossed, Cookie,
  Building2, Users, Phone, MapPin, CheckCircle, XCircle, X, Save,
  Upload, Image as ImageIcon, Check, SlidersHorizontal, Palette,
} from 'lucide-react';

import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface StoreDetail {
  id: number;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  logo_path?: string | null;
  logo_url?: string | null;
  theme_color?: string;
  menu_config?: Record<string, boolean>;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  members?: { id: number; name: string; email: string; role: string }[];
}

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  restaurant: UtensilsCrossed,
  cafe:       Coffee,
  bakery:     Cookie,
  other:      Building2,
};

const TYPE_LABELS: Record<string, string> = {
  cafe:       'คาเฟ่ & เครื่องดื่ม',
  bakery:     'เบเกอรี่',
  restaurant: 'ร้านอาหาร',
  other:      'อื่นๆ',
};

const ROLE_LABELS: Record<string, string> = {
  owner:   'เจ้าของ',
  manager: 'ผู้จัดการ',
  staff:   'พนักงาน',
};

const THEME_COLORS = [
  { label: 'ส้มกาแฟ (คาเฟ่)',       value: '#d97706' },
  { label: 'เขียวมรกต (ร้านอาหาร)', value: '#059669' },
  { label: 'แดงกุหลาบ (เบเกอรี่)',   value: '#e11d48' },
  { label: 'ม่วงลาเวนเดอร์',         value: '#7c3aed' },
  { label: 'น้ำเงินโมเดิร์น',        value: '#2563eb' },
];

export const AVAILABLE_MODULES = [
  { key: 'dashboard',       label: 'แดชบอร์ดภาพรวม',       category: 'ภาพรวม' },
  { key: 'pos',             label: 'ขายหน้าร้าน (POS)',     category: 'การขาย' },
  { key: 'orders',          label: 'ประวัติออเดอร์',        category: 'การขาย' },
  { key: 'stock',           label: 'จัดการสต็อกสินค้า',     category: 'คลังสินค้า' },
  { key: 'ingredients',     label: 'วัตถุดิบทั้งหมด',       category: 'คลังสินค้า' },
  { key: 'purchase_orders', label: 'รายการซื้อของ/จ่ายตลาด', category: 'คลังสินค้า' },
  { key: 'menu',            label: 'จัดการเมนู & สินค้า',    category: 'เมนู' },
  { key: 'ai_insights',     label: 'AI วิเคราะห์เมนู',      category: 'เมนู' },
  { key: 'reports_sales',   label: 'รายงานยอดขาย',          category: 'รายงาน' },
  { key: 'reports_profit',  label: 'ต้นทุน & กำไร',         category: 'รายงาน' },
  { key: 'staff',           label: 'รายชื่อพนักงาน',        category: 'ระบบ' },
  { key: 'roles',           label: 'กำหนดสิทธิ์บทบาท',      category: 'ระบบ' },
  { key: 'settings',        label: 'ตั้งค่าระบบ',           category: 'ระบบ' },
];

export default function StoresSettingsPage() {
  const { token, activeStore, setActiveStore, refreshStores } = useAuth();
  const [stores, setStores] = useState<StoreDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editStore, setEditStore] = useState<StoreDetail | null>(null);
  const [expandedStore, setExpandedStore] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'menu_config'>('members');

  // Add Member modal state
  const [addMemberStoreId, setAddMemberStoreId] = useState<number | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'owner' | 'manager' | 'staff'>('staff');
  const [memberLoading, setMemberLoading] = useState(false);

  // Menu Config quick edit state
  const [editingMenuConfig, setEditingMenuConfig] = useState<Record<string, boolean>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  const authHeader = () => ({
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stores`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreDetail = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/stores/${id}`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setStores((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
        if (expandedStore === id) {
          setEditingMenuConfig(data.menu_config || {});
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleToggleExpand = (store: StoreDetail) => {
    if (expandedStore === store.id) {
      setExpandedStore(null);
    } else {
      setExpandedStore(store.id);
      setEditingMenuConfig(store.menu_config || {});
      fetchStoreDetail(store.id);
    }
  };

  const handleSaveStore = async (formData: FormData, storeId?: number) => {
    try {
      const url = storeId ? `${API_BASE_URL}/stores/${storeId}` : `${API_BASE_URL}/stores`;
      // For Laravel multipart update, can send via POST or PUT
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (res.ok) {
        await fetchStores();
        await refreshStores();
        setShowForm(false);
        setEditStore(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบร้านนี้? ข้อมูลทั้งหมดในร้านจะถูกลบด้วย')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/stores/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (res.ok) {
        await fetchStores();
        await refreshStores();
        if (activeStore?.id === id) {
          const nextStore = stores.find((s) => s.id !== id);
          if (nextStore) setActiveStore(nextStore as any);
        }
      }
    } catch (e) {}
  };

  const handleAddMember = async () => {
    if (!addMemberStoreId || !memberEmail) return;
    setMemberLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stores/${addMemberStoreId}/members`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail, role: memberRole }),
      });
      if (res.ok) {
        setMemberEmail('');
        setMemberRole('staff');
        setAddMemberStoreId(null);
        fetchStoreDetail(addMemberStoreId);
      } else {
        const err = await res.json();
        alert(err.message || 'เพิ่มสมาชิกไม่สำเร็จ');
      }
    } catch (e) {} finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (storeId: number, userId: number) => {
    if (!confirm('ยืนยันการนำสมาชิกออกจากร้านนี้?')) return;
    try {
      await fetch(`${API_BASE_URL}/stores/${storeId}/members/${userId}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      fetchStoreDetail(storeId);
    } catch (e) {}
  };

  const handleSaveMenuConfig = async (storeId: number) => {
    setSavingConfig(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stores/${storeId}/menu-config`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu_config: editingMenuConfig }),
      });
      if (res.ok) {
        await fetchStores();
        await refreshStores();
        alert('บันทึกการตั้งค่าสิทธิ์เมนูเรียบร้อยแล้ว');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            จัดการระบบร้านค้า & สิทธิ์เมนู
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            สร้างร้านใหม่, ปรับแต่งหน้ากาก/โลโก้, กำหนดสิทธิ์เมนู และจัดการสมาชิก
          </p>
        </div>
        <Button
          onClick={() => {
            setEditStore(null);
            setShowForm(true);
          }}
          icon={<Plus className="w-4 h-4" />}
          size="sm"
        >
          เพิ่มร้านใหม่
        </Button>
      </div>

      {/* Store List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">กำลังโหลดข้อมูลร้านค้า...</div>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => {
            const Icon = TYPE_ICONS[store.type] ?? Building2;
            const isActive = activeStore?.id === store.id;
            const isExpanded = expandedStore === store.id;
            const sColor = store.theme_color || '#059669';

            return (
              <div
                key={store.id}
                className={`rounded-3xl border-2 bg-white shadow-xs transition-all ${
                  isActive ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-slate-200/90'
                }`}
              >
                {/* Store Main Row */}
                <div className="p-4 flex items-center gap-4">
                  {/* Store Logo or Icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-2xs border border-slate-200/90"
                    style={{ backgroundColor: `${sColor}15` }}
                  >
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="w-6 h-6" style={{ color: sColor }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-base truncate">
                        {store.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-normal bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                          กำลังใช้งาน
                        </span>
                      )}
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${sColor}15`,
                          color: sColor,
                          borderColor: `${sColor}40`,
                        }}
                      >
                        {TYPE_LABELS[store.type] || store.type}
                      </span>
                      <span
                        className={`text-[10px] font-normal px-2 py-0.5 rounded-full border ${
                          store.is_active
                            ? 'bg-slate-50 text-slate-700 border-slate-200'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {store.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {store.description || 'ไม่มีคำอธิบาย'} • /{store.slug}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveStore(store as any);
                          refreshStores();
                        }}
                        className="h-7 px-2.5 text-xs font-normal"
                      >
                        เลือกใช้ร้านนี้
                      </Button>
                    )}

                    <button
                      onClick={() => handleToggleExpand(store)}
                      className={`p-2 rounded-xl text-xs font-normal flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isExpanded
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="ตั้งค่าสิทธิ์เมนูและสมาชิก"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>{isExpanded ? 'ปิด' : 'จัดการ'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditStore(store);
                        setShowForm(true);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="แก้ไขร้านค้า"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(store.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="ลบร้านค้า"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Tabs for Menu Config & Members */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4 bg-slate-50/50 rounded-b-3xl">
                    {/* Tab Buttons */}
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <button
                        onClick={() => setActiveTab('menu_config')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-normal transition-all cursor-pointer ${
                          activeTab === 'menu_config'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        สิทธิ์เมนูของร้านนี้ (Mask Modules)
                      </button>
                      <button
                        onClick={() => setActiveTab('members')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-normal transition-all cursor-pointer ${
                          activeTab === 'members'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        สมาชิกในร้าน ({store.members?.length || 0})
                      </button>
                    </div>

                    {/* Tab 1: Menu Permissions Configuration */}
                    {activeTab === 'menu_config' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">
                            กำหนดว่าบัญชีที่สังกัดหรือเข้าใช้งานร้านนี้ จะมองเห็นเมนูใดในแถบเมนูด้านซ้ายบ้าง
                          </p>
                          <Button
                            onClick={() => handleSaveMenuConfig(store.id)}
                            isLoading={savingConfig}
                            size="sm"
                            icon={<Save className="w-3.5 h-3.5" />}
                          >
                            บันทึกสิทธิ์เมนู
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {AVAILABLE_MODULES.map((mod) => {
                            const isEnabled = editingMenuConfig[mod.key] !== false;

                            return (
                              <label
                                key={mod.key}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-normal cursor-pointer transition-all ${
                                  isEnabled
                                    ? 'bg-white border-slate-400 shadow-2xs text-slate-800'
                                    : 'bg-slate-100/70 border-slate-200 text-slate-400 line-through'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={(e) => {
                                    setEditingMenuConfig((prev) => ({
                                      ...prev,
                                      [mod.key]: e.target.checked,
                                    }));
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400 accent-emerald-600"
                                />
                                <span className="truncate">{mod.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Members Management */}
                    {activeTab === 'members' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">รายชื่อผู้มีสิทธิ์ใช้งานร้านนี้</span>
                          <button
                            onClick={() => setAddMemberStoreId(store.id)}
                            className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> เพิ่มสมาชิกเข้าร้าน
                          </button>
                        </div>

                        {/* Add member form */}
                        {addMemberStoreId === store.id && (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                            <input
                              type="email"
                              placeholder="อีเมลผู้ใช้ (เช่น staff@smartstock.local)"
                              value={memberEmail}
                              onChange={(e) => setMemberEmail(e.target.value)}
                              className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white"
                            />
                            <Dropdown
                              value={memberRole}
                              onChange={(val) => setMemberRole(val as any)}
                              options={[
                                { value: 'owner', label: 'เจ้าของ (Owner)' },
                                { value: 'manager', label: 'ผู้จัดการ (Manager)' },
                                { value: 'staff', label: 'พนักงาน (Staff)' },
                              ]}
                              size="sm"
                              buttonClassName="bg-white border-slate-200 text-slate-800 rounded-xl font-normal"
                            />
                            <Button
                              onClick={handleAddMember}
                              isLoading={memberLoading}
                              size="sm"
                            >
                              เพิ่ม
                            </Button>
                            <button
                              onClick={() => setAddMemberStoreId(null)}
                              className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {store.members && store.members.length > 0 ? (
                          <div className="space-y-2">
                            {store.members.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs"
                              >
                                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-normal">
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{m.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                                </div>
                                <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-700 font-semibold">
                                  {ROLE_LABELS[m.role] ?? m.role}
                                </span>
                                <button
                                  onClick={() => handleRemoveMember(store.id, m.id)}
                                  className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                  title="ลบออกจากร้าน"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-3 bg-white rounded-xl border border-slate-200/60">
                            ยังไม่มีสมาชิกกำหนดเฉพาะร้านนี้ (ผู้ดูแลระบบสามารถเข้าดูได้โดยตรง)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {stores.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold text-slate-600">ยังไม่มีร้านในระบบ</p>
              <p className="text-xs mt-1">กดปุ่ม "เพิ่มร้านใหม่" เพื่อเริ่มต้นสร้างร้านค้าแรก</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Store Modal */}
      {showForm && (
        <StoreFormModal
          store={editStore}
          onSave={handleSaveStore}
          onClose={() => {
            setShowForm(false);
            setEditStore(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Store Form Modal with Logo Upload & Theme Color ────────────────────────

function StoreFormModal({
  store,
  onSave,
  onClose,
}: {
  store: StoreDetail | null;
  onSave: (formData: FormData, storeId?: number) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName]               = useState(store?.name ?? '');
  const [type, setType]               = useState(store?.type ?? 'cafe');
  const [description, setDesc]        = useState(store?.description ?? '');
  const [phone, setPhone]             = useState(store?.phone ?? '');
  const [address, setAddress]         = useState(store?.address ?? '');
  const [themeColor, setThemeColor]   = useState(store?.theme_color ?? '#d97706');
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(store?.logo_url ?? null);
  const [saving, setSaving]           = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append('name', name);
    fd.append('type', type);
    if (description) fd.append('description', description);
    if (phone)       fd.append('phone', phone);
    if (address)     fd.append('address', address);
    fd.append('theme_color', themeColor);

    if (logoFile) {
      fd.append('logo', logoFile);
    }

    // If updating, simulate PUT method for Laravel form-data compatibility
    if (store) {
      fd.append('_method', 'PUT');
    }

    await onSave(fd, store ? store.id : undefined);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-extrabold text-slate-900 text-base">
            {store ? 'แก้ไขข้อมูลร้านค้า & หน้ากากระบบ' : 'เพิ่มร้านค้าใหม่ / สร้างระบบ'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Store Logo Upload with Live Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              โลโก้ร้านค้า (เก็บใน Media / Laravel Storage)
            </label>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/90">
              <div
                className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-white shrink-0"
                style={{ borderColor: themeColor }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  เลือกรูปโลโก้
                </button>
                <p className="text-[11px] text-slate-400 mt-1">
                  รองรับ JPG, PNG, WEBP, SVG ขนาดไม่เกิน 4MB
                </p>
              </div>
            </div>
          </div>

          {/* Store Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อร้านค้า *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Roast & Toast Cafe, Coffee Lab หรือ ร้านป้าสมใจ"
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
            />
          </div>

          {/* Store Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ประเภทร้าน *</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_LABELS).map(([val, label]) => {
                const Icon = TYPE_ICONS[val];
                const isSelected = type === val;

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setType(val);
                      // Auto pick matching theme color if creating new
                      if (!store) {
                        if (val === 'cafe') setThemeColor('#d97706');
                        else if (val === 'bakery') setThemeColor('#e11d48');
                        else if (val === 'restaurant') setThemeColor('#059669');
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-normal transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-100 text-slate-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Color Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              สีประจำร้าน / หน้ากาก (Theme Color)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {THEME_COLORS.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setThemeColor(col.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    themeColor === col.value
                      ? 'border-slate-900 bg-slate-100 font-bold text-slate-900 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: col.value }}
                  />
                  <span>{col.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">คำอธิบายร้าน</label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="รายละเอียดสั้นๆ เช่น คาเฟ่เครื่องดื่มสด เบเกอรี่โฮมเมด..."
              rows={2}
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50 resize-none"
            />
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08x-xxx-xxxx"
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ที่อยู่ร้าน</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ที่ตั้งสาขา"
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              isLoading={saving}
              icon={<Save className="w-4 h-4" />}
              className="flex-1"
            >
              {store ? 'บันทึกการแก้ไข' : 'สร้างร้านค้า'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
