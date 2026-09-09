'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Camera, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700 flex items-center justify-center">
              <Camera className="w-5 h-5 text-stone-700" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">ส่งรูปใบเสร็จ / บิลซื้อของ</h3>
              <p className="text-xs text-stone-500">อัปโหลดใบเสร็จเพื่อให้ AI ตรวจสอบและส่งให้ผู้จัดการตรวจ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* PO Info Card */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-stone-900 text-xs font-mono tabular-nums">{po.id}</div>
              <div className="text-xs text-stone-500 mt-0.5">
                {po.store_name || 'ตลาด / ร้านทั่วไป'} • <span className="font-mono tabular-nums">{po.items.length}</span> รายการ
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
              รอส่งใบเสร็จ
            </span>
          </div>

          {/* Actual Store optional input */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              สถานที่ซื้อจริง (หากต่างจากลิสต์เดิม หรือระบุเพิ่มเติม):
            </label>
            <input
              type="text"
              placeholder={`เช่น ${po.store_name || 'แม็คโคร สาขาบางชัน, ตลาดสด...'}`}
              value={actualStore}
              onChange={(e) => setActualStore(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:border-stone-400 text-stone-900 text-xs"
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
            <label className="font-semibold text-stone-700 block mb-1">
              รูปถ่ายใบเสร็จ / บิลเงินสด / สลิปโอนเงิน:
            </label>

            {receiptImage ? (
              <div className="relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-950 flex flex-col items-center">
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
                  className="max-h-80 w-auto object-contain"
                />
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-stone-900/80 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors shadow-xs cursor-pointer"
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
                    ? 'border-stone-900 bg-stone-100 scale-[1.01]'
                    : 'border-stone-300 bg-stone-50 hover:bg-stone-100/80 hover:border-stone-400'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-stone-200 flex items-center justify-center mb-3 text-stone-600">
                  <Upload className="w-6 h-6 text-stone-700" />
                </div>
                <p className="text-xs font-semibold text-stone-800 mb-1">
                  คลิกเพื่อถ่ายรูปใบเสร็จ หรือลากรูปมาวางที่นี่
                </p>
                <p className="text-xs text-stone-500">
                  รองรับ JPG, PNG, WEBP ชัดเจนเพื่อให้อ่านตัวหนังสือและตัวเลขได้
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-[#f5efe6] border border-[#e8ded0] rounded-xl flex items-start gap-2.5 text-xs text-[#78350f]">
            <CheckCircle2 className="w-4 h-4 text-[#92400e] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-900">ระบบ AI จะช่วยอ่านรายการและราคาอัตโนมัติ:</span>
              <p className="text-stone-600 mt-0.5">
                เมื่อส่งแล้ว ระบบจะส่งเข้าสู่คิวตรวจสอบของผู้จัดการร้าน เพื่อรีเช็คความถูกต้องก่อนรับเข้าสต็อกจริง
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={!receiptImage}
              className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"
            >
              ส่งใบเสร็จเพื่อรอตรวจ
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
