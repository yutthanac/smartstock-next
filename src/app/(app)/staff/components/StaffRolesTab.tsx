'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Check,
  Save,
  Coffee,
  Cookie,
  UtensilsCrossed,
  Building2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { RoleOption, StaffStoreOption } from './types';
import { getCleanRoleName } from './StaffModal';

interface PermissionItem {
  id: string;
  name: string;
  display_name: string;
  category: string;
  description?: string;
}

interface StaffRolesTabProps {
  roles: RoleOption[];
  activeStore?: { id: number; name: string; type: string } | null;
  canManage?: boolean;
  onRoleUpdated?: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const categoryLabels: { [key: string]: { label: string; desc: string } } = {
  dashboard: { label: 'แดชบอร์ด & รายงาน', desc: 'การเข้าถึงตัวเลขยอดขาย ต้นทุน และกำไร' },
  inventory: { label: 'คลังสต็อก & วัตถุดิบ', desc: 'การดู ปรับยอดสต็อก นำเข้า และบันทึกของเสีย' },
  menu: { label: 'เมนู & สูตรอาหาร/เครื่องดื่ม', desc: 'การจัดการเมนู ราคา และสัดส่วนการตัดสต็อก (BOM)' },
  pos: { label: 'ระบบขายหน้าร้าน (POS)', desc: 'การเปิดบิล เลือกเมนู ให้ส่วนลด และรับชำระเงิน' },
  system: { label: 'ระบบ & จัดการผู้ใช้งาน', desc: 'การเพิ่ม แก้ไข และกำหนดสิทธิ์พนักงานในร้าน' },
};

export const StaffRolesTab: React.FC<StaffRolesTabProps> = ({
  roles: initialRoles,
  activeStore,
  canManage = true,
  onRoleUpdated,
}) => {
  const storeType = activeStore?.type || 'cafe';

  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('owner');
  const [permissionCategories, setPermissionCategories] = useState<{ [cat: string]: PermissionItem[] }>({});
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch full roles & permissions data from backend
  const fetchRolesData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const activeToken = typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null;
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;
      if (activeStore?.id) headers['X-Store-ID'] = String(activeStore.id);

      const res = await fetch(`${API_BASE_URL}/roles-permissions`, { headers });
      if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลสิทธิ์การใช้งานได้');

      const data = await res.json();
      const fetchedRoles: any[] = data.roles || [];
      setRoles(fetchedRoles);
      setPermissionCategories(data.permission_categories || {});

      // Build permissions map
      const permMap: Record<string, string[]> = {};
      fetchedRoles.forEach((r) => {
        permMap[r.id] = r.permissions || [];
      });
      setRolePermissions(permMap);

      if (fetchedRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(fetchedRoles[0].id);
      }
    } catch (err: any) {
      console.error('Fetch roles error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการโหลดสิทธิ์');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, [activeStore?.id, activeStore?.type]);

  const getStoreTypeBadge = (type?: string) => {
    switch (type) {
      case 'cafe':
        return { label: 'คาเฟ่ & เครื่องดื่ม', icon: Coffee, roleHighlight: 'ตำแหน่งหลัก: บาริสต้า' };
      case 'bakery':
        return { label: 'เบเกอรี่ & ขนมอบ', icon: Cookie, roleHighlight: 'ตำแหน่งหลัก: เชฟเบเกอรี่' };
      case 'restaurant':
        return { label: 'ร้านอาหาร', icon: UtensilsCrossed, roleHighlight: 'ตำแหน่งหลัก: หัวหน้าครัว' };
      default:
        return { label: 'ร้านค้าทั่วไป', icon: Building2, roleHighlight: 'ตำแหน่งหลัก: บาริสต้า' };
    }
  };

  const currentStoreInfo = getStoreTypeBadge(storeType);
  const StoreIcon = currentStoreInfo.icon;

  const currentRole = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const currentPerms = rolePermissions[selectedRoleId] || [];

