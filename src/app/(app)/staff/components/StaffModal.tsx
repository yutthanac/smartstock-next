import React, { useRef } from 'react';
import { UserPlus, ShieldCheck, X, Check, Store as StoreIcon, Camera, User as UserIcon } from 'lucide-react';
import { Dropdown } from '@/components/Dropdown';
import { RoleOption, StaffStoreOption } from './types';

export const getCleanRoleName = (
  name: string,
  displayName?: string,
  storeType?: string
): string => {
  if (name === 'manager' || name === 'owner') {
    return 'เจ้าของร้าน';
  }

  if (name === 'chef' || name === 'barista') {
    if (storeType === 'bakery') return 'เชฟเบเกอรี่';
    if (storeType === 'restaurant') return 'หัวหน้าครัว';
    return 'บาริสต้า';
  }

  const isBakery = storeType === 'bakery';
  const isRestaurant = storeType === 'restaurant';
  const chefTitle = isBakery ? 'เชฟเบเกอรี่' : isRestaurant ? 'หัวหน้าครัว' : 'บาริสต้า';

  const thaiMap: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ',
    owner: 'เจ้าของร้าน',
    manager: 'เจ้าของร้าน',
    chef: chefTitle,
    barista: 'บาริสต้า',
    baker: 'เชฟเบเกอรี่',
    cashier: 'พนักงานแคชเชียร์',
    staff: 'พนักงานทั่วไป',
  };
  if (thaiMap[name]) return thaiMap[name];
  return displayName ? displayName.replace(/\s*\([^)]*\)/g, '').trim() : name;
};

interface StaffModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  isSystemAdmin?: boolean;
  activeStoreName?: string;
  activeStoreType?: string;
  formData: {
    name: string;
    email: string;
    password?: string;
    avatar?: string | null;
    roles: string[];
    storeId?: number | null;
  };
  roles: RoleOption[];
  stores: StaffStoreOption[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: any) => void;
  onToggleRole: (roleName: string) => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  mode,
  isSystemAdmin = false,
  activeStoreName,
  activeStoreType,
  formData,
  roles,
  stores,
  onClose,
  onSubmit,
  onChange,
  onToggleRole,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-scale-in max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <UserPlus className="w-5 h-5 text-stone-900" />
                <h3 className="font-semibold text-stone-900 text-base">เพิ่มพนักงาน & กำหนดร้านค้า</h3>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-stone-900" />
                <h3 className="font-semibold text-stone-900 text-base">แก้ไขข้อมูล & สิทธิ์พนักงาน</h3>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          {/* Avatar Upload: Click circular profile directly to upload */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              <label
                className="w-20 h-20 rounded-full bg-stone-100 hover:bg-stone-200 border-2 border-dashed border-stone-300 hover:border-stone-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm relative"
                title="คลิกเพื่อเลือกรูปโปรไฟล์"
              >
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.name || 'Profile'}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400 group-hover:text-stone-700 transition-colors">
                    <UserIcon className="w-8 h-8 stroke-[1.5]" />
                  </div>
                )}

                {/* Camera Overlay Icon */}
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <Camera className="w-6 h-6 text-white drop-shadow" />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (uploadEvent) => {
                        onChange('avatar', uploadEvent.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              {/* Delete Avatar Button with confirmation */}
              {formData.avatar && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('คุณต้องการลบรูปโปรไฟล์นี้ใช่หรือไม่?')) {
                      onChange('avatar', null);
                    }
                  }}
                  title="ลบรูปโปรไฟล์"
                  className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-[11px] font-medium text-stone-700 mt-2">
              {formData.avatar ? 'คลิกที่รูปเพื่อเปลี่ยน' : 'คลิกเพื่อเลือกรูป'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5">ชื่อ-นามสกุล *</label>
            <input
              type="text"
              required
              placeholder="ชื่อ-นามสกุล"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5">อีเมล (Email) *</label>
            <input
              type="email"
              required
              placeholder="ชื่ออีเมลของพนักงาน"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5">
              {mode === 'create' ? 'รหัสผ่าน (Password) *' : 'เปลี่ยนรหัสผ่านใหม่'}
            </label>
            <input
              type="password"
              required={mode === 'create'}
              placeholder={mode === 'create' ? 'รหัสผ่าน' : 'เปลี่ยนรหัสผ่านใหม่'}
              value={formData.password || ''}
              onChange={(e) => onChange('password', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-medium transition-all"
            />
          </div>

          {/* Store Selection - Only visible for System Admin */}
          {isSystemAdmin && (
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1.5 flex items-center gap-1.5">
                <StoreIcon className="w-3.5 h-3.5 text-stone-600" />
                ร้านค้า:
              </label>
              <Dropdown
                value={formData.storeId ?? ''}
                onChange={(val) => onChange('storeId', val ? Number(val) : null)}
                options={[
                  { value: '', label: '-- เลือกร้านค้าที่สังกัด --' },
                  ...stores.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.type === 'cafe' ? 'คาเฟ่' : s.type === 'bakery' ? 'เบเกอรี่' : 'ร้านอาหาร'})`,
                  })),
                ]}
                className="w-full"
                placement="bottom"
                buttonClassName="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl py-2.5 text-xs font-semibold"
              />
            </div>
          )}

          {/* Role Selection (Dropdown) */}
          <div className="pb-1">
            <label className="block text-xs font-semibold text-stone-800 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
              ตำแหน่ง / บทบาท:
            </label>
            <Dropdown
              value={formData.roles[0] || ''}
              onChange={(val) => {
                if (val) {
                  onChange('roles', [val]);
                }
              }}
              options={roles
                .filter((r) => r.name !== 'manager')
                .map((r) => ({
                  value: r.name,
                  label: getCleanRoleName(r.name, r.display_name, activeStoreType),
                }))}
              className="w-full"
              placement="top"
              buttonClassName="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl py-2.5 text-xs font-semibold"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium shadow-xs cursor-pointer"
            >
              {mode === 'create' ? 'สร้างพนักงาน' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
