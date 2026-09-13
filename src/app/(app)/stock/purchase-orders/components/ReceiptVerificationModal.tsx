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
  Eye,
  Store,
  Calendar,
  Check,
  RotateCw,
  RefreshCw,
  Key,
  Camera,
  Upload,
  ChevronLeft,
  ChevronRight,
  Calculator,
  ArrowRight,
  Layers,
  FileText,
  Info,
} from 'lucide-react';
import { PurchaseOrder, VerifiedReceiptItem } from '../types';
import { Ingredient } from '@/types';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

export type { VerifiedReceiptItem };

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
    receiptImages?: string[]
  ) => Promise<void>;
  isManagerOrAdmin: boolean;
}

// Common units used in cafe operations
const COMMON_UNITS = [
  { value: 'มล.', label: 'มล. (มิลลิลิตร)' },
  { value: 'กรัม', label: 'กรัม (g)' },
  { value: 'กก.', label: 'กก. (กิโลกรัม)' },
  { value: 'ลิตร', label: 'ลิตร (L)' },
  { value: 'ชิ้น', label: 'ชิ้น' },
  { value: 'ขวด', label: 'ขวด' },
  { value: 'กระป๋อง', label: 'กระป๋อง' },
  { value: 'กล่อง', label: 'กล่อง' },
  { value: 'ลัง', label: 'ลัง' },
  { value: 'ถุง', label: 'ถุง' },
  { value: 'แพ็ค', label: 'แพ็ค' },
  { value: 'ซอง', label: 'ซอง' },
  { value: 'ใบ', label: 'ใบ' },
];

