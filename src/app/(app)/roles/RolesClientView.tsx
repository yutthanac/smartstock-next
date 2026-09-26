'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Check,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Info,
  Sliders,
  Plus,
  Trash2,
  Store as StoreIcon,
  ChevronDown,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

interface RoleData {
  id: string | number;
  store_id?: number | null;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  is_system?: boolean;
}

interface PermissionItem {
  id: string;
  name: string;
  display_name: string;
  category: string;
  description?: string;
}

interface PermissionCategories {
  [category: string]: PermissionItem[];
}

interface StoreOption {
  id: number;
  name: string;
  type?: string;
  slug?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const categoryLabels: { [key: string]: { label: string; desc: string } } = {
  dashboard: { label: 'แดชบอร์ด & รายงาน', desc: 'การเข้าถึงหน้าภาพรวม ยอดขาย และผลกำไร' },
  inventory: { label: 'คลังสต็อก & วัตถุดิบ', desc: 'การดูและปรับยอดสต็อก นำเข้า ของเสีย' },
  menu: { label: 'เมนูอาหาร & สูตร', desc: 'การจัดการเมนู ราคา และอัตราการใช้วัตถุดิบ' },
  pos: { label: 'ระบบขายหน้าร้าน', desc: 'การเปิดโต๊ะ เลือกเมนู และรับชำระเงิน' },
  system: { label: 'ระบบ & จัดการผู้ใช้', desc: 'การเพิ่ม ลบ แก้ไข และกำหนดสิทธิ์พนักงาน' },
  general: { label: 'สิทธิ์ทั่วไป', desc: 'สิทธิ์การใช้งานพื้นฐาน' },
};

interface RolesClientViewProps {
  initialRolesData?: any;
}

export function RolesClientView({ initialRolesData }: RolesClientViewProps) {
  const { token, user: currentUser, activeStore, hasRole } = useAuth();

  const [roles, setRoles] = useState<RoleData[]>(initialRolesData?.roles || []);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(
    initialRolesData?.roles?.[0] || null
  );
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategories>(
    initialRolesData?.permission_categories || {}
  );
  const [currentPermissions, setCurrentPermissions] = useState<string[]>(
    initialRolesData?.roles?.[0]?.permissions || []
  );
  const [editDisplayName, setEditDisplayName] = useState<string>(
    initialRolesData?.roles?.[0]?.display_name || ''
  );
  const [editDescription, setEditDescription] = useState<string>(
    initialRolesData?.roles?.[0]?.description || ''
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'matrix'>('card');
  const [matrixDraft, setMatrixDraft] = useState<Record<string | number, string[]>>({});

  // Multi-store switcher for Admin
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(
    activeStore?.id ? Number(activeStore.id) : null
  );

  // New role modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleTemplate, setNewRoleTemplate] = useState('staff');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Delete confirmation
  const [roleToDelete, setRoleToDelete] = useState<RoleData | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';

  const fetchRoleData = async (storeIdOverride?: number | null) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null);
      const targetStoreId = storeIdOverride !== undefined ? storeIdOverride : (selectedStoreId || activeStore?.id);

      const params = new URLSearchParams();
      if (targetStoreId) {
        params.append('store_id', String(targetStoreId));
      }

      const res = await fetch(`${API_BASE_URL}/roles-permissions?${params.toString()}`, {
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          ...(targetStoreId ? { 'X-Store-ID': String(targetStoreId) } : {}),
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'ไม่สามารถโหลดข้อมูลสิทธิ์ได้');
      }

      const data = await res.json();
      setRoles(data.roles || []);
      setPermissionCategories(data.permission_categories || {});
      if (data.stores) {
        setStores(data.stores);
      }
      if (data.current_store?.id) {
        setSelectedStoreId(data.current_store.id);
      }

      if (data.roles && data.roles.length > 0) {
        // Keep currently selected role if possible
        const existing = data.roles.find((r: RoleData) => r.id === selectedRole?.id || r.name === selectedRole?.name);
        const active = existing || data.roles[0];
        setSelectedRole(active);
        setCurrentPermissions(active.permissions || []);
        setEditDisplayName(active.display_name || '');
        setEditDescription(active.description || '');

        const draft: Record<string | number, string[]> = {};
        data.roles.forEach((r: RoleData) => { draft[r.id] = [...(r.permissions || [])]; });
        setMatrixDraft(draft);
      }
    } catch (e: any) {
      console.error('API fetch error in RolesPermissionPage:', e);
      setErrorMsg(e.message || 'ไม่สามารถเชื่อมต่อกับ Backend API ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Both admin and owner can manage roles (admin: all stores, owner: their own store)
    if (currentUser && !hasRole('admin') && !hasRole('owner')) {
      window.location.href = '/dashboard';
      return;
    }
    fetchRoleData();
  }, [token, currentUser, activeStore?.id]);

