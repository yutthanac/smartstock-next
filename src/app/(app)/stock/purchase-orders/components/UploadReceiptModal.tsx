'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Camera, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { Button } from '@/components/Button';

interface UploadReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  onUploadSuccess: (poId: string, receiptImages: string[], actualStore?: string) => void;
}

export const UploadReceiptModal: React.FC<UploadReceiptModalProps> = ({
  isOpen,
  onClose,
  po,
  onUploadSuccess,
}) => {
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [actualStore, setActualStore] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activePreviewIdx, setActivePreviewIdx] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !po) return null;

  // Process a single file to canvas compressed base64
  const compressFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('กรุณาเลือกไฟล์ภาพถ่ายใบเสร็จ (JPG, PNG, WEBP)'));
      }
      if (file.size > 10 * 1024 * 1024) {
        return reject(new Error('ขนาดไฟล์ภาพต้องไม่เกิน 10MB'));
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
            resolve(compressed);
          } else {
            reject(new Error('Canvas context unavailable'));
          }
        };
        img.onerror = () => reject(new Error('ไม่สามารถโหลดไฟล์รูปภาพได้'));
        if (typeof event.target?.result === 'string') {
          img.src = event.target.result;
        }
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('กรุณาเลือกไฟล์ภาพถ่ายใบเสร็จ (JPG, PNG, WEBP)');
      return;
    }

    try {
      const compressedResults = await Promise.all(validFiles.map((file) => compressFile(file)));
      setReceiptImages((prev) => {
        const updated = [...prev, ...compressedResults];
        setActivePreviewIdx(prev.length);
        return updated;
      });
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์ภาพ');
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setReceiptImages((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (activePreviewIdx >= next.length) {
        setActivePreviewIdx(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiptImages.length === 0) {
      alert('กรุณาถ่ายรูปหรืออัปโหลดรูปใบเสร็จอย่างน้อย 1 รูปก่อนส่ง');
      return;
    }
    onUploadSuccess(po.id, receiptImages, actualStore.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center">
              <Camera className="w-4 h-4 text-stone-700" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm sm:text-base">
                อัปโหลดรูปใบเสร็จ / บิลซื้อของ
              </h3>
              <p className="text-xs text-stone-500">
                สามารถแนบได้หลายรูป (เช่น บิลหลายแผ่น หรือใบเสร็จหลายร้าน)
              </p>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* PO Info Bar */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-stone-900 font-mono tabular-nums text-xs">{po.id}</div>
              <div className="text-xs text-stone-500 mt-0.5">
                {po.store_name || 'ตลาด / ร้านทั่วไป'} •{' '}
                <span className="font-mono tabular-nums">{po.items.length}</span> รายการในลิสต์
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
              รอส่งใบเสร็จ
            </span>
          </div>
          {/* Multi-file Hidden Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
              if (e.target) e.target.value = '';
            }}
            className="hidden"
          />

          {/* Upload Area & Image Gallery */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-700 block">
                รูปถ่ายใบเสร็จ / บิลเงินสด ({receiptImages.length} รูป)
              </label>
              {receiptImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มรูปอีก
                </button>
              )}
            </div>

            {receiptImages.length === 0 ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-9 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center select-none ${
                  isDragging
                    ? 'border-stone-900 bg-stone-100 scale-[1.01]'
                    : 'border-stone-300 bg-stone-50 hover:bg-stone-100/80 hover:border-stone-400'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-white shadow-xs border border-stone-200 flex items-center justify-center mb-2.5 text-stone-600">
                  <Upload className="w-5 h-5 text-stone-700" />
                </div>
                <p className="text-xs font-semibold text-stone-800 mb-1">
                  คลิกเพื่อถ่ายรูปใบเสร็จ หรือลากรูปมาวางที่นี่
                </p>
                <p className="text-xs text-stone-500 mb-3">
                  เลือกได้พร้อมกันหลายรูป (JPG, PNG, WEBP) ตัวหนังสือคมชัด
                </p>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const sampleSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 540" width="420" height="540" style="background:#ffffff;font-family:monospace;">
  <rect width="420" height="540" fill="#fffdfa" stroke="#e2e8f0" stroke-width="2" rx="8"/>
  <text x="210" y="45" font-size="18" font-weight="900" text-anchor="middle" fill="#0f172a">AROMA SPECIALTY COFFEE</text>
  <text x="210" y="68" font-size="11" text-anchor="middle" fill="#64748b">บิลเงินสด / ใบเสร็จรับเงิน</text>
  <line x1="20" y1="90" x2="400" y2="90" stroke="#cbd5e1" stroke-dasharray="4"/>
  <text x="20" y="115" font-size="12" fill="#334155">วันที่: ${new Date().toISOString().split('T')[0]}</text>
  <text x="400" y="115" font-size="12" text-anchor="end" fill="#334155">บิลเลขที่: #INV-ETHIOPIA</text>
  <line x1="20" y1="135" x2="400" y2="135" stroke="#cbd5e1" stroke-dasharray="4"/>
  <text x="20" y="175" font-size="13" font-weight="bold" fill="#0f172a">เมล็ดกาแฟ Single Origin Ethiopia (คั่วอ่อน)</text>
  <text x="30" y="195" font-size="11" fill="#64748b">6 ชิ้น (ถุงละ 500g = 3 กก.) x @650.00</text>
  <text x="400" y="175" font-size="14" font-weight="bold" text-anchor="end" fill="#0f172a">3,900.00</text>
  <line x1="20" y1="240" x2="400" y2="240" stroke="#cbd5e1" stroke-dasharray="4"/>
  <text x="20" y="275" font-size="13" fill="#475569">จำนวนรวม</text>
  <text x="400" y="275" font-size="13" text-anchor="end" fill="#475569">6 ชิ้น (3 กก.)</text>
  <text x="20" y="315" font-size="15" font-weight="900" fill="#0f172a">ยอดสุทธิ (TOTAL)</text>
  <text x="400" y="315" font-size="18" font-weight="900" text-anchor="end" fill="#047857">฿ 3,900.00</text>
  <line x1="20" y1="350" x2="400" y2="350" stroke="#0f172a" stroke-width="1.5"/>
  <text x="210" y="390" font-size="12" text-anchor="middle" fill="#64748b">ชำระแล้ว: โอนเงิน PromptPay</text>
  <rect x="145" y="430" width="130" height="38" rx="8" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="3"/>
  <text x="210" y="455" font-size="13" font-weight="bold" text-anchor="middle" fill="#059669">PAID / ชำระแล้ว</text>
</svg>`);
                    setReceiptImages([sampleSvg]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                >
                  <Camera className="w-3.5 h-3.5 text-stone-600" />
                  <span>ใช้รูปบิลทดสอบ (Ethiopia 6 ชิ้น ฿3,900)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Main Preview */}
                <div className="relative rounded-xl border border-stone-200 bg-stone-950 flex items-center justify-center overflow-hidden min-h-[220px] max-h-[300px]">
                  <img
                    src={receiptImages[activePreviewIdx] || receiptImages[0]}
                    alt={`Receipt ${activePreviewIdx + 1}`}
                    className="max-h-[300px] w-auto object-contain"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-stone-900/80 text-white text-[11px] font-semibold backdrop-blur-xs font-mono">
                    ใบที่ {activePreviewIdx + 1} จาก {receiptImages.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(activePreviewIdx)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                    title="ลบรูปนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnails Strip */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {receiptImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActivePreviewIdx(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                        activePreviewIdx === idx
                          ? 'border-stone-900 ring-2 ring-stone-900/20'
                          : 'border-stone-200 hover:border-stone-400 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-stone-900/80 text-white text-[10px] font-mono leading-tight">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}

                  {/* Add more button tile */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-300 hover:border-stone-500 bg-stone-50 hover:bg-stone-100 flex flex-col items-center justify-center shrink-0 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                    title="เพิ่มรูปภาพอีก"
                  >
                    <Plus className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] font-medium">เพิ่ม</span>
                  </button>
                </div>
              </div>
            )}
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
              disabled={receiptImages.length === 0}
              className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"
            >
              ส่งใบเสร็จ ({receiptImages.length} รูป)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
