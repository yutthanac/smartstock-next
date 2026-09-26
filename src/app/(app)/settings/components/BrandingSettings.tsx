'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Check, Image as ImageIcon, Globe, Sparkles, Store as StoreIcon, Save, RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';

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
  const { token, activeStore, stores, refreshStores, setActiveStore } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, { file: File; preview: string }>>({});
  const [localStoreOverrides, setLocalStoreOverrides] = useState<Record<number, Partial<Record<'logo_url' | 'favicon_url' | 'og_image_url', string>>>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (activeStore?.id && !selectedStoreId) {
      setSelectedStoreId(activeStore.id);
    }
  }, [activeStore?.id, selectedStoreId]);

  // Clear pending files when changing store
  useEffect(() => {
    setPendingFiles({});
  }, [selectedStoreId]);

  const rawStore = stores.find((s) => s.id === selectedStoreId) || activeStore || stores[0];
  const overrides = rawStore?.id ? localStoreOverrides[rawStore.id] : undefined;
  const currentStore = rawStore ? { ...rawStore, ...overrides } : null;

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
      currentUrl: currentStore.logo_url || null,
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
      currentUrl: currentStore.favicon_url || null,
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
      currentUrl: currentStore.og_image_url || null,
      endpoint: `/stores/${currentStore.id}/og-image`,
      fieldName: 'og_image',
      aspectHint: '1.91:1',
    },
  ];

  const handleFileSelect = (img: BrandingImage, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPendingFiles((prev) => ({
        ...prev,
        [img.key]: { file, preview: previewUrl },
      }));
    }
    e.target.value = '';
  };

  const handleCancelPending = (key: string) => {
    setPendingFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const hasPendingChanges = Object.keys(pendingFiles).length > 0;

  const handleSaveAll = async () => {
    if (!hasPendingChanges) return;

    setSaving(true);
    const errors: string[] = [];

    for (const [key, item] of Object.entries(pendingFiles)) {
      const imgDef = brandingImages.find((b) => b.key === key);
      if (!imgDef) continue;

      try {
        const formData = new FormData();
        formData.append(imgDef.fieldName, item.file);

        const res = await fetch(`${API_BASE_URL}${imgDef.endpoint}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          errors.push(`${imgDef.label}: ${err?.message || 'ล้มเหลว'}`);
        } else {
          const resData = await res.json().catch(() => null);
          const newUrl =
            resData?.[`${imgDef.key}_url`] ||
            resData?.[`${imgDef.key}_path`] ||
            resData?.data?.[`${imgDef.key}_url`];

          if (newUrl && currentStore?.id) {
            setLocalStoreOverrides((prev) => ({
              ...prev,
              [currentStore.id]: {
                ...prev[currentStore.id],
                [`${imgDef.key}_url`]: newUrl,
              },
            }));
          }
        }
      } catch (err: any) {
        errors.push(`${imgDef.label}: ${err?.message || 'ข้อผิดพลาดเครือข่าย'}`);
      }
    }

    await refreshStores();

    // If current store is the active store, also update activeStore directly so favicon and logos re-render immediately
    if (activeStore && currentStore && activeStore.id === currentStore.id) {
      try {
        const freshRes = await fetch(`${API_BASE_URL}/stores/${currentStore.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        if (freshRes.ok) {
          const freshData = await freshRes.json();
          setActiveStore({
            ...activeStore,
            logo_url: freshData.logo_url || activeStore.logo_url,
            favicon_url: freshData.favicon_url || activeStore.favicon_url,
            og_image_url: freshData.og_image_url || activeStore.og_image_url,
          });
        }
      } catch (e) {
        console.warn('Failed to fetch updated store branding:', e);
      }
    }

    if (errors.length === 0) {
      setPendingFiles({});
      showToast('บันทึกรูปภาพแบรนด์ดิ้งเรียบร้อยแล้ว', 'success');
    } else {
      showToast(`มีข้อผิดพลาด: ${errors.join(', ')}`, 'error');
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900 text-sm">
                  แบรนด์ดิ้ง &mdash; {currentStore.name}
                </h3>
                {activeStore?.id === currentStore?.id && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                    กำลังใช้งาน
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                จัดการรูปโลโก้ Favicon และ OG Image สำหรับร้านค้า
              </p>
            </div>
          </div>

          {stores.length > 1 && (
            <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200/80 shrink-0">
              <span className="text-xs font-normal text-stone-600 pl-1">ร้าน:</span>
              <Dropdown
                value={selectedStoreId || currentStore.id}
                onChange={(val) => setSelectedStoreId(Number(val))}
                options={stores.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                size="sm"
                buttonClassName="font-normal bg-white border border-stone-300 text-stone-800 rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {brandingImages.map((img) => {
            const pending = pendingFiles[img.key];
            const displayUrl = pending ? pending.preview : img.currentUrl;

            return (
              <div
                key={img.key}
                className={`relative rounded-2xl border overflow-hidden transition-all ${
                  pending
                    ? 'border-amber-400 bg-amber-50/20 shadow-xs ring-2 ring-amber-400/20'
                    : 'border-stone-200/80 bg-stone-50/50 hover:border-stone-300 hover:shadow-xs'
                }`}
              >
                {/* Preview Area */}
                <div
                  className={`relative flex items-center justify-center bg-white border-b border-stone-100 ${
                    img.key === 'og_image' ? 'h-36' : 'h-32'
                  }`}
                >
                  {displayUrl ? (
                    <img
                      src={displayUrl}
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
                    disabled={saving}
                    className="absolute inset-0 flex items-center justify-center bg-stone-900/0 hover:bg-stone-900/60 transition-all cursor-pointer group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-white text-xs font-medium bg-stone-900/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <Upload className="w-3.5 h-3.5" />
                      {displayUrl ? 'เปลี่ยนรูป' : 'เลือกรูป'}
                    </span>
                  </button>
                </div>

                {/* Info */}
                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900 text-xs">{img.label}</span>
                    {pending ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        เลือกรูปแล้ว
                      </span>
                    ) : img.currentUrl ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-2.5 h-2.5" /> ตั้งค่าแล้ว
                      </span>
                    ) : null}
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
                  onChange={(e) => handleFileSelect(img, e)}
                  className="hidden"
                />
              </div>
            );
          })}
        </div>

        {/* Save Bar */}
        {hasPendingChanges && (
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200/80 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs text-stone-600">
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPendingFiles({})}
                disabled={saving}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิกทั้งหมด
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAll}
                disabled={saving}
                className="gap-1.5"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    บันทึกรูปภาพ
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
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