  const handleSelectRole = (role: RoleData) => {
    setSelectedRole(role);
    setCurrentPermissions([...(role.permissions || [])]);
    setEditDisplayName(role.display_name || '');
    setEditDescription(role.description || '');
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleTogglePermission = (permName: string) => {
    if (selectedRole?.name === 'admin') {
      return; // Admin always full access
    }

    setCurrentPermissions((prev) => {
      if (prev.includes(permName)) {
        return prev.filter((p) => p !== permName);
      } else {
        return [...prev, permName];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null);
      const res = await fetch(`${API_BASE_URL}/roles-permissions/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          Accept: 'application/json',
        },
        body: JSON.stringify({
          display_name: editDisplayName || selectedRole.display_name,
          description: editDescription,
          permissions: currentPermissions,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'บันทึกการเปลี่ยนแปลงไม่สำเร็จ');
      }

      const resData = await res.json();
      setSuccessMsg(`อัปเดตสิทธิ์สำหรับตำแหน่ง "${editDisplayName || selectedRole.display_name}" เรียบร้อยแล้ว`);

      // Update local state
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id
            ? { ...r, display_name: editDisplayName, description: editDescription, permissions: currentPermissions }
            : r
        )
      );
      if (selectedRole) {
        setSelectedRole({
          ...selectedRole,
          display_name: editDisplayName,
          description: editDescription,
          permissions: currentPermissions,
        });
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategory = (categoryKey: string) => {
    const items = permissionCategories[categoryKey] || [];
    const itemNames = items.map((i) => i.name);
    const allSelected = itemNames.every((name) => currentPermissions.includes(name));

    if (allSelected) {
      setCurrentPermissions((prev) => prev.filter((name) => !itemNames.includes(name)));
    } else {
      setCurrentPermissions((prev) => Array.from(new Set([...prev, ...itemNames])));
    }
  };

  // Matrix optimistic toggle
  const handleMatrixToggle = async (roleId: string | number, permName: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role || role.name === 'admin') return;

    const current = matrixDraft[roleId] || [];
    const newPerms = current.includes(permName)
      ? current.filter((p) => p !== permName)
      : [...current, permName];

    setMatrixDraft((prev) => ({ ...prev, [roleId]: newPerms }));

    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null);
      const res = await fetch(`${API_BASE_URL}/roles-permissions/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          Accept: 'application/json',
        },
        body: JSON.stringify({ permissions: newPerms }),
      });
      if (!res.ok) {
        setMatrixDraft((prev) => ({ ...prev, [roleId]: current }));
        setErrorMsg('บันทึกสิทธิ์ไม่สำเร็จ');
      } else {
        setRoles((prev) => prev.map((r) => r.id === roleId ? { ...r, permissions: newPerms } : r));
      }
    } catch {
      setMatrixDraft((prev) => ({ ...prev, [roleId]: current }));
    }
  };

