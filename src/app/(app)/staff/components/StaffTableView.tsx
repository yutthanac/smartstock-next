import React from 'react';
import { Shield, Mail, Edit2, Trash2, Key, Store } from 'lucide-react';
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
            <tr className="bg-transparent border-b border-slate-200 text-sm font-semibold text-slate-900">
              <th className="py-4 px-6 font-semibold">พนักงาน (Staff)</th>
              <th className="py-4 px-6 font-semibold">อีเมล (Email)</th>
              <th className="py-4 px-6 font-semibold">สังกัดร้านค้า (Store)</th>
              <th className="py-4 px-6 font-semibold">บทบาท & สิทธิ์ (Roles)</th>
              <th className="py-4 px-6 font-semibold">จำนวนสิทธิ์</th>
              <th className="py-4 px-6 font-semibold">วันที่สร้าง</th>
              <th className="py-4 px-6 text-right font-semibold">จัดการ</th>
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
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-normal flex items-center justify-center text-xs shadow-sm">
                        {staff.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-normal text-slate-800 flex items-center gap-1.5">
                          {staff.name}
                          {isMe && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                              คุณ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                          ID: {staff.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-4 px-6 text-slate-600 font-normal">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                            className="text-[10px] font-normal px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                          >
                            <Store className="w-3 h-3 text-slate-500" />
                            {st.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">ทุกร้าน (ส่วนกลาง)</span>
                    )}
                  </td>

                  {/* Roles */}
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {staff.roles.map((r) => (
                        <span
                          key={r.id || r.name}
                          className={`text-[10px] font-normal px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                            r.name === 'admin'
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
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
                  <td className="py-4 px-6 text-slate-500 font-normal">
                    <span className="inline-flex items-center gap-1 text-[11px] font-normal bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      <Key className="w-3 h-3 text-slate-500" />
                      {staff.permissions.length} สิทธิ์
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="py-4 px-6 text-slate-400 text-[11px]">
                    {new Date(staff.created_at).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(staff)}
                        title="แก้ไขสิทธิ์"
                        className="p-2 rounded-xl text-slate-400 hover:text-[#4fb0a5] hover:bg-[#4fb0a5]/10 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(staff.id, staff.name)}
                        disabled={isMe}
                        title={isMe ? 'ไม่สามารถลบตัวเองได้' : 'ลบพนักงาน'}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isMe
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
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