  const handleTogglePermission = (permId: string) => {
    if (!canManage) return;
    if (selectedRoleId === 'admin') return; // Admin has permanent full permissions

    setRolePermissions((prev) => {
      const current = prev[selectedRoleId] || [];
      const updated = current.includes(permId)
        ? current.filter((p) => p !== permId)
        : [...current, permId];
      return { ...prev, [selectedRoleId]: updated };
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!canManage) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const activeToken = typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;
      if (activeStore?.id) headers['X-Store-ID'] = String(activeStore.id);

      const res = await fetch(`${API_BASE_URL}/roles-permissions/${selectedRoleId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          permissions: rolePermissions[selectedRoleId] || [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'บันทึกสิทธิ์ไม่สำเร็จ');
      }

      setSuccessMsg(`บันทึกสิทธิ์ของตำแหน่ง "${getCleanRoleName(currentRole?.name, currentRole?.display_name, storeType)}" เรียบร้อยแล้ว`);
      if (onRoleUpdated) onRoleUpdated();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'บันทึกสิทธิ์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // Group roles for tabs (filter out manager duplicate if owner exists)
  const displayRoles = roles.filter((r) => r.name !== 'manager');

  return (
    <div className="space-y-6">
      {/* Store Type Guidance Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <StoreIcon className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-stone-900 text-sm sm:text-base">
                {activeStore ? activeStore.name : 'ร้านค้าปัจจุบัน'}
              </h3>
              <Badge variant="outline" size="sm" className="font-normal bg-stone-50">
                {currentStoreInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5 font-normal">
             
              <span>{currentStoreInfo.roleHighlight}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-xs text-stone-500 font-normal">
            จำนวนตำแหน่ง: <span className="font-medium text-stone-800">{displayRoles.length} ตำแหน่ง</span>
          </span>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-stone-900 text-white text-xs font-normal flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-stone-300" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-stone-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Left Roles Selector / Right Permissions Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Roles Selection Tabs */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-3 rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <div className="px-3 pt-2 pb-1 text-xs font-medium text-stone-500 uppercase tracking-wider">
              เลือกตำแหน่งเพื่อดูและจัดการสิทธิ์
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-stone-400">กำลังโหลดตำแหน่ง...</div>
            ) : (
              displayRoles.map((role) => {
                const isSelected = role.id === selectedRoleId;
                const cleanName = getCleanRoleName(role.name, role.display_name, storeType);
                const assignedCount = (rolePermissions[role.id] || []).length;
                const isAdmin = role.name === 'admin';

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50/70 hover:bg-stone-100/80 text-stone-800 border-stone-200/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-xs truncate">{cleanName}</span>
                          {isAdmin && (
                            <Lock className={`w-3 h-3 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums ${
                          isSelected
                            ? 'bg-white/15 text-white'
                            : 'bg-white text-stone-600 border border-stone-200/80'
                        }`}
                      >
                        {isAdmin ? 'ทั้งหมด' : `${assignedCount} สิทธิ์`}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Permissions Checklist for Selected Role */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
          {/* Header of selected role */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-stone-900" />
                <h4 className="font-semibold text-stone-900 text-base">
                  สิทธิ์การใช้งาน: {getCleanRoleName(currentRole?.name, currentRole?.display_name, storeType)}
                </h4>
                {selectedRoleId === 'admin' && (
                  <Badge variant="neutral" size="sm" className="font-normal">
                    สิทธิ์สูงสุดถาวร
                  </Badge>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                {currentRole?.description || 'เลือกสิทธิ์ที่ต้องการอนุญาตให้ตำแหน่งนี้ใช้งานในระบบ'}
              </p>
            </div>

            {canManage && selectedRoleId !== 'admin' && (
              <Button
                onClick={handleSaveRolePermissions}
                disabled={saving}
                isLoading={saving}
                icon={<Save className="w-4 h-4" />}
                size="md"
                className="shrink-0"
              >
                บันทึกการตั้งค่าสิทธิ์
              </Button>
            )}
          </div>

          {/* Permissions Checklist by Category */}
          <div className="space-y-6">
            {Object.keys(permissionCategories).map((categoryKey) => {
              const perms = permissionCategories[categoryKey] || [];
              const catMeta = categoryLabels[categoryKey] || { label: categoryKey, desc: '' };

              return (
                <div key={categoryKey} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-stone-900 text-xs sm:text-sm">{catMeta.label}</h5>
                      {catMeta.desc && <p className="text-[11px] text-stone-400">{catMeta.desc}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {perms.map((perm) => {
                      const isChecked = selectedRoleId === 'admin' || currentPerms.includes(perm.name);
                      const isDisabled = !canManage || selectedRoleId === 'admin';

                      return (
                        <div
                          key={perm.id || perm.name}
                          onClick={() => !isDisabled && handleTogglePermission(perm.name)}
                          className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                            isDisabled ? 'cursor-default' : 'cursor-pointer'
                          } ${
                            isChecked
                              ? 'bg-stone-50 border-stone-300/80 shadow-xs'
                              : 'bg-white border-stone-200/70 hover:border-stone-300'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-medium text-xs text-stone-900 block truncate">
                              {perm.display_name}
                            </span>
                            {perm.description && (
                              <p className="text-[11px] text-stone-400 font-normal line-clamp-1">
                                {perm.description}
                              </p>
                            )}
                          </div>

                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                              isChecked
                                ? 'bg-stone-900 text-white'
                                : 'border border-stone-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Save Button for mobile */}
          {canManage && selectedRoleId !== 'admin' && (
            <div className="pt-4 border-t border-stone-100 flex items-center justify-end">
              <Button
                onClick={handleSaveRolePermissions}
                disabled={saving}
                isLoading={saving}
                icon={<Save className="w-4 h-4" />}
                size="md"
              >
                บันทึกการตั้งค่าสิทธิ์
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