export const ReceiptVerificationModal: React.FC<ReceiptVerificationModalProps> = ({
  isOpen,
  onClose,
  po,
  ingredients,
  onApproveAndStockIn,
  isManagerOrAdmin,
}) => {
  // Multiple images state
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [verifiedImagesSet, setVerifiedImagesSet] = useState<Set<number>>(new Set());

  // Scanning & OCR state per image
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStage, setScanStage] = useState<string>('กำลังเตรียมข้อมูล...');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isNotReceipt, setIsNotReceipt] = useState<boolean>(false);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  const [inputApiKey, setInputApiKey] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(95);

  // Data & Table state
  const [verifiedItems, setVerifiedItems] = useState<VerifiedReceiptItem[]>([]);
  const [actualStore, setActualStore] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Unit conversion helper modal or expanded row
  const [expandedUnitConversionIdx, setExpandedUnitConversionIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API key from localStorage if user previously saved it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('smartstock_gemini_api_key') || '';
      setInputApiKey(savedKey);
    }
  }, []);

  // Initialize images list and verification status when opening or changing PO
  useEffect(() => {
    if (isOpen && po) {
      const imgList: string[] = [];
      if (Array.isArray(po.receipt_images) && po.receipt_images.length > 0) {
        imgList.push(...po.receipt_images);
      } else if (po.receipt_image) {
        imgList.push(po.receipt_image);
      }

      setImages(imgList);
      setCurrentImageIndex(0);
      setVerifiedImagesSet(new Set());
      setActualStore(po.actual_store_name || po.store_name || 'ตลาด / ร้านทั่วไป');
      setReceiptDate(po.date || new Date().toISOString().split('T')[0]);
      setRotation(0);

      if (imgList.length > 0) {
        runAiScanForImage(imgList[0], 0, undefined, true);
      } else {
        setVerifiedItems([]);
        setIsScanning(false);
      }
    }
  }, [isOpen, po?.id]);

  // AI OCR Scan for a specific image index
  const runAiScanForImage = useCallback(
    async (
      imageTarget: string,
      imgIndex: number,
      apiKeyToUse?: string,
      isInitial: boolean = false
    ) => {
      if (!imageTarget) {
        setIsScanning(false);
        return;
      }

      setIsScanning(true);
      setScanProgress(15);
      setScanStage('กำลังวิเคราะห์โครงสร้างภาพใบเสร็จ...');
      setScanError(null);
      setIsNotReceipt(false);
      setApiKeyMissing(false);

      // Real-time progress timer to display fluid percentage while scanning
      const progressTimer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 92) return prev;
          const next = prev + Math.floor(Math.random() * 9 + 4);
          if (next >= 40 && next < 70) {
            setScanStage('กำลังถอดข้อความภาษาไทยและตัวเลขราคา...');
          } else if (next >= 70) {
            setScanStage('กำลังจับคู่รายการเข้าวัตถุดิบคลังสินค้า...');
          }
          return Math.min(next, 92);
        });
      }, 450);

      // Check if it's the realistic demo SVG receipt
      const isSampleDemoSvg = imageTarget.startsWith('data:image/svg+xml');
      if (isSampleDemoSvg) {
        setTimeout(() => {
          clearInterval(progressTimer);
          setScanProgress(100);
          setScanStage('ตรวจสอบเสร็จสมบูรณ์ 100%');
          const sampleItems: VerifiedReceiptItem[] = [
            {
              ingredient_id: ingredients.find((i) => i.name.includes('House'))?.id,
              name: 'เมล็ดกาแฟ House Blend คั่วกลาง',
              purchase_quantity: 10,
              purchase_unit: 'กก.',
              pack_size: 1000, // 1 กก. = 1,000 กรัม หากสต็อกเป็นกรัม
              quantity: 10,
              unit: ingredients.find((i) => i.name.includes('House'))?.unit || 'กก.',
              cost_per_unit: 380,
              inventory_cost_per_unit: 380,
              total_price: 3800,
              source_image_index: imgIndex,
            },
            {
              ingredient_id: ingredients.find((i) => i.name.includes('Single'))?.id,
              name: 'เมล็ดกาแฟ Single Origin Ethiopia (คั่วอ่อน)',
              purchase_quantity: 3,
              purchase_unit: 'กก.',
              pack_size: 1,
              quantity: 3,
              unit: ingredients.find((i) => i.name.includes('Single'))?.unit || 'กก.',
              cost_per_unit: 650,
              inventory_cost_per_unit: 650,
              total_price: 1950,
              source_image_index: imgIndex,
            },
            {
              ingredient_id: ingredients.find((i) => i.name.includes('มัทฉะ'))?.id,
              name: 'ผงมัทฉะเกรดพิธีการ Uji Matcha 100g',
              purchase_quantity: 5,
              purchase_unit: 'ถุง',
              pack_size: 100, // 1 ถุง = 100 กรัม
              quantity: 5,
              unit: ingredients.find((i) => i.name.includes('มัทฉะ'))?.unit || 'ถุง',
              cost_per_unit: 280,
              inventory_cost_per_unit: 280,
              total_price: 1400,
              source_image_index: imgIndex,
            },
          ];

          // Auto-adjust units for ingredients that differ (e.g. stock is กรัม but receipt is กก.)
          const refinedItems = sampleItems.map((item) => {
            if (item.ingredient_id) {
              const ing = ingredients.find((i) => i.id === item.ingredient_id);
              if (ing && ing.unit !== item.purchase_unit) {
                // If stock is กรัม and bought in กก.
                if (ing.unit === 'กรัม' && item.purchase_unit === 'กก.') {
                  item.pack_size = 1000;
                  item.unit = 'กรัม';
                  item.quantity = item.purchase_quantity * 1000;
                  item.inventory_cost_per_unit = item.cost_per_unit / 1000;
                } else if (ing.unit === 'มล.' && (item.purchase_unit === 'ลิตร' || item.purchase_unit === 'ขวด')) {
                  item.pack_size = 1000;
                  item.unit = 'มล.';
                  item.quantity = item.purchase_quantity * 1000;
                  item.inventory_cost_per_unit = item.cost_per_unit / 1000;
                }
              }
            }
            return item;
          });

          if (isInitial) {
            setVerifiedItems(refinedItems);
          } else {
            // Append or replace items from this image index
            setVerifiedItems((prev) => {
              const filtered = prev.filter((it) => it.source_image_index !== imgIndex);
              return [...filtered, ...refinedItems];
            });
          }

          setActualStore('โรงคั่วกาแฟ Aroma Specialty');
          setReceiptDate(po?.date || new Date().toISOString().split('T')[0]);
          setConfidence(98);
          setIsScanning(false);
          setVerifiedImagesSet((prev) => new Set(prev).add(imgIndex));
        }, 600);
        return;
      }

      // Real Image OCR via /api/ai/scan-receipt
      try {
        const res = await fetch('/api/ai/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageTarget,
            apiKey: apiKeyToUse || inputApiKey || undefined,
          }),
        });

        clearInterval(progressTimer);
        const data = await res.json();

        if (res.status === 400 && data.error === 'NO_API_KEY') {
          setApiKeyMissing(true);
          setScanError('ยังไม่ได้ตั้งค่า GEMINI_API_KEY สำหรับสแกนข้อความ');
          setIsScanning(false);
          return;
        }

        if (!res.ok || data.error) {
          setScanError(data.message || 'เกิดข้อผิดพลาดในการติดต่อระบบ AI');
          setIsScanning(false);
          return;
        }

        if (data.is_receipt === false) {
          setIsNotReceipt(true);
          setScanError(
            data.error_message ||
              'ภาพนี้ไม่ใช่ใบเสร็จหรือข้อความไม่ชัดเจน กรุณาถ่ายใหม่หรือระบุรายการเอง'
          );
          setIsScanning(false);
          return;
        }

        setScanProgress(100);
        setScanStage('ตรวจสอบเสร็จสมบูรณ์ 100%');

        if (data.store_name && !actualStore) setActualStore(data.store_name);
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

          const purchaseQty = parseFloat(item.quantity) || 1;
          const purchaseUnit = item.unit || 'ชิ้น';
          const cost = parseFloat(item.cost_per_unit) || 0;
          const total = parseFloat(item.total_price) || Math.round(purchaseQty * cost * 100) / 100;

          // Target inventory unit
          let targetUnit = matchedIng?.unit || purchaseUnit;
          let packSize = 1;

          // Smart auto-detection for units
          if (targetUnit === 'มล.' && (purchaseUnit === 'ขวด' || purchaseUnit === 'ลิตร')) {
            packSize = purchaseUnit === 'ลิตร' ? 1000 : 1000;
          } else if (targetUnit === 'กรัม' && purchaseUnit === 'กก.') {
            packSize = 1000;
          } else if (targetUnit === 'กระป๋อง' && purchaseUnit === 'ลัง') {
            packSize = 24;
          }

          const finalQuantity = Math.round(purchaseQty * packSize * 100) / 100;
          const invCost = packSize > 0 ? cost / packSize : cost;

          return {
            ingredient_id: matchedIng ? matchedIng.id : undefined,
            name: itemName,
            purchase_quantity: purchaseQty,
            purchase_unit: purchaseUnit,
            pack_size: packSize,
            quantity: finalQuantity,
            unit: targetUnit,
            cost_per_unit: cost,
            inventory_cost_per_unit: invCost,
            total_price: total,
            source_image_index: imgIndex,
          };
        });

        setVerifiedItems((prev) => {
          const filtered = prev.filter((it) => it.source_image_index !== imgIndex);
          return [...filtered, ...mapped];
        });

        setIsScanning(false);
        setVerifiedImagesSet((prev) => new Set(prev).add(imgIndex));
      } catch (err: any) {
        console.error('Scan error:', err);
        setScanError(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        setIsScanning(false);
      }
    },
    [ingredients, inputApiKey, actualStore, po?.date]
  );

  // Switch to another image in the list
  const handleSelectImageIndex = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= images.length) return;
    setCurrentImageIndex(newIdx);
    setRotation(0);
    setScanError(null);
    setIsNotReceipt(false);

    // If this image hasn't been verified/scanned yet, trigger scan
    if (!verifiedImagesSet.has(newIdx)) {
      runAiScanForImage(images[newIdx], newIdx);
    }
  };

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

          // Add to images list or replace current
          setImages((prev) => {
            const next = [...prev];
            if (next.length === 0) {
              next.push(compressed);
            } else {
              next[currentImageIndex] = compressed;
            }
            return next;
          });
          setRotation(0);
          runAiScanForImage(compressed, currentImageIndex);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewImage = () => {
    fileInputRef.current?.click();
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

  // Re-calculate item conversions when unit or pack size changes
  const recalculateItem = (item: VerifiedReceiptItem): VerifiedReceiptItem => {
    const pQty = parseFloat(String(item.purchase_quantity)) || 0;
    const pack = parseFloat(String(item.pack_size)) || 1;
    const pCost = parseFloat(String(item.cost_per_unit)) || 0;

    const finalQty = Math.round(pQty * pack * 100) / 100;
    const invCost = pack > 0 ? pCost / pack : pCost;
    const total = Math.round(pQty * pCost * 100) / 100;

    return {
      ...item,
      purchase_quantity: pQty,
      pack_size: pack,
      quantity: finalQty,
      cost_per_unit: pCost,
      inventory_cost_per_unit: invCost,
      total_price: total,
    };
  };

  const handleUpdateItem = (index: number, field: keyof VerifiedReceiptItem, val: any) => {
    setVerifiedItems((prev) => {
      const next = [...prev];
      const updated = { ...next[index], [field]: val };
      next[index] = recalculateItem(updated);
      return next;
    });
  };

  // When mapping to an ingredient, synchronize unit & recommend pack size
  const handleSelectIngredient = (index: number, ingIdStr: string) => {
    const ingId = Number(ingIdStr);
    const ing = ingredients.find((i) => i.id === ingId);

    setVerifiedItems((prev) => {
      const next = [...prev];
      const current = { ...next[index] };

      if (!ing) {
        current.ingredient_id = undefined;
        next[index] = recalculateItem(current);
        return next;
      }

      current.ingredient_id = ing.id;
      current.name = ing.name;
      current.unit = ing.unit; // Target stock unit

      // Auto check if conversion needed
      if (ing.unit === 'มล.' && (current.purchase_unit === 'ขวด' || current.purchase_unit === 'ลิตร')) {
        current.pack_size = current.purchase_unit === 'ลิตร' ? 1000 : 1000;
      } else if (ing.unit === 'กรัม' && current.purchase_unit === 'กก.') {
        current.pack_size = 1000;
      } else if (ing.unit === current.purchase_unit) {
        current.pack_size = 1;
      }

      if (!current.cost_per_unit || current.cost_per_unit <= 0) {
        current.cost_per_unit = ing.cost_per_unit || 0;
      }

      next[index] = recalculateItem(current);
      return next;
    });
  };

  const handleAddNewItem = () => {
    const firstIng = ingredients[0];
    const newItem: VerifiedReceiptItem = {
      ingredient_id: firstIng ? firstIng.id : undefined,
      name: firstIng ? firstIng.name : 'สินค้าเพิ่มเติม',
      purchase_quantity: 1,
      purchase_unit: firstIng ? firstIng.unit : 'ชิ้น',
      pack_size: 1,
      quantity: 1,
      unit: firstIng ? firstIng.unit : 'ชิ้น',
      cost_per_unit: 0,
      inventory_cost_per_unit: 0,
      total_price: 0,
      source_image_index: currentImageIndex,
    };
    setVerifiedItems((prev) => [...prev, newItem]);
    setIsNotReceipt(false);
    setScanError(null);
  };

  const handleRemoveItem = (index: number) => {
    setVerifiedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotal = verifiedItems.reduce((sum, it) => sum + (it.total_price || 0), 0);

  // Verification completion percentage
  const totalImagesCount = Math.max(1, images.length);
  const verifiedCount = verifiedImagesSet.size;
  const verifiedPercentage = Math.round((verifiedCount / totalImagesCount) * 100);

  const handleMarkCurrentAsChecked = () => {
    setVerifiedImagesSet((prev) => new Set(prev).add(currentImageIndex));
    // Move to next image if available
    if (currentImageIndex + 1 < images.length) {
      handleSelectImageIndex(currentImageIndex + 1);
    }
  };

  const handleConfirmStockIn = async () => {
    if (verifiedItems.length === 0) {
      alert('กรุณามีรายการสินค้าอย่างน้อย 1 รายการก่อนนำเข้าสต็อก');
      return;
    }
    setIsSubmitting(true);
    try {
      await onApproveAndStockIn(
        po!.id,
        verifiedItems,
        actualStore,
        grandTotal,
        images
      );
      onClose();
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการบันทึกสต็อก');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !po) return null;

  const currentImage = images[currentImageIndex] || '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="bg-white rounded-2xl max-w-7xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh] animate-scale-in">
        {/* Header Bar */}
        <div className="px-6 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center">
              <FileText className="w-4 h-4 text-stone-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base">
                  ตรวจสอบใบเสร็จ &amp; ปรับหน่วยรับเข้าสต็อก
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

          <div className="flex items-center gap-4">
            {/* Multi-Receipt Progress Pill */}
            {images.length > 1 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs">
                <div className="flex items-center gap-1 font-semibold text-stone-700">
                  <Layers className="w-3.5 h-3.5 text-stone-600" />
                  <span>ตรวจแล้ว {verifiedCount}/{totalImagesCount} ใบ</span>
                </div>
                <div className="w-16 h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-stone-800 transition-all duration-300 rounded-full"
                    style={{ width: `${verifiedPercentage}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-stone-900 tabular-nums">
                  {verifiedPercentage}%
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar on mobile */}
        {images.length > 1 && (
          <div className="sm:hidden px-4 py-2 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium">
              ตรวจใบเสร็จ {verifiedCount} จาก {totalImagesCount} ใบ ({verifiedPercentage}%)
            </span>
            <span className="font-mono font-bold text-stone-800">
              เหลือ {totalImagesCount - verifiedCount} ใบ
            </span>
          </div>
        )}

        {/* Modal Body: Split Screen */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 text-xs text-stone-700">
          {/* Left Column: Image Viewer & Multi-image Stepper (5 cols) */}
          <div className="lg:col-span-5 bg-stone-950 p-4 flex flex-col justify-between overflow-y-auto border-b lg:border-b-0 lg:border-r border-stone-800 relative select-none">
            {/* Image Header Controls */}
            <div className="flex items-center justify-between text-stone-300 pb-2 mb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-stone-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-stone-400" />
                  ใบเสร็จที่ {currentImageIndex + 1} / {totalImagesCount}
                </span>
                {verifiedImagesSet.has(currentImageIndex) ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-semibold">
                    ตรวจแล้ว
                  </span>
                ) : isScanning ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-semibold flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    กำลังตรวจสอบ {scanProgress}%
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700 text-[10px] font-semibold">
                    รอการตรวจสอบ
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  title="เปลี่ยนรูปภาพหรือถ่ายใหม่"
                >
                  <Camera className="w-3.5 h-3.5 text-stone-400" />
                  <span>เปลี่ยน</span>
                </button>
                <button
                  type="button"
                  onClick={() => runAiScanForImage(currentImage, currentImageIndex)}
                  disabled={isScanning}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                  title="สแกนซ้ำ"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-stone-100' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                  title="หมุนภาพ 90 องศา"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Image Display */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/50 relative min-h-[260px] p-2 transition-all ${
                isDragging ? 'ring-2 ring-stone-400 bg-stone-900' : ''
              }`}
            >
              {currentImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={currentImage}
                    alt={`Receipt ${currentImageIndex + 1}`}
                    style={{ transform: `rotate(${rotation}deg)` }}
                    className="max-h-[420px] w-auto max-w-full object-contain rounded transition-transform duration-200 shadow-md"
                  />

                  {/* Scanning banner with real-time percentage progress */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 z-10 animate-fade-in">
                      <div className="relative mb-3 flex items-center justify-center">
                        <RefreshCw className="w-9 h-9 animate-spin text-stone-300" />
                        <span className="absolute font-mono font-bold text-[10px] text-white tabular-nums">
                          {scanProgress}%
                        </span>
                      </div>

                      <div className="font-semibold text-sm text-stone-100 flex items-center gap-1.5">
                        <span>กำลังตรวจสอบใบเสร็จ...</span>
                        <span className="font-mono font-bold text-amber-300 tabular-nums">
                          {scanProgress}%
                        </span>
                      </div>

                      {/* Percentage Progress Bar */}
                      <div className="w-56 h-2 bg-stone-800 rounded-full overflow-hidden my-2.5 border border-stone-700">
                        <div
                          className="h-full bg-gradient-to-r from-stone-400 via-amber-300 to-emerald-400 transition-all duration-300 rounded-full"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>

                      <div className="text-xs text-stone-400 text-center max-w-xs transition-all">
                        {scanStage}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1">
                        (ใบที่ {currentImageIndex + 1} จาก {totalImagesCount} ใบ)
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-stone-500 p-6 space-y-3">
                  <AlertCircle className="w-8 h-8 mx-auto opacity-40 text-stone-400" />
                  <p className="text-xs">ยังไม่มีภาพถ่ายใบเสร็จในลิสต์นี้</p>
                  <button
                    type="button"
                    onClick={handleAddNewImage}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" /> อัปโหลดรูปใบเสร็จ
                  </button>
                </div>
              )}
            </div>

            {/* Multiple Images Selector & Stepper */}
            {images.length > 1 && (
              <div className="pt-3 space-y-2 border-t border-stone-800 mt-3">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>เลือกใบเสร็จที่ต้องการตรวจ:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentImageIndex === 0}
                      onClick={() => handleSelectImageIndex(currentImageIndex - 1)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 cursor-pointer text-stone-200"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-stone-300 text-[11px] px-1">
                      {currentImageIndex + 1}/{images.length}
                    </span>
                    <button
                      type="button"
                      disabled={currentImageIndex === images.length - 1}
                      onClick={() => handleSelectImageIndex(currentImageIndex + 1)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 cursor-pointer text-stone-200"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                        currentImageIndex === idx
                          ? 'border-stone-300 ring-2 ring-stone-500/50'
                          : 'border-stone-700 hover:border-stone-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover" />
                      {verifiedImagesSet.has(idx) && (
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] shadow-sm">
                          ✓
                        </div>
                      )}
                      <span className="absolute bottom-0 left-0 right-0 bg-stone-900/80 text-white text-[9px] text-center font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddNewImage}
                    className="w-14 h-14 rounded-lg border-2 border-dashed border-stone-700 hover:border-stone-400 bg-stone-900/60 flex flex-col items-center justify-center shrink-0 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                    title="เพิ่มรูปภาพใบเสร็จอีกใบ"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[9px]">เพิ่ม</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Extraction, Unit Conversion & Verification Table (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* API Key Missing Card */}
              {apiKeyMissing && (
                <div className="p-3.5 bg-stone-100 border border-stone-300 rounded-xl space-y-2 text-xs text-stone-800">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <Key className="w-4 h-4 text-stone-700" />
                    กำหนดค่า Gemini API Key เพื่อเปิดใช้งานระบบสแกนอัตโนมัติ
                  </div>
                  <p className="text-stone-600 text-xs">
                    ไม่พบ API Key ในระบบ คุณสามารถนำคีย์มาวางชั่วคราวเพื่อเริ่มตรวจใบเสร็จได้ทันที:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="วาง Gemini API Key ที่นี่ (AIza...)"
                      value={inputApiKey}
                      onChange={(e) => setInputApiKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!inputApiKey.trim()) return;
                        localStorage.setItem('smartstock_gemini_api_key', inputApiKey.trim());
                        runAiScanForImage(currentImage, currentImageIndex, inputApiKey.trim());
                      }}
                      className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg text-xs cursor-pointer active:scale-95"
                    >
                      บันทึก &amp; สแกน
                    </button>
                  </div>
                </div>
              )}

              {/* NON-RECEIPT DETECTED ALERT BANNER */}
              {isNotReceipt && (
                <div className="p-3.5 bg-stone-50 border border-stone-300 rounded-xl space-y-2 text-xs text-stone-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900">
                        ไม่พบข้อมูลรายการสินค้าในภาพที่ {currentImageIndex + 1}
                      </span>
                      <p className="text-stone-600 mt-0.5">
                        {scanError || 'ภาพถ่ายอาจไม่ชัดหรือไม่ใช่ใบเสร็จ คุณสามารถเลือกรูปใหม่ หรือกรอกรายการเองด้วยตนเอง'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      เลือกรูปใหม่
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewItem}
                      className="px-3 py-1.5 bg-white border border-stone-300 text-stone-800 rounded-lg text-xs font-semibold hover:bg-stone-100 cursor-pointer"
                    >
                      + เพิ่มรายการเอง
                    </button>
                  </div>
                </div>
              )}

              {/* Header Store & Date Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-stone-900 text-xs">
                      รายการสินค้าที่ตรวจพบ ({verifiedItems.length} รายการ)
                    </h4>
                    {images.length > 1 && (
                      <span className="text-[11px] text-stone-500 font-mono">
                        (ใบเสร็จปัจจุบัน: #{currentImageIndex + 1})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="text-xs text-stone-800 hover:text-stone-950 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> เพิ่มรายการสินค้า
                  </button>
                </div>

                {/* Table Container */}
                <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-stone-100 text-stone-800 font-semibold border-b border-stone-200 uppercase text-[11px]">
                        <th className="py-2.5 px-3">จับคู่วัตถุดิบในคลัง</th>
                        <th className="py-2.5 px-2 text-center w-20">จำนวนซื้อ</th>
                        <th className="py-2.5 px-2 text-center w-24">หน่วยซื้อ</th>
                        <th className="py-2.5 px-2 text-center w-36">แปลงเข้าสต็อก</th>
                        <th className="py-2.5 px-2 text-right w-24">ราคา/หน่วย</th>
                        <th className="py-2.5 px-3 text-right w-24">รวม (฿)</th>
                        <th className="py-2.5 px-1 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {verifiedItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-stone-400 font-medium">
                            {isScanning
                              ? 'กำลังตรวจสอบข้อมูลจากใบเสร็จ...'
                              : 'ยังไม่มีรายการสินค้า กดปุ่ม "+ เพิ่มรายการสินค้า" เพื่อเริ่มต้น'}
                          </td>
                        </tr>
                      ) : (
                        verifiedItems.map((item, idx) => {
                          const isUnitMismatch =
                            item.ingredient_id &&
                            item.unit &&
                            item.purchase_unit &&
                            item.unit !== item.purchase_unit;

                          return (
                            <React.Fragment key={idx}>
                              <tr className="hover:bg-stone-50 transition-colors">
                                {/* Stock Ingredient Dropdown */}
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

                                {/* Purchase Qty */}
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={item.purchase_quantity}
                                    onChange={(e) =>
                                      handleUpdateItem(
                                        idx,
                                        'purchase_quantity',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full p-1.5 text-center font-bold text-stone-900 bg-white border border-stone-200 rounded-lg text-xs font-mono tabular-nums focus:outline-none focus:border-stone-400"
                                  />
                                </td>

                                {/* Purchase Unit Dropdown */}
                                <td className="py-2 px-2 text-center">
                                  <Dropdown
                                    options={COMMON_UNITS}
                                    value={item.purchase_unit}
                                    onChange={(val) => handleUpdateItem(idx, 'purchase_unit', String(val))}
                                    size="sm"
                                    className="w-full"
                                    buttonClassName="bg-white border-stone-200 text-xs font-medium text-stone-800 py-1 px-1.5 rounded-lg text-center"
                                  />
                                </td>

                                {/* Stock Conversion Multiplier & Target Unit */}
                                <td className="py-2 px-2">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedUnitConversionIdx(
                                          expandedUnitConversionIdx === idx ? null : idx
                                        )
                                      }
                                      className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                                        isUnitMismatch || item.pack_size !== 1
                                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                      }`}
                                      title="คลิกเพื่อตั้งค่าอัตราส่วนแปลงหน่วย เช่น 1 ขวด = 1000 มล."
                                    >
                                      <Calculator className="w-3 h-3 text-stone-500" />
                                      <span className="font-mono tabular-nums font-bold">
                                        ={item.quantity}
                                      </span>
                                      <span className="text-[11px] font-medium">{item.unit}</span>
                                    </button>
                                  </div>
                                </td>

                                {/* Cost per unit (bought) */}
                                <td className="py-2 px-2 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={item.cost_per_unit}
                                    onChange={(e) =>
                                      handleUpdateItem(
                                        idx,
                                        'cost_per_unit',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full p-1.5 text-right font-medium text-stone-900 bg-white border border-stone-200 rounded-lg text-xs font-mono tabular-nums focus:outline-none focus:border-stone-400"
                                  />
                                </td>

                                {/* Total Price */}
                                <td className="py-2 px-3 text-right font-bold text-stone-900 font-mono tabular-nums">
                                  ฿{item.total_price.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>

                                {/* Delete Item */}
                                <td className="py-2 px-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                                    title="ลบรายการนี้"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>

                              {/* Inline Unit Conversion Adjustment Drawer */}
                              {expandedUnitConversionIdx === idx && (
                                <tr className="bg-stone-50/80 border-y border-stone-200">
                                  <td colSpan={7} className="p-3">
                                    <div className="max-w-2xl bg-white p-3 rounded-xl border border-stone-200 shadow-2xs space-y-2">
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 font-bold text-stone-900">
                                          <Calculator className="w-3.5 h-3.5 text-stone-700" />
                                          <span>
                                            ตั้งค่าการแปลงหน่วยสำหรับ: {item.name}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedUnitConversionIdx(null)}
                                          className="text-stone-400 hover:text-stone-700 font-bold px-1"
                                        >
                                          ✕
                                        </button>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-700">
                                        <span>ซื้อมา 1 {item.purchase_unit} บรรจุขนาด</span>
                                        <input
                                          type="number"
                                          min="0.001"
                                          step="any"
                                          value={item.pack_size}
                                          onChange={(e) =>
                                            handleUpdateItem(
                                              idx,
                                              'pack_size',
                                              parseFloat(e.target.value) || 1
                                            )
                                          }
                                          className="w-24 p-1.5 text-center font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono tabular-nums focus:bg-white focus:outline-none"
                                        />
                                        <div className="w-32">
                                          <Dropdown
                                            options={COMMON_UNITS}
                                            value={item.unit}
                                            onChange={(val) => handleUpdateItem(idx, 'unit', String(val))}
                                            size="sm"
                                            className="w-full"
                                            buttonClassName="bg-stone-50 border-stone-300 text-xs py-1 px-2 rounded-lg"
                                          />
                                        </div>

                                        <div className="text-stone-500 font-mono text-[11px] pl-2 border-l border-stone-200">
                                          → รวมเข้าสต็อกจริง:{' '}
                                          <strong className="text-stone-900 font-bold font-mono">
                                            {item.quantity} {item.unit}
                                          </strong>{' '}
                                          (เฉลี่ย ฿
                                          {(item.inventory_cost_per_unit ?? 0).toFixed(4)}/{item.unit})
                                        </div>
                                      </div>

                                      {/* Preset Shortcuts */}
                                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-stone-500">
                                        <span>ขนาดพบบ่อย:</span>
                                        {[
                                          { label: '1 ลัง = 24 กระป๋อง', pack: 24, unit: 'กระป๋อง' },
                                          { label: '1 ขวด = 1000 มล.', pack: 1000, unit: 'มล.' },
                                          { label: '1 แกลลอน = 2000 มล.', pack: 2000, unit: 'มล.' },
                                          { label: '1 กก. = 1000 กรัม', pack: 1000, unit: 'กรัม' },
                                          { label: '1 ลัง = 12 กล่อง', pack: 12, unit: 'กล่อง' },
                                        ].map((preset, pIdx) => (
                                          <button
                                            key={pIdx}
                                            type="button"
                                            onClick={() => {
                                              handleUpdateItem(idx, 'pack_size', preset.pack);
                                              handleUpdateItem(idx, 'unit', preset.unit);
                                            }}
                                            className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors cursor-pointer"
                                          >
                                            {preset.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Summary & Approve Action */}
            <div className="pt-4 border-t border-stone-200 space-y-3">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">ยอดรวมตามใบเสร็จ</span>
                  <span className="text-lg font-black font-mono tabular-nums text-stone-900">
                    ฿{grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="text-right text-xs text-stone-500 space-y-0.5">
                  <div>
                    พร้อมนำเข้าคลัง:{' '}
                    <strong className="text-stone-900 font-mono tabular-nums">
                      {verifiedItems.length} รายการ
                    </strong>
                  </div>
                  {images.length > 1 && (
                    <div>
                      ความคืบหน้าการตรวจ:{' '}
                      <strong className="text-stone-900 font-mono tabular-nums">
                        {verifiedCount}/{totalImagesCount} ใบ ({verifiedPercentage}%)
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  {images.length > 1 && currentImageIndex + 1 < images.length && (
                    <button
                      type="button"
                      onClick={handleMarkCurrentAsChecked}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>ตรวจใบนี้เสร็จแล้ว → ดูใบถัดไป</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
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
                      className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {isSubmitting ? 'กำลังนำเข้าสต็อก...' : 'ยืนยันและนำเข้าสต็อกจริง'}
                      </span>
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
    </div>
  );
};
