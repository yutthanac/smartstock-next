import React from 'react';
import { UserPlus, ShieldCheck, X, Check, Store as StoreIcon } from 'lucide-react';
import { Dropdown } from '@/components/Dropdown';
import { RoleOption, StaffStoreOption } from './types';

interface StaffModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: {
    name: string;
    email: string;
    password?: string;
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
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">ชื่อ-นามสกุล *</label>
            <input
              type="text"
              required
              placeholder="เช่น สมชาย ใจดี"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200/80 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-normal transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">อีเมล (Email) *</label>
            <input
              type="email"
              required
              placeholder="staff@smartstock.local"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200/80 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-normal transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              {mode === 'create' ? 'รหัสผ่าน (Password) *' : 'เปลี่ยนรหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่เปลี่ยน)'}
            </label>
            <input
              type="password"
              required={mode === 'create'}
              placeholder={mode === 'create' ? 'ขั้นต่ำ 6 ตัวอักษร' : '••••••••'}
              value={formData.password || ''}
              onChange={(e) => onChange('password', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200/80 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-normal transition-all"
            />
          </div>

          {/* Store Selection */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5 flex items-center gap-1.5">
              <StoreIcon className="w-3.5 h-3.5 text-stone-500" />
              สังกัดร้านค้า (Store):
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
              buttonClassName="w-full bg-stone-50 border border-stone-200/80 text-stone-800 rounded-xl py-2.5 text-xs font-normal"
            />
            <p className="text-xs text-stone-400 mt-1">
              พนักงานจะสามารถสลับเข้าใช้งานและเห็นข้อมูลเฉพาะร้านที่สังกัด
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-2">
              เลือกบทบาท / สิทธิ์การใช้งาน (Roles):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => {
                const isSelected = formData.roles.includes(role.name);
                return (
                  <button
                    key={role.id || role.name}
                    type="button"
                    onClick={() => onToggleRole(role.name)}
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200/80 hover:bg-stone-100/80'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium">{role.display_name}</div>
                      <div className={`text-xs font-mono mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                        {role.name}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
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
