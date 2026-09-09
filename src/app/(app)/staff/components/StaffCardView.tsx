import React from 'react';
import { Shield, Mail, Edit2, Trash2, Store } from 'lucide-react';
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
            className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white font-normal flex items-center justify-center text-sm shadow-xs font-mono uppercase">
                    {staff.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-medium text-stone-900 text-sm">{staff.name}</h4>
                      {isMe && (
                        <span className="text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-normal">
                          คุณ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 font-mono truncate max-w-[140px]">{staff.id}</p>
                  </div>
                </div>

                <span className="text-xs font-mono tabular-nums text-stone-500 bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-200/80">
                  {staff.permissions.length} สิทธิ์
                </span>
              </div>

              {/* Email */}
              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{staff.email}</span>
              </div>

              {/* Roles Badges */}
              <div className="flex flex-wrap gap-1.5">
                {staff.roles.map((r) => (
                  <span
                    key={r.id || r.name}
                    className={`text-xs font-normal px-2.5 py-1 rounded-xl flex items-center gap-1 ${
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

              {/* Store Affiliation */}
              <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 flex-wrap">
                {staff.stores && staff.stores.length > 0 ? (
                  staff.stores.map((st) => (
                    <span
                      key={st.id}
                      className="text-xs font-normal px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center gap-1"
                    >
                      <Store className="w-3 h-3 text-stone-500" />
                      {st.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400 italic">ทุกร้าน (ส่วนกลาง)</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                onClick={() => onEdit(staff)}
                className="flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                แก้ไขสิทธิ์
              </button>

              {!isMe && (
                <button
                  onClick={() => onDelete(staff.id, staff.name)}
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors cursor-pointer"
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
