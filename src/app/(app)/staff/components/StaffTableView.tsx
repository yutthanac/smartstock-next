import React from 'react';
import { Shield, Mail, Edit2, Trash2, Key, Store } from 'lucide-react';
import { StaffUser } from './types';

interface StaffTableViewProps {
  staffList: StaffUser[];
  currentUserId?: string;
  currentUserRole?: string;
  onEdit: (staff: StaffUser) => void;
  onDelete: (id: string, name: string) => void;
}

export const StaffTableView: React.FC<StaffTableViewProps> = ({
  staffList,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/50 border-b border-stone-200 text-xs font-semibold text-stone-900">
              <th className="py-4 px-6 font-semibold whitespace-nowrap">พนักงาน (Staff)</th>
              <th className="py-4 px-6 font-semibold whitespace-nowrap">อีเมล (Email)</th>
              <th className="py-4 px-6 font-semibold whitespace-nowrap">สังกัดร้านค้า (Store)</th>
              <th className="py-4 px-6 font-semibold whitespace-nowrap">บทบาท & สิทธิ์ (Roles)</th>
              <th className="py-4 px-6 font-semibold whitespace-nowrap">จำนวนสิทธิ์</th>
              <th className="py-4 px-6 font-semibold whitespace-nowrap">วันที่สร้าง</th>
              <th className="py-4 px-6 text-right font-semibold whitespace-nowrap w-24">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {staffList.map((staff) => {
              const isMe = currentUserId === staff.id;
              const isAdminTarget = staff.username === 'admin' || staff.roles.some((r) => r.name === 'admin');
              const canEdit = currentUserRole === 'admin' || !isAdminTarget;

              return (
                <tr key={staff.id} className="hover:bg-stone-50/70 transition-colors">
                  {/* Name & Avatar */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-900 text-white font-normal flex items-center justify-center text-xs shadow-xs font-mono uppercase overflow-hidden shrink-0 border border-stone-200/80">
                        {staff.avatar ? (
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          staff.name.slice(0, 2)
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-stone-900 flex items-center gap-1.5 text-xs">
                          {staff.name}
                          {isMe && (
                            <span className="text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-normal">
                              คุณ
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-400 font-mono truncate max-w-[150px]">
                          ID: {staff.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-4 px-6 text-stone-600 font-normal">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{staff.email}</span>
                    </div>
                  </td>

                  {/* Stores */}
                  <td className="py-4 px-6">
                    {staff.stores && staff.stores.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {staff.stores.map((st) => (
                          <span
                            key={st.id}
                            className="text-xs font-normal px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center gap-1"
                          >
                            <Store className="w-3 h-3 text-stone-500" />
                            {st.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 italic">ทุกร้าน (ส่วนกลาง)</span>
                    )}
                  </td>

                  {/* Roles */}
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {staff.roles.map((r) => (
                        <span
                          key={r.id || r.name}
                          className={`text-xs font-normal px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                            r.name === 'admin'
                              ? 'bg-stone-100 text-stone-800 border border-stone-200'
                              : r.name === 'manager'
                              ? 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]'
                              : 'bg-stone-50 text-stone-700 border border-stone-200/70'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {r.display_name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Permissions count */}
                  <td className="py-4 px-6 text-stone-500 font-normal">
                    <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                      <Key className="w-3 h-3 text-stone-500" />
                      {staff.permissions.length} สิทธิ์
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="py-4 px-6 text-stone-400 text-xs font-mono tabular-nums">
                    {new Date(staff.created_at).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 shrink-0">
                      {canEdit ? (
                        <button
                          onClick={() => onEdit(staff)}
                          title="แก้ไขสิทธิ์"
                          className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          title="บัญชี System Admin สงวนสิทธิ์ไม่ให้แก้ไข"
                          className="p-2 text-stone-300 cursor-not-allowed"
                        >
                          <Shield className="w-4 h-4" />
                        </span>
                      )}
                      <button
                        onClick={() => onDelete(staff.id, staff.name)}
                        disabled={isMe || isAdminTarget}
                        title={
                          isAdminTarget
                            ? 'ไม่สามารถลบบัญชี System Admin ได้'
                            : isMe
                            ? 'ไม่สามารถลบตัวเองได้'
                            : 'ลบพนักงาน'
                        }
                        className={`p-2 rounded-xl transition-colors ${
                          isMe || isAdminTarget
                            ? 'text-stone-200 cursor-not-allowed'
                            : 'text-stone-400 hover:text-rose-600 hover:bg-stone-100 cursor-pointer'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
