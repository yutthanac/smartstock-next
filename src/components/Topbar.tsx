'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  LogOut,
  Menu,
  User as UserIcon,
  Settings,
  Lock,
  Mail,
  Shield,
  CheckCircle2,
  X,
  Save,
  ChevronDown,
  Camera,
  Trash2,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';
import { useSidebar } from '@/lib/SidebarContext';
import { Button } from '@/components/Button';
import { getUserRoleBadge } from '@/lib/role-utils';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const { dashboard } = useStock();
  const { user, logout, updateProfile, activeStore } = useAuth();
  const { toggleMobileSidebar } = useSidebar();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Profile Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || null);
    }
  }, [user]);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const getRoleBadge = (roles?: string[], singleRole?: string) => {
    return getUserRoleBadge(roles, singleRole, activeStore?.type);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const handleOpenProfileModal = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setAvatar(user?.avatar || null);
    setPassword('');
    setSaveError(null);
    setSaveSuccess(false);
    setIsDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSaveError('ขนาดรูปภาพต้องไม่เกิน 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveError('กรุณากรอกชื่อผู้ใช้งาน');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const payload: { name: string; email?: string; password?: string; avatar?: string } = {
      name: name.trim(),
    };

    if (email.trim()) payload.email = email.trim();
    if (password.trim()) payload.password = password.trim();
    if (avatar) payload.avatar = avatar;

    const res = await updateProfile(payload);
    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      setPassword('');
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setSaveSuccess(false);
      }, 1500);
    } else {
      setSaveError(res.error || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  return (
    <>
      <header className="bg-white sticky top-0 z-20 border-b border-stone-200/90 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between print:hidden">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            onClick={toggleMobileSidebar}
            aria-label="เปิดเมนูหลัก"
            className="lg:hidden p-2 -ml-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-stone-500 font-normal truncate">
            <span className="hidden md:inline hover:text-stone-700 transition-colors">คลังสินค้า</span>
            <span className="hidden md:inline text-stone-300">›</span>
            <span className="text-stone-900 font-semibold truncate">{title.split('(')[0].trim()}</span>
          </div>
        </div>

        {/* Center: System / Store Brand Title */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="text-xs font-bold tracking-widest text-stone-900 uppercase">
            SMARTSTOCK
          </span>
        </div>

        {/* Right: Notifications & User Avatar with Dropdown */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Notification Bell with Badge Count */}
          <button
            aria-label="แจ้งเตือน"
            className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {dashboard.low_stock_count > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-stone-900 text-white rounded-full text-xs font-semibold flex items-center justify-center ring-2 ring-white">
                {dashboard.low_stock_count > 9 ? '9+' : dashboard.low_stock_count}
              </span>
            )}
          </button>

          {/* User Avatar with Dropdown Trigger */}
          <div ref={dropdownRef} className="relative flex items-center pl-2 border-l border-stone-200">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer group"
              title="เมนูโปรไฟล์"
            >
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white font-semibold flex items-center justify-center text-xs overflow-hidden shadow-xs ring-2 ring-stone-900/10 group-hover:scale-105 transition-transform">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-scale-in">
                {/* User Info Header */}
                <div className="p-3 border-b border-stone-100 mb-1 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-900 text-white font-semibold flex items-center justify-center text-sm overflow-hidden shrink-0 shadow-xs">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      getInitials(user?.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-stone-900 text-sm truncate">
                      {user?.name || 'ผู้ใช้'}
                    </div>
                    <div className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{user?.email || '-'}</span>
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200/70">
                      <Shield className="w-3 h-3 text-stone-500" />
                      <span>{getRoleBadge(user?.roles, user?.role)}</span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-0.5">
                  <button
                    onClick={handleOpenProfileModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-stone-500" />
                    <span>ตั้งค่าโปรไฟล์ของฉัน</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 text-base">ตั้งค่าโปรไฟล์ของฉัน</h3>
                  <p className="text-xs text-stone-500">แก้ไขชื่อ อีเมล หรือเปลี่ยนรหัสผ่านส่วนตัว</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-xs">
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว</span>
                </div>
              )}

              {/* Avatar Upload UI */}
              <div className="flex flex-col items-center justify-center gap-2 pb-2">
                <div className="relative group/avatar">
                  <div className="w-20 h-20 rounded-full bg-stone-900 text-white font-semibold flex items-center justify-center text-xl overflow-hidden shadow-md ring-4 ring-stone-100">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      getInitials(name || user?.name)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-stone-900 text-white rounded-full shadow-md hover:bg-stone-800 transition-transform hover:scale-105 cursor-pointer ring-2 ring-white"
                    title="เปลี่ยนรูปโปรไฟล์"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-stone-600 hover:text-stone-900 font-medium underline cursor-pointer"
                  >
                    เปลี่ยนรูปภาพ
                  </button>
                  {avatar && (
                    <>
                      <span className="text-stone-300">•</span>
                      <button
                        type="button"
                        onClick={() => setAvatar(null)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        ลบรูป
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  ชื่อที่แสดง (Display Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น System Admin หรือ เจ้าของร้าน"
                  className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-800 text-stone-900 text-xs transition-all"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  อีเมล (Email)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น admin@smartstock.local"
                  className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-800 text-stone-900 text-xs transition-all"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  เปลี่ยนรหัสผ่านใหม่ (Password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน"
                  className="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-800 text-stone-900 text-xs transition-all"
                />
                <p className="text-xs text-stone-400 mt-1">
                  หากต้องการเปลี่ยนรหัสผ่าน กรอกความยาวอย่างน้อย 6 ตัวอักษร
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={saving}
                  icon={<Save className="w-4 h-4" />}
                >
                  บันทึกการเปลี่ยนแปลง
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
