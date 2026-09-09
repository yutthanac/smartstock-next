'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ZoomIn,
  Eye,
  Store,
  Calendar,
  Check,
  RotateCw,
  RefreshCw,
  Key,
  Camera,
  Upload,
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '../types';
import { Ingredient } from '@/types';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

export interface VerifiedReceiptItem {
  ingredient_id?: number;
  name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_price: number;
  is_new_stock?: boolean;
}

interface ReceiptVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  ingredients: Ingredient[];
  onApproveAndStockIn: (
    poId: string,
    verifiedItems: VerifiedReceiptItem[],
    actualStore?: string,
    totalReceiptAmount?: number,
    newReceiptImage?: string
  ) => Promise<void>;
  isManagerOrAdmin: boolean;
}

export const ReceiptVerificationModal: React.FC<ReceiptVerificationModalProps> = ({
  isOpen,
  onClose,
  po,
  ingredients,
  onApproveAndStockIn,
  isManagerOrAdmin,
}) => {
  const [currentImage, setCurrentImage] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isNotReceipt, setIsNotReceipt] = useState<boolean>(false);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  const [inputApiKey, setInputApiKey] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);

  const [verifiedItems, setVerifiedItems] = useState<VerifiedReceiptItem[]>([]);
  const [actualStore, setActualStore] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentImageRef = useRef<string>('');

  // Load API key from localStorage if user previously entered it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('smartstock_gemini_api_key') || '';
      setInputApiKey(savedKey);
    }
  }, []);

  const runAiScan = useCallback(
    async (apiKeyToUse?: string, imageToScan?: string) => {
      const imageTarget = imageToScan || currentImageRef.current || po?.receipt_image;
      if (!imageTarget) {
        setIsScanning(false);
        return;
      }

      setIsScanning(true);
      setScanError(null);
      setIsNotReceipt(false);
      setApiKeyMissing(false);

      // Check if it's the realistic demo SVG receipt
      const isSampleDemoSvg = imageTarget.startsWith('data:image/svg+xml');
      if (isSampleDemoSvg) {
        setTimeout(() => {
          const sampleItems: VerifiedReceiptItem[] = [
            {
              ingredient_id: ingredients.find((i) => i.name.includes('เมล็ดกาแฟ House'))?.id,
              name: 'เมล็ดกาแฟ House Blend คั่วกลาง',
              quantity: 10,
              unit: 'กก.',
              cost_per_unit: 380,
              total_price: 3800,
            },
            {
              ingredient_id: ingredients.find((i) => i.name.includes('Single'))?.id,
              name: 'เมล็ดกาแฟ Single Origin Ethiopia (คั่วอ่อน)',
              quantity: 3,
              unit: 'กก.',
              cost_per_unit: 650,
              total_price: 1950,
            },
            {
              ingredient_id: ingredients.find((i) => i.name.includes('มัทฉะ'))?.id,
              name: 'ผงมัทฉะเกรดพิธีการ Uji Matcha 100g',
              quantity: 5,
              unit: 'ถุง',
              cost_per_unit: 280,
              total_price: 1400,
            },
          ];
          setVerifiedItems(sampleItems);
          setActualStore('โรงคั่วกาแฟ Aroma Specialty');
          setReceiptDate(po?.date || new Date().toISOString().split('T')[0]);
          setConfidence(98);
          setIsScanning(false);
        }, 800);
        return;
      }

      // Real image -> Call AI Scan API route
      try {
        const res = await fetch('/api/ai/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageTarget,
            apiKey: apiKeyToUse || inputApiKey || undefined,
          }),
        });

        const data = await res.json();

        if (res.status === 400 && data.error === 'NO_API_KEY') {
          setApiKeyMissing(true);
          setScanError('ยังไม่ได้ตั้งค่า GEMINI_API_KEY สำหรับสแกน AI');
          setVerifiedItems([]);
          setConfidence(0);
          setIsScanning(false);
          return;
        }

        if (!res.ok || data.error) {
          setScanError(data.message || 'เกิดข้อผิดพลาดในการติดต่อ AI');
          setVerifiedItems([]);
          setConfidence(0);
          setIsScanning(false);
          return;
        }

        // Check if AI determined the image is NOT a receipt
        if (data.is_receipt === false) {
          setIsNotReceipt(true);
          setScanError(
            data.error_message ||
              'ภาพที่อัปโหลดไม่ใช่ใบเสร็จหรือบิลเงินสด ไม่พบรายการสินค้าและราคา กรุณาถ่ายภาพใบเสร็จใหม่อีกครั้ง'
          );
          setVerifiedItems([]);
          setConfidence(0);
          setIsScanning(false);
          return;
        }

        // AI found a valid receipt with items
        if (data.store_name) setActualStore(data.store_name);
        if (data.date) setReceiptDate(data.date);
        setConfidence(data.confidence || 95);

        const extractedItems = Array.isArray(data.items) ? data.items : [];
        const mapped: VerifiedReceiptItem[] = extractedItems.map((item: any) => {
          const itemName = String(item.name || '').trim();
          const matchedIng = ingredients.find(
            (ing) =>
              ing.name.toLowerCase().includes(itemName.toLowerCase()) ||
              itemName.toLowerCase().includes(ing.name.toLowerCase())
          );

          const qty = parseFloat(item.quantity) || 1;
          const unit = item.unit || matchedIng?.unit || 'ชิ้น';
          const cost = parseFloat(item.cost_per_unit) || 0;
          const total = parseFloat(item.total_price) || Math.round(qty * cost * 100) / 100;

          return {
            ingredient_id: matchedIng ? matchedIng.id : undefined,
            name: itemName,
            quantity: qty,
            unit,
            cost_per_unit: cost,
            total_price: total,
          };
        });

        setVerifiedItems(mapped);
        setIsScanning(false);
      } catch (err: any) {
        console.error('Scan error:', err);
        setScanError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        setVerifiedItems([]);
        setConfidence(0);
        setIsScanning(false);
      }
    },
    [po?.id, ingredients, inputApiKey]
  );

  // Only initialize on modal open or PO change
  useEffect(() => {
    if (isOpen && po) {
      const initialImg = po.receipt_image || '';
      currentImageRef.current = initialImg;
      setCurrentImage(initialImg);
      setActualStore(po.store_name || 'ตลาด / ร้านทั่วไป');
      setReceiptDate(po.date || new Date().toISOString().split('T')[0]);
      runAiScan(undefined, initialImg);
    }
  }, [isOpen, po?.id, runAiScan]);

  if (!isOpen || !po) return null;

  // Process selected file (Compress via HTML5 Canvas for optimal OCR)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์ภาพถ่าย (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          currentImageRef.current = compressed;
          setCurrentImage(compressed);
          setRotation(0);
          runAiScan(undefined, compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSaveApiKeyAndRetry = () => {
    if (!inputApiKey.trim()) return;
    localStorage.setItem('smartstock_gemini_api_key', inputApiKey.trim());
    runAiScan(inputApiKey.trim());
  };

  const handleUpdateItem = (index: number, field: keyof VerifiedReceiptItem, val: any) => {
    setVerifiedItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: val };
      if (field === 'quantity' || field === 'cost_per_unit') {
        const q = parseFloat(String(current.quantity)) || 0;
        const c = parseFloat(String(current.cost_per_unit)) || 0;
        current.total_price = Math.round(q * c * 100) / 100;
      }
      next[index] = current;
      return next;
    });
  };

  const handleSelectIngredient = (index: number, ingIdStr: string) => {
    const ingId = Number(ingIdStr);
    const ing = ingredients.find((i) => i.id === ingId);
    if (!ing) return;

    setVerifiedItems((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      current.ingredient_id = ing.id;
      current.name = ing.name;
      current.unit = ing.unit;
      if (!current.cost_per_unit || current.cost_per_unit <= 0) {
        current.cost_per_unit = ing.cost_per_unit || 0;
        current.total_price = Math.round((current.quantity || 1) * (ing.cost_per_unit || 0) * 100) / 100;
      }
      next[index] = current;
      return next;
    });
  };

  const handleAddNewItem = () => {
    const firstIng = ingredients[0];
    const newItem: VerifiedReceiptItem = {
      ingredient_id: firstIng ? firstIng.id : undefined,
      name: firstIng ? firstIng.name : 'สินค้าเพิ่มเติม',
      quantity: 1,
      unit: firstIng ? firstIng.unit : 'ชิ้น',
      cost_per_unit: 0,
      total_price: 0,
    };
    setVerifiedItems((prev) => [...prev, newItem]);
    setIsNotReceipt(false);
    setScanError(null);
  };

  const handleRemoveItem = (index: number) => {
    setVerifiedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotal = verifiedItems.reduce((sum, it) => sum + (it.total_price || 0), 0);

  const handleConfirmStockIn = async () => {
    if (verifiedItems.length === 0) {
      alert('กรุณามีรายการสินค้าอย่างน้อย 1 รายการก่อนนำเข้าสต็อก');
      return;
    }
    setIsSubmitting(true);
    try {
      await onApproveAndStockIn(po.id, verifiedItems, actualStore, grandTotal, currentImage);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการบันทึกสต็อก');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      {/* Hidden File Input for Image Replacement */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="bg-white rounded-2xl max-w-7xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#78350f]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900 text-base">
                  ตรวจสอบใบเสร็จ &amp; อนุมัติรับเข้าสต็อก
                </h3>
                <Badge
                  variant={po.status === 'completed' ? 'success' : 'warning'}
                  size="sm"
                  className={
                    po.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-[#e8ded0] bg-[#f5efe6] text-[#78350f]'
                  }
                >
                  {po.status === 'completed' ? 'รับเข้าสต็อกแล้ว' : 'รอผู้จัดการอนุมัติ'}
                </Badge>
              </div>
              <p className="text-xs text-stone-500">
                รหัสลิสต์: <span className="font-mono tabular-nums font-semibold">{po.id}</span> • ผู้ไปซื้อ:{' '}
                <span className="font-medium text-stone-800">{po.buyer_name || 'พนักงาน'}</span>
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

        {/* Body (Split Screen) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 text-xs text-stone-700">
          {/* Left Column: Receipt Photo (5 cols) */}
          <div className="lg:col-span-5 bg-stone-950 p-4 flex flex-col justify-between overflow-y-auto border-b lg:border-b-0 lg:border-r border-stone-800 relative">
            <div className="flex items-center justify-between text-white/80 pb-2 mb-2 border-b border-stone-800">
              <span className="font-semibold text-xs flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-400" />
                รูปภาพใบเสร็จจริง
              </span>
              <div className="flex items-center gap-1.5">
                {/* Change image button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-semibold transition-all cursor-pointer flex items-center gap-1 text-xs shadow-sm active:scale-95"
                  title="เปลี่ยนรูปภาพใบเสร็จใหม่"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                  <span>เปลี่ยนรูป</span>
                </button>

                {/* Rescan button */}
                <button
                  type="button"
                  onClick={() => runAiScan()}
                  disabled={isScanning}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white/80 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  title="สแกนซ้ำ"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                </button>

                {/* Rotate button */}
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white/80 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  title="หมุนภาพ"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Image display with scanning & drag-drop overlay */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-black/40 relative min-h-[280px] p-2 transition-all ${
                isDragging ? 'ring-2 ring-amber-400 bg-amber-950/40' : ''
              }`}
            >
              {currentImage ? (
                <div className="relative w-full h-full flex items-center justify-center group">
                  <img
                    src={currentImage}
                    alt="Receipt"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    className="max-h-[460px] w-auto max-w-full object-contain rounded-lg transition-transform duration-200 shadow-lg"
                  />

                  {/* Hover Quick Action to Replace Image */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2 pointer-events-none">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-stone-900 font-bold text-xs shadow-lg flex items-center gap-1.5 pointer-events-auto cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4 text-stone-700" />
                      เปลี่ยนรูปภาพใบเสร็จ
                    </button>
                  </div>

                  {/* Drag-over indicator */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-stone-900/80 border-2 border-dashed border-amber-400 rounded-lg flex flex-col items-center justify-center text-amber-400 p-4">
                      <Upload className="w-8 h-8 mb-2" />
                      <p className="font-bold text-xs">วางรูปภาพที่นี่เพื่อเปลี่ยนใบเสร็จทันที</p>
                    </div>
                  )}

                  {/* AI Scanning Beam */}
                  {isScanning && !isDragging && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent animate-pulse border-y-2 border-amber-400 pointer-events-none flex items-center justify-center">
                      <div className="px-3.5 py-2 rounded-full bg-stone-900/90 text-amber-300 text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center gap-2 border border-stone-700">
                        <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                        AI กำลังอ่านข้อความและตรวจใบเสร็จ...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-stone-400 p-6 space-y-3">
                  <AlertCircle className="w-8 h-8 mx-auto opacity-50 text-stone-400" />
                  <p className="text-xs">ยังไม่มีภาพถ่ายใบเสร็จ</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" /> อัปโหลดรูปใบเสร็จ
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 text-xs text-white/60 flex items-center justify-between">
              <span>แหล่งซื้อ: {actualStore || 'ตลาด / ร้านทั่วไป'}</span>
              <span>วันที่: <span className="font-mono tabular-nums">{receiptDate || po.date}</span></span>
            </div>
          </div>

          {/* Right Column: AI Extraction & Verification Table (7 cols) */}
          <div className="lg:col-span-7 p-6 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* API Key Missing Setup Card */}
              {apiKeyMissing && (
                <div className="p-4 bg-[#fef3c7]/60 border border-[#fde68a] rounded-2xl space-y-2.5 text-xs text-[#92400e]">
                  <div className="flex items-center gap-2 font-bold text-[#78350f] text-sm">
                    <Key className="w-4 h-4 text-[#78350f]" />
                    เชื่อมต่อ Google Gemini API เพื่อตรวจใบเสร็จจริง
                  </div>
                  <p className="text-[#92400e] text-xs leading-relaxed">
                    ยังไม่พบ <code className="bg-[#fde68a]/60 px-1 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</code> ในระบบ สามารถนำ API Key (ฟรี) มาวางที่นี่เพื่อเริ่มสแกนได้ทันที:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="วาง Gemini API Key ที่นี่ (AIza...)"
                      value={inputApiKey}
                      onChange={(e) => setInputApiKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveApiKeyAndRetry}
                      disabled={!inputApiKey.trim()}
                      className="px-3.5 py-1.5 bg-[#78350f] hover:bg-[#92400e] text-white font-bold rounded-xl text-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      บันทึก &amp; สแกน
                    </button>
                  </div>
                  <div className="text-xs text-[#92400e]">
                    * รับ API Key ฟรีได้ที่ <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-[#78350f]">Google AI Studio</a> (ฟรี 1,500 ครั้ง/วัน)
                  </div>
                </div>
              )}

              {/* NON-RECEIPT DETECTED ALERT BANNER */}
              {isNotReceipt && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 text-xs text-rose-950">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-rose-900 text-sm">
                        AI ตรวจพบว่าภาพนี้ไม่ใช่ใบเสร็จรับเงิน หรือข้อความไม่ชัดเจน
                      </div>
                      <p className="text-rose-700 leading-relaxed">
                        {scanError ||
                          'ระบบตรวจสอบไม่พบรายการสินค้าและราคา ยอดเงินจึงเป็น ฿0.00 เพื่อป้องกันสต็อกผิดพลาด'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" /> เลือกรูปใบเสร็จใหม่
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewItem}
                      className="px-2.5 py-1.5 bg-white border border-rose-300 text-rose-700 rounded-xl text-xs font-semibold hover:bg-rose-50 cursor-pointer"
                    >
                      + เพิ่มรายการเอง
                    </button>
                  </div>
                </div>
              )}

              {/* GENERAL SCAN ERROR BANNER */}
              {!isScanning && scanError && !isNotReceipt && !apiKeyMissing && (
                <div className="p-4 bg-[#fef3c7]/60 border border-[#fde68a] rounded-2xl space-y-2 text-xs text-[#92400e]">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-[#92400e] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-[#78350f] text-sm">
                        AI แจ้งข้อผิดพลาดในการสแกน
                      </div>
                      <p className="text-[#92400e] leading-relaxed font-mono text-xs">
                        {scanError}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#fde68a] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => runAiScan()}
                      className="px-3 py-1 bg-[#78350f] hover:bg-[#92400e] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> ลองสแกนใหม่อีกครั้ง
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewItem}
                      className="px-2.5 py-1 bg-white border border-[#fde68a] text-[#78350f] rounded-lg text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                    >
                      + เพิ่มรายการเอง
                    </button>
                  </div>
                </div>
              )}

              {/* SUCCESS BANNER */}
              {!isScanning && !isNotReceipt && !apiKeyMissing && verifiedItems.length > 0 && (
                <div className="p-3 bg-[#f5efe6] border border-[#e8ded0] rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[#78350f] text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900 text-xs">
                        AI ตรวจสอบและดึงรายการสำเร็จ (<span className="font-mono tabular-nums">{verifiedItems.length}</span> รายการ)
                      </div>
                      <div className="text-xs text-stone-600">
                        รีเช็คจำนวนและราคาจริง สามารถแก้ไขตัวเลขได้ก่อนกดรับเข้าสต็อก
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#78350f] bg-white px-2.5 py-1 rounded-lg border border-[#e8ded0] shadow-2xs font-mono tabular-nums">
                    ความมั่นใจ ~{confidence}%
                  </span>
                </div>
              )}

              {/* Header Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    สถานที่ซื้อจริง (จากใบเสร็จ):
                  </label>
                  <input
                    type="text"
                    value={actualStore}
                    onChange={(e) => setActualStore(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400"
                    placeholder="เช่น แม็คโคร สาขาบางชัน..."
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    วันที่บนใบเสร็จ:
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 font-mono tabular-nums focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              {/* Items Verification Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-xs">
                    รายการที่ตรวจสอบพบ (<span className="font-mono tabular-nums font-bold">{verifiedItems.length}</span> รายการ)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="text-xs text-[#78350f] hover:text-[#92400e] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> เพิ่มรายการในบิล
                  </button>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-stone-100 text-stone-800 font-semibold border-b border-stone-200 uppercase text-xs">
                        <th className="py-2.5 px-3">จับคู่เข้าวัตถุดิบคลัง</th>
                        <th className="py-2.5 px-2 text-center w-20">จำนวน</th>
                        <th className="py-2.5 px-1 text-center w-14">หน่วย</th>
                        <th className="py-2.5 px-2 text-right w-24">ราคา/หน่วย</th>
                        <th className="py-2.5 px-3 text-right w-24">รวม (฿)</th>
                        <th className="py-2.5 px-1 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {verifiedItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-stone-400 font-medium">
                            {isScanning
                              ? 'กำลังสแกนและตรวจสอบข้อมูลจากรูปถ่าย...'
                              : isNotReceipt
                              ? 'ไม่พบรายการสินค้าจากภาพนี้ (ไม่ใช่ใบเสร็จ) กดปุ่ม "เลือกรูปใบเสร็จใหม่" หรือ "+ เพิ่มรายการเอง"'
                              : 'ยังไม่มีรายการสินค้า กดปุ่ม "+ เพิ่มรายการในบิล" เพื่อเริ่มต้น'}
                          </td>
                        </tr>
                      ) : (
                        verifiedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-stone-50">
                            {/* Stock Ingredient dropdown mapping */}
                            <td className="py-2 px-3">
                              <Dropdown
                                options={[
                                  { value: '', label: `-- ไม่จับคู่ (${item.name}) --` },
                                  ...ingredients.map((ing) => ({
                                    value: ing.id,
                                    label: `${ing.name} (${ing.unit})`,
                                    badge: `${ing.quantity} ${ing.unit}`,
                                  })),
                                ]}
                                value={item.ingredient_id ?? ''}
                                onChange={(val) => handleSelectIngredient(idx, String(val))}
                                size="sm"
                                className="w-full"
                                buttonClassName="bg-white border-stone-200 text-xs font-semibold text-stone-900 py-1.5 px-2 rounded-lg"
                              />
                            </td>

                            {/* Qty */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full p-1.5 text-center font-bold text-stone-900 bg-white border border-stone-200 rounded-lg text-xs font-mono tabular-nums focus:outline-none focus:border-stone-400"
                              />
                            </td>

                            {/* Unit */}
                            <td className="py-2 px-1 text-center text-stone-600 font-medium text-xs">
                              {item.unit}
                            </td>

                            {/* Cost per unit */}
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.cost_per_unit}
                                onChange={(e) =>
                                  handleUpdateItem(idx, 'cost_per_unit', parseFloat(e.target.value) || 0)
                                }
                                className="w-full p-1.5 text-right font-medium text-stone-900 bg-white border border-stone-200 rounded-lg text-xs font-mono tabular-nums focus:outline-none focus:border-stone-400"
                              />
                            </td>

                            {/* Total */}
                            <td className="py-2 px-3 text-right font-bold text-stone-900 font-mono tabular-nums">
                              ฿{item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Delete */}
                            <td className="py-2 px-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                                title="ลบแถว"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Summary & Approve Action */}
            <div className="pt-4 border-t border-stone-200 space-y-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">ยอดรวมตามใบเสร็จจริง</span>
                  <span className={`text-lg font-black font-mono tabular-nums ${isNotReceipt ? 'text-stone-400' : 'text-[#78350f]'}`}>
                    ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right text-xs text-stone-500">
                  <span>พร้อมนำเข้าคลัง: </span>
                  <strong className="text-stone-900 font-mono tabular-nums">{verifiedItems.length} รายการ</strong>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100"
                >
                  ปิดหน้าต่าง
                </Button>

                {po.status !== 'completed' ? (
                  <button
                    type="button"
                    onClick={handleConfirmStockIn}
                    disabled={isSubmitting || verifiedItems.length === 0}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'กำลังนำเข้าสต็อก...' : 'ยืนยันและนำเข้าสต็อกจริง'}</span>
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-stone-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>รายการนี้รับเข้าสต็อกเรียบร้อยแล้ว</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
