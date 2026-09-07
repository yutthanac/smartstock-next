'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Camera, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { Button } from '@/components/Button';

interface UploadReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  onUploadSuccess: (poId: string, receiptBase64: string, actualStore?: string) => void;
}

export const UploadReceiptModal: React.FC<UploadReceiptModalProps> = ({
  isOpen,
  onClose,
  po,
  onUploadSuccess,
}) => {
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [actualStore, setActualStore] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !po) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์ภาพถ่ายใบเสร็จ (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('ขนาดไฟล์ภาพต้องไม่เกิน 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1600; // Keep high resolution for receipt OCR readability
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setReceiptImage(compressed);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptImage) {
      alert('กรุณาถ่ายรูปหรืออัปโหลดรูปใบเสร็จก่อนส่ง');
      return;
    }
    onUploadSuccess(po.id, receiptImage, actualStore.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Camera className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">ส่งรูปใบเสร็จ / บิลซื้อของ</h3>
              <p className="text-xs text-slate-500">อัปโหลดใบเสร็จเพื่อให้ AI ตรวจสอบและส่งให้ผู้จัดการตรวจ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* PO Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800 text-xs">{po.id}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {po.store_name || 'ตลาด / ร้านทั่วไป'} • {po.items.length} รายการ
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              รอส่งใบเสร็จ
            </span>
          </div>

          {/* Actual Store optional input */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              สถานที่ซื้อจริง (หากต่างจากลิสต์เดิม หรือระบุเพิ่มเติม):
            </label>
            <input
              type="text"
              placeholder={`เช่น ${po.store_name || 'แม็คโคร สาขาบางชัน, ตลาดสด...'}`}
              value={actualStore}
              onChange={(e) => setActualStore(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-slate-900 text-xs"
            />
          </div>

          {/* File Upload / Camera Zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
              if (e.target) e.target.value = '';
            }}
            className="hidden"
          />

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              รูปถ่ายใบเสร็จ / บิลเงินสด / สลิปโอนเงิน:
            </label>

            {receiptImage ? (
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 flex flex-col items-center">
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
                  className="max-h-80 w-auto object-contain"
                />
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors shadow-xs cursor-pointer"
                  >
                    ถ่ายใหม่ / เปลี่ยนรูป
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptImage('')}
                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                    title="ลบรูป"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-10 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center select-none ${
                  isDragging
                    ? 'border-[#4fb0a5] bg-[#4fb0a5]/10 scale-[1.01]'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mb-3 text-slate-600">
                  <Upload className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-slate-800 mb-1">
                  คลิกเพื่อถ่ายรูปใบเสร็จ หรือลากรูปมาวางที่นี่
                </p>
                <p className="text-[11px] text-slate-400">
                  รองรับ JPG, PNG, WEBP ชัดเจนเพื่อให้อ่านตัวหนังสือและตัวเลขได้
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">ระบบ AI จะช่วยอ่านรายการและราคาอัตโนมัติ:</span>
              <p className="text-emerald-700 mt-0.5">
                เมื่อส่งแล้ว ระบบจะส่งเข้าสู่คิวตรวจสอบของผู้จัดการร้าน เพื่อรีเช็คความถูกต้องก่อนรับเข้าสต็อกจริง
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={!receiptImage}
            >
              ส่งใบเสร็จให้ผู้จัดการตรวจ
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