  // Create new custom role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setIsCreatingRole(true);
    setErrorMsg(null);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null);
      const templateRole = roles.find((r) => r.name === newRoleTemplate);
      const initPermissions = templateRole ? [...templateRole.permissions] : ['pos.order'];

      const res = await fetch(`${API_BASE_URL}/roles-permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          Accept: 'application/json',
        },
        body: JSON.stringify({
          display_name: newRoleName.trim(),
          description: newRoleDesc.trim(),
          permissions: initPermissions,
          store_id: selectedStoreId || activeStore?.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'ไม่สามารถสร้างตำแหน่งใหม่ได้');
      }

      const created = await res.json();
      setSuccessMsg(`สร้างตำแหน่ง "${newRoleName}" สำเร็จ`);
      setIsAddModalOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');

      // Refresh role list
      await fetchRoleData(selectedStoreId);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsCreatingRole(false);
    }
  };

  // Delete custom role
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeletingRole(true);
    setErrorMsg(null);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null);
      const res = await fetch(`${API_BASE_URL}/roles-permissions/${roleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'ไม่สามารถลบตำแหน่งนี้ได้');
      }

      setSuccessMsg(`ลบตำแหน่ง "${roleToDelete.display_name}" สำเร็จ`);
      setRoleToDelete(null);

      // Re-fetch
      await fetchRoleData(selectedStoreId);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsDeletingRole(false);
    }
  };

  const currentStoreName = stores.find((s) => s.id === selectedStoreId)?.name || activeStore?.name || 'ร้านปัจจุบัน';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="กำหนดบทบาท & สิทธิ์การใช้งาน (RBAC)" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">
        {/* Success / Error Notification */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm animate-fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Control Bar: Store Selector + View Mode + Add Role */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium">
              <StoreIcon className="w-3.5 h-3.5 text-stone-500" />
              <span>ร้าน:</span>
              {isAdmin && stores.length > 1 ? (
                <select
                  value={selectedStoreId || ''}
                  onChange={(e) => {
                    const sid = Number(e.target.value);
                    setSelectedStoreId(sid);
                    fetchRoleData(sid);
                  }}
                  className="bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer pr-1"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type || 'ร้าน'})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-bold text-stone-900">{currentStoreName}</span>
              )}
            </div>

            {isAdmin ? (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                Admin: สิทธิ์จัดการทุกร้าน
              </span>
            ) : (
              <span className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-full font-medium">
                จัดการเฉพาะร้านของคุณ
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มตำแหน่งใหม่</span>
            </button>

            <div className="inline-flex rounded-xl border border-stone-200/80 p-1 bg-stone-100 gap-1">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`h-7 px-2.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white text-stone-900 border border-stone-200 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                ดูตามบทบาท
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`h-7 px-2.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white text-stone-900 border border-stone-200 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                ตารางสิทธิ์รวม
              </button>
            </div>
          </div>
        </div>

        {/* CARD VIEW */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Role Selector */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  ตำแหน่งทั้งหมด ({roles.length})
                </h3>
                <span className="text-[11px] text-stone-400 font-mono">
                  {currentStoreName}
                </span>
              </div>

              <div className="space-y-2">
                {roles.map((role) => {
                  const isSelected = selectedRole?.id === role.id;
                  const isSys = role.is_system;

                  return (
                    <div
                      key={role.id}
                      onClick={() => handleSelectRole(role)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 relative flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-1 ring-stone-900'
                          : 'bg-white text-stone-800 border-stone-200 hover:border-stone-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">{role.display_name}</span>
                          {isSys && (
                            <span
                              title="ตำแหน่งเริ่มต้นของระบบ"
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                isSelected ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              ระบบ
                            </span>
                          )}
                        </div>
                        <div className={`text-xs truncate mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                          {role.description || `key: ${role.name}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                            isSelected
                              ? 'bg-[#f5efe6] text-[#78350f]'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {role.permissions?.length || 0} สิทธิ์
                        </span>

                        {!isSys && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleToDelete(role);
                            }}
                            title="ลบตำแหน่งนี้"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSelected
                                ? 'text-stone-400 hover:text-rose-400 hover:bg-stone-800'
                                : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Permission Details & Editor */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-6">
              {selectedRole ? (
                <>
                  {/* Selected Role Header / Inline Editor */}
                  <div className="pb-5 border-b border-stone-100 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-1 w-full space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                            ตำแหน่ง:
                          </span>
                          <input
                            type="text"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            disabled={selectedRole.name === 'admin'}
                            className="text-lg font-bold text-stone-900 border-b border-dashed border-stone-300 focus:border-stone-900 focus:outline-none bg-transparent px-1 py-0.5 w-full max-w-sm disabled:border-transparent"
                            placeholder="ชื่อตำแหน่ง..."
                          />
                        </div>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          disabled={selectedRole.name === 'admin'}
                          className="text-xs text-stone-500 border-b border-dashed border-stone-200 focus:border-stone-900 focus:outline-none bg-transparent px-1 py-0.5 w-full max-w-md disabled:border-transparent"
                          placeholder="คำอธิบายหน้าที่ความรับผิดชอบ..."
                        />
                      </div>

                      <Button
                        onClick={handleSavePermissions}
                        disabled={saving || selectedRole.name === 'admin'}
                        isLoading={saving}
                        variant="primary"
                        icon={<Save className="w-4 h-4" />}
                        className="shrink-0 whitespace-nowrap cursor-pointer"
                      >
                        บันทึกการเปลี่ยนแปลง
                      </Button>
                    </div>

                    {selectedRole.name === 'admin' && (
                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-xs flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-stone-800 shrink-0" />
                        <span>บทบาท <strong>Admin</strong> ได้รับสิทธิ์สูงสุดทุกส่วนโดยอัตโนมัติเพื่อความปลอดภัยของระบบ</span>
                      </div>
                    )}
                  </div>

                  {/* Categories & Permissions Checklist */}
                  <div className="space-y-6">
                    {Object.entries(permissionCategories).map(([catKey, items]) => {
                      const catInfo = categoryLabels[catKey] || { label: catKey, desc: '' };
                      const allCatChecked = items.every((i) => currentPermissions.includes(i.name));

                      return (
                        <div key={catKey} className="rounded-2xl border border-stone-200/70 bg-stone-50/50 p-4 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                            <div>
                              <h4 className="font-bold text-stone-900 text-sm">{catInfo.label}</h4>
                              <p className="text-xs text-stone-500">{catInfo.desc}</p>
                            </div>

                            {selectedRole.name !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleToggleCategory(catKey)}
                                className="text-xs font-semibold text-stone-600 hover:text-stone-900 hover:underline cursor-pointer"
                              >
                                {allCatChecked ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                            {items.map((perm) => {
                              const isGranted = currentPermissions.includes(perm.name) || selectedRole.name === 'admin';

                              return (
                                <div
                                  key={perm.id || perm.name}
                                  onClick={() => handleTogglePermission(perm.name)}
                                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between select-none ${
                                    isGranted
                                      ? 'bg-white border-stone-900 shadow-xs ring-1 ring-stone-900/10'
                                      : 'bg-white/60 border-stone-200/80 hover:bg-white hover:border-stone-300 opacity-70'
                                  } ${selectedRole.name === 'admin' ? 'cursor-default' : ''}`}
                                >
                                  <div className="space-y-0.5 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-semibold ${isGranted ? 'text-stone-900' : 'text-stone-600'}`}>
                                        {perm.display_name}
                                      </span>
                                    </div>
                                    {perm.description && (
                                      <p className="text-[11px] text-stone-400 leading-normal">{perm.description}</p>
                                    )}
                                  </div>

                                  <div
                                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                                      isGranted
                                        ? 'bg-stone-900 text-white font-normal'
                                        : 'bg-stone-200 text-transparent'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-stone-400 text-sm">
                  กรุณาเลือกตำแหน่งที่ต้องการจัดการ
                </div>
              )}
            </div>
          </div>
        )}

        {/* MATRIX GRID VIEW */}
        {viewMode === 'matrix' && (
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left p-4 text-xs font-semibold text-stone-500 w-64 sticky left-0 bg-stone-50">
                      สิทธิ์การใช้งาน
                    </th>
                    {roles.map((role) => (
                      <th key={role.id} className="text-center p-4 text-xs font-bold text-stone-900 whitespace-nowrap min-w-[120px]">
                        <div>{role.display_name}</div>
                        {role.name === 'admin' && (
                          <span className="text-[10px] text-stone-400 font-normal">สิทธิ์เต็ม</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissionCategories).map(([catKey, items]) => (
                    <React.Fragment key={catKey}>
                      {/* Category header row */}
                      <tr className="bg-stone-100/70 border-b border-stone-200">
                        <td colSpan={roles.length + 1} className="px-4 py-2 text-xs font-bold text-stone-700 uppercase tracking-wide sticky left-0">
                          {categoryLabels[catKey]?.label || catKey}
                        </td>
                      </tr>
                      {items.map((perm) => (
                        <tr key={perm.id} className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
                          <td className="p-4 sticky left-0 bg-white hover:bg-stone-50">
                            <div className="text-xs font-semibold text-stone-800">{perm.display_name}</div>
                            {perm.description && (
                              <div className="text-[11px] text-stone-400 font-normal mt-0.5">{perm.description}</div>
                            )}
                          </td>
                          {roles.map((role) => {
                            const isAdminRole = role.name === 'admin';
                            const isGranted = isAdminRole || (matrixDraft[role.id] || []).includes(perm.name);
                            return (
                              <td key={role.id} className="text-center p-4">
                                <button
                                  type="button"
                                  disabled={isAdminRole}
                                  onClick={() => handleMatrixToggle(role.id, perm.name)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none disabled:cursor-default ${
                                    isGranted ? 'bg-stone-900' : 'bg-stone-200'
                                  }`}
                                  title={isAdminRole ? 'ผู้ดูแลระบบมีสิทธิ์ทุกอย่าง' : ''}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                                      isGranted ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Add New Role */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-stone-900" />
                <h3 className="text-base font-bold text-stone-900">สร้างตำแหน่งใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ชื่อตำแหน่ง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ผู้ช่วยบาริสต้า, พนักงานเสิร์ฟ, ผู้จัดการกะ"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 focus:outline-none bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  คำอธิบายหน้าที่
                </label>
                <textarea
                  rows={2}
                  placeholder="รายละเอียดหน้าที่ความรับผิดชอบ..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 focus:outline-none bg-stone-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  คัดลอกสิทธิ์ตั้งต้นจาก
                </label>
                <select
                  value={newRoleTemplate}
                  onChange={(e) => setNewRoleTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-900 focus:outline-none bg-stone-50 cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.display_name} ({r.permissions?.length || 0} สิทธิ์)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isCreatingRole}
                >
                  สร้างตำแหน่ง
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-stone-900 text-base">ยืนยันการลบตำแหน่ง?</h3>
              <p className="text-xs text-stone-500 mt-1">
                คุณกำลังจะลบตำแหน่ง <strong>"{roleToDelete.display_name}"</strong> ออกจากระบบ
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoleToDelete(null)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="danger"
                isLoading={isDeletingRole}
                onClick={handleDeleteRole}
              >
                ลบตำแหน่ง
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
