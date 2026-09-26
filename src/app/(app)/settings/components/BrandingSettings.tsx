'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, Image as ImageIcon, Globe, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface BrandingImage {
  key: 'logo' | 'favicon' | 'og_image';
  label: string;
  description: string;
  accept: string;
  maxSize: string;
  recommended: string;
  currentUrl: string | null;
  endpoint: string;
  fieldName: string;
  aspectHint?: string;
}

export default function BrandingSettings() {
  const { token, currentStore, refreshStores } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (!currentStore) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xs text-center text-stone-500 text-sm">
        กรุณาเลือกร้านค้าก่อน
      </div>
    );
  }

  const brandingImages: BrandingImage[] = [
    {
      key: 'logo',
      label: 'โลโก้ร้าน',
      description: 'แสดงบน Sidebar, หน้า Login และหัวเอกสาร',
      accept: 'image/jpeg,image/png,image/webp,image/svg+xml',
      maxSize: '4MB',
      recommended: '512 × 512 px',
      currentUrl: (currentStore as any).logo_url || null,
      endpoint: `/stores/${currentStore.id}/logo`,
      fieldName: 'logo',
      aspectHint: '1:1',
    },
    {
      key: 'favicon',
      label: 'Favicon',
      description: 'ไอคอนที่แสดงบนแถบแท็บเบราว์เซอร์',
      accept: 'image/png,image/x-icon,image/svg+xml,image/webp',
      maxSize: '2MB',
      recommended: '32 × 32 px หรือ 64 × 64 px',
      currentUrl: (currentStore as any).favicon_url || null,
      endpoint: `/stores/${currentStore.id}/favicon`,
      fieldName: 'favicon',
      aspectHint: '1:1',
    },
    {
      key: 'og_image',
      label: 'OG Image',
      description: 'รูปที่แสดงเมื่อแชร์ลิงก์ในโซเชียลมีเดีย (Facebook, LINE, Twitter)',
      accept: 'image/jpeg,image/png,image/webp',
      maxSize: '4MB',
      recommended: '1200 × 630 px',
      currentUrl: (currentStore as any).og_image_url || null,
      endpoint: `/stores/${currentStore.id}/og-image`,
      fieldName: 'og_image',
      aspectHint: '1.91:1',
    },
  ];

  const handleUpload = async (img: BrandingImage, file: File) => {
    setUploading(img.key);

    try {
      const formData = new FormData();
      formData.append(img.fieldName, file);

      const res = await fetch(`${API_BASE_URL}${img.endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'อัปโหลดล้มเหลว');
      }

      await refreshStores();
      showToast(`อัปโหลด${img.label}สำเร็จ`, 'success');
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (img: BrandingImage, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(img, file);
    }
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="p-2 bg-stone-100 rounded-xl">
            <Sparkles className="w-5 h-5 text-stone-700" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">
              แบรนด์ดิ้ง &mdash; {currentStore.name}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              จัดการรูปโลโก้ Favicon และ OG Image สำหรับร้านค้า
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {brandingImages.map((img) => (
            <div
              key={img.key}
              className="relative rounded-2xl border border-stone-200/80 bg-stone-50/50 overflow-hidden transition-all hover:border-stone-300 hover:shadow-sm"
            >
              {/* Preview Area */}
              <div
                className={`relative flex items-center justify-center bg-white border-b border-stone-100 ${
                  img.key === 'og_image' ? 'h-36' : 'h-32'
                }`}
              >
                {img.currentUrl ? (
                  <img
                    src={img.currentUrl}
                    alt={img.label}
                    className={`object-contain p-3 ${
                      img.key === 'og_image' ? 'max-h-32 w-full' : 'max-h-24 max-w-24'
                    }`}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-stone-300">
                    {img.key === 'og_image' ? (
                      <Globe className="w-10 h-10" />
                    ) : (
                      <ImageIcon className="w-10 h-10" />
                    )}
                    <span className="text-[10px] font-medium text-stone-400">ยังไม่มีรูป</span>
                  </div>
                )}

                {/* Upload overlay on hover */}
                <button
                  type="button"
                  onClick={() => fileRefs.current[img.key]?.click()}
                  disabled={uploading === img.key}
                  className="absolute inset-0 flex items-center justify-center bg-stone-900/0 hover:bg-stone-900/60 transition-all cursor-pointer group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-white text-xs font-medium bg-stone-900/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {uploading === img.key ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        กำลังอัปโหลด...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        {img.currentUrl ? 'เปลี่ยนรูป' : 'อัปโหลด'}
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Info */}
              <div className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 text-xs">{img.label}</span>
                  {img.currentUrl && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-2.5 h-2.5" /> ตั้งค่าแล้ว
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">{img.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-stone-400 pt-1">
                  <span>แนะนำ: {img.recommended}</span>
                  <span>&middot;</span>
                  <span>ไม่เกิน {img.maxSize}</span>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={(el) => { fileRefs.current[img.key] = el; }}
                type="file"
                accept={img.accept}
                onChange={(e) => handleFileChange(img, e)}
                className="hidden"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border transition-all animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <X className="w-4 h-4 text-rose-600" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
