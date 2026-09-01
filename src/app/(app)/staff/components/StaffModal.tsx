import React from 'react';
import { UserPlus, ShieldCheck, X, Check } from 'lucide-react';
import { RoleOption, StaffUser } from './types';

interface StaffModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: {
    name: string;
    email: string;
    password?: string;
    roles: string[];
  };
  roles: RoleOption[];
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
  onClose,
  onSubmit,
  onChange,
  onToggleRole,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <UserPlus className="w-5 h-5 text-[#4fb0a5]" />
                <h3 className="font-bold text-slate-900 text-base">เพิ่มพนักงาน & กำหนดสิทธิ์ใหม่</h3>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-[#4fb0a5]" />
                <h3 className="font-bold text-slate-900 text-base">แก้ไขสิทธิ์และบทบาทพนักงาน</h3>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
            <input
              type="text"
              required
              placeholder="เช่น สมชาย ใจดี"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30 focus:border-[#4fb0a5]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล (Email)</label>
            <input
              type="email"
              required
              placeholder="staff@smartstock.local"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30 focus:border-[#4fb0a5]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {mode === 'create' ? 'รหัสผ่าน (Password)' : 'เปลี่ยนรหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่เปลี่ยน)'}
            </label>
            <input
              type="password"
              required={mode === 'create'}
              placeholder={mode === 'create' ? 'ขั้นต่ำ 6 ตัวอักษร' : '••••••••'}
              value={formData.password || ''}
              onChange={(e) => onChange('password', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30 focus:border-[#4fb0a5]"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
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
                    className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      isSelected
                        ? 'bg-[#12312d] text-white border-[#4fb0a5] shadow-md shadow-[#4fb0a5]/10'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{role.display_name}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {role.name}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#4fb0a5] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#4fb0a5] hover:bg-[#3ea094] text-slate-950 text-xs font-bold shadow-md shadow-[#4fb0a5]/20"
            >
              {mode === 'create' ? 'สร้างพนักงาน' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
