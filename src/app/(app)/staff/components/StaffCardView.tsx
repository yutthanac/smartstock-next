import React from 'react';
import { Shield, Mail, Edit2, Trash2 } from 'lucide-react';
import { StaffUser } from './types';

interface StaffCardViewProps {
  staffList: StaffUser[];
  currentUserId?: string;
  onEdit: (staff: StaffUser) => void;
  onDelete: (id: string, name: string) => void;
}

export const StaffCardView: React.FC<StaffCardViewProps> = ({
  staffList,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {staffList.map((staff) => {
        const isMe = currentUserId === staff.id;

        return (
          <div
            key={staff.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#12312d] to-[#4fb0a5] text-white font-bold flex items-center justify-center text-sm shadow-md shadow-[#4fb0a5]/15">
                    {staff.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                      {isMe && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          คุณ
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">{staff.id}</p>
                  </div>
                </div>
              </div>

              {/* Roles Badges */}
              <div className="flex flex-wrap gap-1.5">
                {staff.roles.map((r) => (
                  <span
                    key={r.id || r.name}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
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

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{staff.email}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => onEdit(staff)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#4fb0a5]/15 hover:text-[#12312d] text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                แก้ไขสิทธิ์
              </button>

              {!isMe && (
                <button
                  onClick={() => onDelete(staff.id, staff.name)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="ลบผู้ใช้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
