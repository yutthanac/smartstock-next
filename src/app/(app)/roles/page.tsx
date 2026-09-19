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
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

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
  dashboard: { label: 'แดชบอร์ด & รายงาน', desc: 'การเข้าถึงหน้าภาพรวม ยอดขาย และผลกำไร' },
  inventory: { label: 'คลังสต็อก & วัตถุดิบ', desc: 'การดูและปรับยอดสต็อก นำเข้า ของเสีย' },
  menu: { label: 'เมนูอาหาร & สูตร', desc: 'การจัดการเมนู ราคา และอัตราการใช้วัตถุดิบ' },
  pos: { label: 'ระบบขายหน้าร้าน', desc: 'การเปิดโต๊ะ เลือกเมนู และรับชำระเงิน' },
  system: { label: 'ระบบ & จัดการผู้ใช้', desc: 'การเพิ่ม ลบ แก้ไข และกำหนดสิทธิ์พนักงาน' },
  general: { label: 'สิทธิ์ทั่วไป', desc: 'สิทธิ์การใช้งานพื้นฐาน' },
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
  const [viewMode, setViewMode] = useState<'card' | 'matrix'>('card');
  const [matrixDraft, setMatrixDraft] = useState<Record<string, string[]>>({});

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
        // Build matrix draft from all roles
        const draft: Record<string, string[]> = {};
        data.roles.forEach((r: RoleData) => { draft[r.id] = [...r.permissions]; });
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
    if (currentUser && !hasRole('admin')) {
      window.location.href = '/dashboard';
      return;
    }
    fetchRoleData();
  }, [token, currentUser]);

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

  // Save a single-role permission toggle in the Matrix Grid (optimistic)
  const handleMatrixToggle = async (roleId: string, permName: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role || role.name === 'admin') return;

    const current = matrixDraft[roleId] || [];
    const newPerms = current.includes(permName)
      ? current.filter((p) => p !== permName)
      : [...current, permName];

    // Optimistic update
    setMatrixDraft((prev) => ({ ...prev, [roleId]: newPerms }));

    try {
      const res = await fetch(`${API_BASE_URL}/roles-permissions/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ permissions: newPerms }),
      });
      if (!res.ok) {
        // Rollback
        setMatrixDraft((prev) => ({ ...prev, [roleId]: current }));
        setErrorMsg('บันทึกสิทธิ์ไม่สำเร็จ');
      } else {
        setRoles((prev) => prev.map((r) => r.id === roleId ? { ...r, permissions: newPerms } : r));
      }
    } catch {
      setMatrixDraft((prev) => ({ ...prev, [roleId]: current }));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="กำหนดสิทธิ์การใช้งาน" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">
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

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-3.5">
          <h3 className="font-semibold text-stone-900 text-sm">กำหนดสิทธิ์บทบาท</h3>
          <div className="inline-flex rounded-xl border border-stone-200/80 p-1 bg-stone-100 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`h-8 px-3 text-xs rounded-lg font-medium transition-all cursor-pointer ${viewMode === 'card' ? 'bg-white text-stone-900 border border-stone-200 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-800'}`}
            >
              ดูตามบทบาท
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`h-8 px-3 text-xs rounded-lg font-medium transition-all cursor-pointer ${viewMode === 'matrix' ? 'bg-white text-stone-900 border border-stone-200 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-800'}`}
            >
              ตารางสิทธิ์รวม
            </button>
          </div>
        </div>

        {/* CARD VIEW */}
        {viewMode === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Role Selector */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-normal uppercase tracking-wider text-stone-500">เลือกบทบาท (Roles)</h3>
              <span className="text-xs text-stone-600 font-normal font-mono tabular-nums">{roles.length} บทบาท</span>
            </div>

            <div className="space-y-2.5">
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                        : 'bg-white text-stone-800 border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-normal text-sm ${
                            isSelected
                              ? 'bg-stone-800 text-white'
                              : 'bg-stone-100 text-stone-600 border border-stone-200/60'
                          }`}
                        >
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{role.display_name}</div>
                          <div className={`text-xs ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                            key: <span className="font-mono">{role.name}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-normal px-2.5 py-0.5 rounded-full font-mono tabular-nums ${
                          isSelected
                            ? 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {role.permissions.length} สิทธิ์
                      </span>
                    </div>

                    {role.description && (
                      <p className={`text-xs mt-3 line-clamp-2 leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {role.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-2xl bg-[#f5efe6] border border-[#e8ded0] text-[#78350f] text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#78350f]">
                <Info className="w-4 h-4 text-[#92400e] shrink-0" />
                <span>คำแนะนำการตั้งค่า</span>
              </div>
              <p className="text-xs text-[#92400e]/90 leading-relaxed">
                เมื่อบันทึกการแก้ไขสิทธิ์ พนักงานทุกคนที่มีบทบาทนี้จะถูกปรับสิทธิ์ตามการตั้งค่าใหม่โดยอัตโนมัติ
              </p>
            </div>
          </div>

          {/* Right Column: Permission Matrix Checklist */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-6">
            {selectedRole && (
              <>
                {/* Selected Role Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-stone-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-stone-500 uppercase tracking-wider">กำลังปรับแต่งสิทธิ์:</span>
                      <h2 className="text-lg font-semibold text-stone-900">{selectedRole.display_name}</h2>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">{selectedRole.description}</p>
                  </div>

                  <Button
                    onClick={handleSavePermissions}
                    disabled={saving || selectedRole.name === 'admin'}
                    isLoading={saving}
                    variant="primary"
                    icon={<Save className="w-4 h-4" />}
                    className="shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    บันทึกการตั้งค่าสิทธิ์
                  </Button>
                </div>

                {selectedRole.name === 'admin' && (
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-stone-800 shrink-0" />
                    <span>บทบาท <strong>Admin</strong> ได้รับสิทธิ์สูงสุดทุกส่วนโดยอัตโนมัติเพื่อความปลอดภัยของระบบ</span>
                  </div>
                )}

                {/* Categories & Permissions */}
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
                              className="text-xs font-normal text-stone-600 hover:text-stone-900 hover:underline cursor-pointer"
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
                                    <span className={`text-xs font-medium ${isGranted ? 'text-stone-900' : 'text-stone-600'}`}>
                                      {perm.display_name}
                                    </span>
                                  </div>
                                  {perm.description && (
                                    <p className="text-xs text-stone-400 leading-normal">{perm.description}</p>
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
                    <th className="text-left p-4 text-xs font-normal text-stone-500 w-64 sticky left-0 bg-stone-50">สิทธิ์</th>
                    {roles.map((role) => (
                      <th key={role.id} className="text-center p-4 text-xs font-semibold text-stone-900 whitespace-nowrap min-w-[120px]">
                        <div>{role.display_name.split(' ')[0]}</div>
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
                        <td colSpan={roles.length + 1} className="px-4 py-2 text-xs font-semibold text-stone-600 uppercase tracking-wide sticky left-0">
                          {categoryLabels[catKey]?.label || catKey}
                        </td>
                      </tr>
                      {items.map((perm) => (
                        <tr key={perm.id} className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
                          <td className="p-4 sticky left-0 bg-white hover:bg-stone-50">
                            <div className="text-xs font-medium text-stone-800">{perm.display_name}</div>
                            {perm.description && (
                              <div className="text-[11px] text-stone-400 font-normal mt-0.5">{perm.description}</div>
                            )}
                          </td>
                          {roles.map((role) => {
                            const isAdmin = role.name === 'admin';
                            const isGranted = isAdmin || (matrixDraft[role.id] || []).includes(perm.name);
                            return (
                              <td key={role.id} className="text-center p-4">
                                <button
                                  type="button"
                                  disabled={isAdmin}
                                  onClick={() => handleMatrixToggle(role.id, perm.name)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none disabled:cursor-default ${
                                    isGranted ? 'bg-stone-900' : 'bg-stone-200'
                                  }`}
                                  title={isAdmin ? 'ผู้ดูแลระบบมีสิทธิ์ทุกอย่าง' : ''}
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
    </div>
  );
}
