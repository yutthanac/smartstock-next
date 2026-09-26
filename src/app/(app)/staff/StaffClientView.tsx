'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  LayoutGrid,
  List as ListIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  ShieldCheck,
  Filter,
  Store,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { useAuth } from '@/lib/AuthContext';
import { RoleOption, PermissionOption, StaffUser, StaffStoreOption } from './components/types';
import { StaffCardView } from './components/StaffCardView';
import { StaffTableView } from './components/StaffTableView';
import { StaffModal, getCleanRoleName } from './components/StaffModal';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface StaffClientViewProps {
  initialUsers?: StaffUser[];
  initialRoles?: RoleOption[];
}

export function StaffClientView({ initialUsers, initialRoles }: StaffClientViewProps) {
  const { token, user: currentUser, activeStore, stores } = useAuth();

  const [staffList, setStaffList] = useState<StaffUser[]>(initialUsers || []);
  const [roles, setRoles] = useState<RoleOption[]>(initialRoles || []);
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [availableStores, setAvailableStores] = useState<StaffStoreOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);



  // View Mode: 'card' or 'table'
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    selectedStaff: StaffUser | null;
  }>({
    isOpen: false,
    mode: 'create',
    selectedStaff: null,
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    avatar: null as string | null,
    roles: [] as string[],
    storeId: null as number | null,
  });

  // Check if current user is system admin
  const isSystemAdmin = Boolean(
    currentUser?.role === 'admin' ||
    currentUser?.roles?.some((r) => r === 'admin' || r === 'superadmin') ||
    currentUser?.username === 'admin'
  );

  // Check management permission (admin, owner, manager)
  const canManageStaff = Boolean(
    isSystemAdmin ||
    currentUser?.role === 'owner' ||
    currentUser?.role === 'manager' ||
    currentUser?.roles?.some((r) => r === 'admin' || r === 'owner' || r === 'manager') ||
    activeStore?.my_role === 'owner' ||
    activeStore?.my_role === 'manager'
  );

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null);
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }
      if (activeStore?.id) {
        headers['X-Store-ID'] = String(activeStore.id);
      }

      const res = await fetch(`${API_BASE_URL}/users${!isSystemAdmin && activeStore?.id ? `?store_id=${activeStore.id}` : ''}`, {
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้ (กรุณาเข้าสู่ระบบใหม่)');
      }

      const data = await res.json();
      setStaffList(data.users || []);
      // Non-admin cannot create or assign admin role
      const fetchedRoles = data.roles || [];
      setRoles(isSystemAdmin ? fetchedRoles : fetchedRoles.filter((r: RoleOption) => r.name !== 'admin'));
      setPermissions(data.permissions || []);
      if (data.available_stores) {
        setAvailableStores(data.available_stores);
      } else if (stores.length > 0) {
        setAvailableStores(stores.map(s => ({ id: s.id, name: s.name, type: s.type, logo_url: s.logo_url })));
      }
    } catch (err: any) {
      console.error('API fetch error in StaffPage:', err);
      setError(err.message || 'ไม่สามารถเชื่อมต่อกับ Backend API ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, activeStore?.id]);

  const handleOpenEdit = (staff: StaffUser) => {
    setFormData({
      name: staff.name,
      email: staff.email,
      password: '',
      avatar: staff.avatar || null,
      roles: staff.roles.map((r) => r.name),
      storeId: staff.stores?.[0]?.id ?? null,
    });
    setModalState({
      isOpen: true,
      mode: 'edit',
      selectedStaff: staff,
    });
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      avatar: null,
      roles: ['cashier'],
      storeId: activeStore?.id ?? (stores[0]?.id ?? null),
    });
    setModalState({
      isOpen: true,
      mode: 'create',
      selectedStaff: null,
    });
  };

  const handleToggleRole = (roleName: string) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(roleName);
      if (exists) {
        if (prev.roles.length === 1) return prev;
        return { ...prev, roles: prev.roles.filter((r) => r !== roleName) };
      } else {
        return { ...prev, roles: [...prev.roles, roleName] };
      }
    });
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = modalState.mode === 'edit';

    try {
      const url = isEdit
        ? `${API_BASE_URL}/users/${modalState.selectedStaff?.id}`
        : `${API_BASE_URL}/users`;

      const method = isEdit ? 'PUT' : 'POST';
      const resolvedStoreId = formData.storeId || activeStore?.id || (stores[0]?.id ?? null);

      const payload = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar,
        roles: formData.roles,
        role: formData.roles[0] || 'staff',
        store_id: resolvedStoreId,
        password: formData.password || undefined,
      };

      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('smartstock_auth_token') : null);
      const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (activeToken) {
        reqHeaders['Authorization'] = `Bearer ${activeToken}`;
      }
      if (activeStore?.id) {
        reqHeaders['X-Store-ID'] = String(activeStore.id);
      }

      const res = await fetch(url, {
        method,
        headers: reqHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }

      setSuccessMsg(isEdit ? 'อัปเดตสิทธิ์พนักงานเรียบร้อยแล้ว' : 'เพิ่มพนักงานใหม่สำเร็จ');
      setModalState((prev) => ({ ...prev, isOpen: false }));
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบผู้ใช้งาน "${name}" หรือไม่?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error('ลบผู้ใช้ไม่สำเร็จ');

      setSuccessMsg('ลบผู้ใช้งานเรียบร้อยแล้ว');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filtered List
  const filteredStaff = staffList.filter((staff) => {
    // Non-admin can never see system admin accounts
    const isAdminAccount = staff.username === 'admin' || staff.roles.some((r) => r.name === 'admin');
    if (!isSystemAdmin && isAdminAccount) {
      return false;
    }

    // Non-admin can only see members belonging to their current activeStore
    if (!isSystemAdmin && activeStore?.id) {
      const belongsToStore =
        !staff.stores ||
        staff.stores.length === 0 ||
        staff.stores.some((s) => String(s.id) === String(activeStore.id));
      if (!belongsToStore) {
        return false;
      }
    }

    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      selectedRoleFilter === 'all' ||
      staff.roles.some((r) => r.name === selectedRoleFilter);

    const matchesStore =
      selectedStoreFilter === 'all' ||
      (staff.stores && staff.stores.some((s) => String(s.id) === selectedStoreFilter)) ||
      (!staff.stores || staff.stores.length === 0);

    return matchesSearch && matchesRole && matchesStore;
  });

  const roleFilterOptions = [
    { label: 'บทบาททั้งหมด', value: 'all' },
    ...roles
      .filter((r) => r.name !== 'manager')
      .map((r) => ({ label: getCleanRoleName(r.name, r.display_name, activeStore?.type), value: r.name })),
  ];

  const storeFilterOptions = [
    { label: 'ทุกร้านค้า', value: 'all' },
    ...availableStores.map((s) => ({ label: s.name, value: String(s.id) })),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="จัดการพนักงาน & ตำแหน่ง" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Bar: Staff Count and Quick Link to Roles & Permissions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-stone-700" />
            <span className="text-sm font-semibold text-stone-900">รายชื่อพนักงานในระบบ</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-stone-100 text-stone-700 border border-stone-200">
              {filteredStaff.length} คน
            </span>
          </div>

          <Link
            href="/roles"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:text-stone-900 hover:border-stone-400 hover:bg-stone-50 transition-all shadow-2xs group self-start sm:self-auto"
          >
            <ShieldCheck className="w-4 h-4 text-stone-500 group-hover:text-stone-800 transition-colors" />
            <span>ไปจัดการสิทธิ์</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
              <X className="w-4 h-4" />
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
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar Section */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
                  placeholder="ค้นหาชื่อ, อีเมล หรือ ID พนักงาน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-stone-50 rounded-2xl border border-stone-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all font-normal"
                />
              </div>

              {/* Filters & Actions */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                {/* Store Filter - Only for System Admin */}
                {isSystemAdmin && availableStores.length > 1 && (
                  <div className="w-40 shrink-0">
                    <Dropdown
                      value={selectedStoreFilter}
                      onChange={setSelectedStoreFilter}
                      options={storeFilterOptions}
                    />
                  </div>
                )}

                {/* Role Filter */}
                <div className="w-44 shrink-0">
                  <Dropdown
                    value={selectedRoleFilter}
                    onChange={setSelectedRoleFilter}
                    options={roleFilterOptions}
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200/80 shrink-0">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-normal transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white text-stone-900 shadow-xs font-medium'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="มุมมองตาราง (Table View)"
                  >
                    <ListIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">ตาราง</span>
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-normal transition-all cursor-pointer ${
                      viewMode === 'card'
                        ? 'bg-white text-stone-900 shadow-xs font-medium'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="มุมมองการ์ด (Card View)"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">การ์ด</span>
                  </button>
                </div>

                {canManageStaff && (
                  <Button
                    onClick={handleOpenCreate}
                    icon={<UserPlus className="w-4 h-4" />}
                    size="md"
                    className="shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    เพิ่มพนักงาน
                  </Button>
                )}
              </div>
            </div>

            {/* Content Section: Table View or Card View */}
            {loading ? (
              <div className="p-12 text-center text-stone-400 text-sm">กำลังโหลดข้อมูลพนักงาน...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200/90 text-stone-400 text-sm">
                ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไขการค้นหา
              </div>
            ) : viewMode === 'table' ? (
              <StaffTableView
                staffList={filteredStaff}
                currentUserId={currentUser?.id}
                currentUserRole={currentUser?.roles?.[0] || currentUser?.role}
                activeStoreType={activeStore?.type}
                canManage={canManageStaff}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteUser}
              />
            ) : (
              <StaffCardView
                staffList={filteredStaff}
                currentUserId={currentUser?.id}
                currentUserRole={currentUser?.roles?.[0] || currentUser?.role}
                activeStoreType={activeStore?.type}
                canManage={canManageStaff}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteUser}
              />
            )}

        {/* Reusable Modal Component */}
        <StaffModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          isSystemAdmin={isSystemAdmin}
          activeStoreName={activeStore?.name}
          activeStoreType={activeStore?.type}
          formData={formData}
          roles={roles}
          stores={availableStores.length > 0 ? availableStores : stores.map(s => ({ id: s.id, name: s.name, type: s.type, logo_url: s.logo_url }))}
          onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
          onSubmit={handleFormSubmit}
          onChange={handleFormChange}
          onToggleRole={handleToggleRole}
        />
      </main>
    </div>
  );
}
