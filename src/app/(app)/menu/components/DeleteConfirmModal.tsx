'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { MenuItem } from '@/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">ยืนยันการลบเมนู</h3>
              <p className="text-xs text-stone-500">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 space-y-3">
          {/* Target Item Preview Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
            {item.image ? (
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-12 h-12 rounded-lg object-cover border border-stone-200" 
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-stone-200 flex items-center justify-center text-stone-400 font-bold text-sm">
                {item.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-stone-900 truncate">{item.name}</h4>
              <p className="text-xs text-stone-500">{item.category} • ฿{item.price.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              สูตรวัตถุดิบ (BOM) และตัวเลือกเสริม (Add-on) ทั้งหมดที่ผูกกับเมนูนี้จะถูกลบออกไปด้วยทันที
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold rounded-xl"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                ยืนยันการลบ
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
