'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  Key,
  Check,
  ChevronRight,
} from 'lucide-react';
import { PurchaseOrder, VerifiedReceiptItem } from '../types';
import { Ingredient } from '@/types';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ReceiptImageViewer } from './ReceiptImageViewer';
import { ReceiptItemsTable } from './ReceiptItemsTable';

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
        const isEthiopiaReceipt = decodeURIComponent(imageTarget).includes('INV-ETHIOPIA') ||
                                 decodeURIComponent(imageTarget).includes('6 ชิ้น');

        setTimeout(() => {
          clearInterval(progressTimer);
          setScanProgress(100);
          setScanStage('ตรวจสอบเสร็จสมบูรณ์ 100%');

          const sampleItems: VerifiedReceiptItem[] = isEthiopiaReceipt
            ? [
                {
                  ingredient_id: ingredients.find((i) => i.name.includes('Single') || i.name.includes('Ethiopia'))?.id,
                  name: 'เมล็ดกาแฟ Single Origin Ethiopia (คั่วอ่อน)',
                  purchase_quantity: 6,
                  purchase_unit: 'ชิ้น',
                  pack_size: 500, // 1 ชิ้น (ถุง) = 500 กรัม = รวม 3,000 กรัม (3 กก.)
                  quantity: 6,
                  unit: ingredients.find((i) => i.name.includes('Single') || i.name.includes('Ethiopia'))?.unit || 'กก.',
                  cost_per_unit: 650,
                  inventory_cost_per_unit: 650,
                  total_price: 3900,
                  source_image_index: imgIndex,
                },
              ]
            : [
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

      <div className="bg-white rounded-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh] animate-scale-in">
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
          <ReceiptImageViewer
            currentImage={currentImage}
            currentImageIndex={currentImageIndex}
            totalImagesCount={totalImagesCount}
            images={images}
            rotation={rotation}
            isScanning={isScanning}
            scanProgress={scanProgress}
            scanStage={scanStage}
            isDragging={isDragging}
            verifiedImagesSet={verifiedImagesSet}
            onFileInputClick={() => fileInputRef.current?.click()}
            onRescan={() => runAiScanForImage(currentImage, currentImageIndex)}
            onRotate={() => setRotation((prev) => (prev + 90) % 360)}
            onSelectImageIndex={handleSelectImageIndex}
            onAddNewImage={handleAddNewImage}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          />

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
              <ReceiptItemsTable
                verifiedItems={verifiedItems}
                ingredients={ingredients}
                isScanning={isScanning}
                currentImageIndex={currentImageIndex}
                totalImagesCount={totalImagesCount}
                expandedUnitConversionIdx={expandedUnitConversionIdx}
                onSetExpandedUnitConversionIdx={setExpandedUnitConversionIdx}
                onAddNewItem={handleAddNewItem}
                onRemoveItem={handleRemoveItem}
                onUpdateItem={handleUpdateItem}
                onSelectIngredient={handleSelectIngredient}
              />
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
