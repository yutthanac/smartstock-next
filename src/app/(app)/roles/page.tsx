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
} from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { useAuth } from '@/lib/AuthContext';

interface RoleData {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const categoryLabels: { [key: string]: { label: string; desc: string } } = {
  dashboard: { label: '📊 แดชบอร์ด & รายงาน', desc: 'การเข้าถึงหน้าภาพรวม ยอดขาย และผลกำไร' },
  inventory: { label: '📦 คลังสต็อก & วัตถุดิบ', desc: 'การดูและปรับยอดสต็อก นำเข้า ของเสีย' },
  menu: { label: '🍽️ เมนูอาหาร & สูตร BOM', desc: 'การจัดการเมนู ราคา และอัตราการใช้วัตถุดิบ' },
  pos: { label: '🛒 ระบบขายหน้าร้าน (POS)', desc: 'การเปิดโต๊ะ เลือกเมนู และรับชำระเงิน' },
  system: { label: '⚙️ ระบบ & จัดการผู้ใช้', desc: 'การเพิ่ม ลบ แก้ไข และกำหนดสิทธิ์พนักงาน' },
  general: { label: '📌 สิทธิ์ทั่วไป', desc: 'สิทธิ์การใช้งานพื้นฐาน' },
};

export default function RolesPermissionPage() {
  const { token, user: currentUser, hasRole } = useAuth();

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategories>({});
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRoleData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null);
      const res = await fetch(`${API_BASE_URL}/roles-permissions`, {
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'ไม่สามารถโหลดข้อมูลสิทธิ์ได้ (กรุณาเข้าสู่ระบบใหม่)');
      }

      const data = await res.json();
      setRoles(data.roles || []);
      setPermissionCategories(data.permission_categories || {});

      if (data.roles && data.roles.length > 0) {
        const initial = data.roles[0];
        setSelectedRole(initial);
        setCurrentPermissions(initial.permissions);
      }
    } catch (e: any) {
      console.error('API fetch error in RolesPermissionPage:', e);
      setErrorMsg(e.message || 'ไม่สามารถเชื่อมต่อกับ Backend API ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleData();
  }, [token]);

  const handleSelectRole = (role: RoleData) => {
    setSelectedRole(role);
    setCurrentPermissions([...role.permissions]);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleTogglePermission = (permName: string) => {
    if (selectedRole?.name === 'admin') {
      // Prevent stripping admin of rights easily
      return;
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
      const res = await fetch(`${API_BASE_URL}/roles-permissions/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          display_name: selectedRole.display_name,
          description: selectedRole.description,
          permissions: currentPermissions,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'บันทึกการเปลี่ยนแปลงไม่สำเร็จ');
      }

      setSuccessMsg(`อัปเดตสิทธิ์สำหรับบทบาท "${selectedRole.display_name}" เรียบร้อยแล้ว`);

      // Update local roles state
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedRole.id ? { ...r, permissions: currentPermissions } : r))
      );
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
      // Deselect all in category
      setCurrentPermissions((prev) => prev.filter((name) => !itemNames.includes(name)));
    } else {
      // Select all in category
      setCurrentPermissions((prev) => Array.from(new Set([...prev, ...itemNames])));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar
        title="กำหนดสิทธิ์บทบาท (Role & Permissions Matrix)"
        subtitle="ตั้งค่าว่าแต่ละบทบาท (Role) สามารถมองเห็นหรือจัดการส่วนใดของระบบได้บ้าง"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Success / Error Notification */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Roles Tabs & Matrix Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Role Selector */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">เลือกบทบาท (Roles)</h3>
              <span className="text-[11px] text-[#4fb0a5] font-semibold">{roles.length} บทบาท</span>
            </div>

            <div className="space-y-2.5">
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#12312d] text-white border-[#4fb0a5] shadow-lg shadow-[#4fb0a5]/15'
                        : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? 'bg-[#4fb0a5] text-slate-950'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">{role.display_name}</div>
                          <div className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            key: <span className="font-mono">{role.name}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-[#4fb0a5]/20 text-[#4fb0a5] border border-[#4fb0a5]/30'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {role.permissions.length} สิทธิ์
                      </span>
                    </div>

                    {role.description && (
                      <p className={`text-xs mt-3 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {role.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>คำแนะนำการตั้งค่า</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                เมื่อบันทึกการแก้ไขสิทธิ์ พนักงานทุกคนที่มีบทบาทนี้จะถูกปรับสิทธิ์ตามการตั้งค่าใหม่โดยอัตโนมัติ
              </p>
            </div>
          </div>

          {/* Right Column: Permission Matrix Checklist */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            {selectedRole && (
              <>
                {/* Selected Role Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#4fb0a5] uppercase tracking-wider">กำลังปรับแต่งสิทธิ์:</span>
                      <h2 className="text-lg font-extrabold text-slate-900">{selectedRole.display_name}</h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
                  </div>

                  <button
                    onClick={handleSavePermissions}
                    disabled={saving || selectedRole.name === 'admin'}
                    className="px-5 py-2.5 rounded-2xl bg-[#4fb0a5] hover:bg-[#3ea094] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#4fb0a5]/20 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าสิทธิ์'}
                  </button>
                </div>

                {selectedRole.name === 'admin' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>บทบาท <strong>Admin</strong> ได้รับสิทธิ์สูงสุดทุกส่วนโดยอัตโนมัติเพื่อความปลอดภัยของระบบ</span>
                  </div>
                )}

                {/* Categories & Permissions */}
                <div className="space-y-6">
                  {Object.entries(permissionCategories).map(([catKey, items]) => {
                    const catInfo = categoryLabels[catKey] || { label: catKey, desc: '' };
                    const allCatChecked = items.every((i) => currentPermissions.includes(i.name));
                    const someCatChecked = items.some((i) => currentPermissions.includes(i.name));

                    return (
                      <div key={catKey} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{catInfo.label}</h4>
                            <p className="text-[11px] text-slate-400">{catInfo.desc}</p>
                          </div>

                          {selectedRole.name !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleToggleCategory(catKey)}
                              className="text-[11px] font-semibold text-[#4fb0a5] hover:underline"
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
                                    ? 'bg-white border-[#4fb0a5] shadow-sm ring-1 ring-[#4fb0a5]/20'
                                    : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300 opacity-70'
                                } ${selectedRole.name === 'admin' ? 'cursor-default' : ''}`}
                              >
                                <div className="space-y-0.5 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-bold ${isGranted ? 'text-slate-900' : 'text-slate-600'}`}>
                                      {perm.display_name}
                                    </span>
                                  </div>
                                  {perm.description && (
                                    <p className="text-[10px] text-slate-400 leading-normal">{perm.description}</p>
                                  )}
                                </div>

                                <div
                                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                                    isGranted
                                      ? 'bg-[#4fb0a5] text-slate-950 font-bold'
                                      : 'bg-slate-200 text-transparent'
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
