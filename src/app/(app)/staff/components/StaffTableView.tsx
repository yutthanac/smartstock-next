import React from 'react';
import { Shield, Mail, Edit2, Trash2, Key } from 'lucide-react';
import { StaffUser } from './types';

interface StaffTableViewProps {
  staffList: StaffUser[];
  currentUserId?: string;
  onEdit: (staff: StaffUser) => void;
  onDelete: (id: string, name: string) => void;
}

export const StaffTableView: React.FC<StaffTableViewProps> = ({
  staffList,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-4 px-6">พนักงาน (Staff)</th>
              <th className="py-4 px-6">อีเมล (Email)</th>
              <th className="py-4 px-6">บทบาท & สิทธิ์ (Roles)</th>
              <th className="py-4 px-6">จำนวนสิทธิ์ (Perms)</th>
              <th className="py-4 px-6">วันที่สร้าง</th>
              <th className="py-4 px-6 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {staffList.map((staff) => {
              const isMe = currentUserId === staff.id;

              return (
                <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Name & Avatar */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#12312d] to-[#4fb0a5] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                        {staff.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {staff.name}
                          {isMe && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                              คุณ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                          {staff.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-4 px-6 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{staff.email}</span>
                    </div>
                  </td>

                  {/* Roles */}
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {staff.roles.map((r) => (
                        <span
                          key={r.id || r.name}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                            r.name === 'admin'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.name === 'manager'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : r.name === 'chef'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {r.display_name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Permissions count */}
                  <td className="py-4 px-6 text-slate-500">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      <Key className="w-3 h-3 text-[#4fb0a5]" />
                      {staff.permissions.length} สิทธิ์
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="py-4 px-6 text-slate-400 text-[11px]">
                    {staff.created_at || '-'}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(staff)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#4fb0a5]/15 hover:text-[#12312d] text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>แก้ไขสิทธิ์</span>
                      </button>

                      {!isMe && (
                        <button
                          onClick={() => onDelete(staff.id, staff.name)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="ลบผู้ใช้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
