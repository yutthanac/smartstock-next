'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Store,
  CheckCircle2,
  Clock,
  Package,
  Printer,
  Trash2,
  ShoppingBag,
  Camera,
  Sparkles,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';
import { Topbar } from '@/components/Topbar';
import { PurchaseOrder, PurchaseOrderItem } from './types';
import { CreatePOModal } from './components/CreatePOModal';
import { POPrintViewModal } from './components/POPrintViewModal';
import { UploadReceiptModal } from './components/UploadReceiptModal';
import { ReceiptVerificationModal, VerifiedReceiptItem } from './components/ReceiptVerificationModal';
import { Ingredient } from '@/types';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/Table';

// Sample realistic SVG receipt for instant demo
const SAMPLE_RECEIPT_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 660" width="420" height="660" style="background:#ffffff;font-family:monospace;">
  <rect width="420" height="660" fill="#fffdfa" stroke="#e2e8f0" stroke-width="2" rx="8"/>
  <text x="210" y="45" font-size="19" font-weight="900" text-anchor="middle" fill="#0f172a">AROMA SPECIALTY COFFEE</text>
  <text x="210" y="68" font-size="11" text-anchor="middle" fill="#64748b">สาขาตลาดไท คลองหนึ่ง โทร 02-999-8888</text>
  <text x="210" y="85" font-size="11" text-anchor="middle" fill="#64748b">เลขประจำตัวผู้เสียภาษี: 0105558999123</text>
  <line x1="20" y1="100" x2="400" y2="100" stroke="#cbd5e1" stroke-dasharray="4"/>
  <text x="20" y="125" font-size="12" fill="#334155">วันที่: 05/09/2026 10:45</text>
  <text x="400" y="125" font-size="12" text-anchor="end" fill="#334155">บิลเลขที่: #INV-009841</text>
  <line x1="20" y1="140" x2="400" y2="140" stroke="#cbd5e1" stroke-dasharray="4"/>
  
  <text x="20" y="172" font-size="13" font-weight="bold" fill="#0f172a">เมล็ดกาแฟ House Blend 10กก.</text>
  <text x="400" y="172" font-size="13" text-anchor="end" font-weight="bold" fill="#0f172a">3,800.00</text>
  <text x="30" y="190" font-size="11" fill="#64748b">10 กก. x @380.00</text>

  <text x="20" y="224" font-size="13" font-weight="bold" fill="#0f172a">เมล็ดกาแฟ Single Ethiopia 3กก.</text>
  <text x="400" y="224" font-size="13" text-anchor="end" font-weight="bold" fill="#0f172a">1,950.00</text>
  <text x="30" y="242" font-size="11" fill="#64748b">3 กก. x @650.00</text>

  <text x="20" y="276" font-size="13" font-weight="bold" fill="#0f172a">ผงมัทฉะเกรดพิธีการ Uji 5ถุง</text>
  <text x="400" y="276" font-size="13" text-anchor="end" font-weight="bold" fill="#0f172a">1,400.00</text>
  <text x="30" y="294" font-size="11" fill="#64748b">5 ถุง x @280.00</text>

  <line x1="20" y1="320" x2="400" y2="320" stroke="#cbd5e1" stroke-dasharray="4"/>
  <text x="20" y="350" font-size="13" fill="#475569">จำนวนรายการ (ITEMS)</text>
  <text x="400" y="350" font-size="13" text-anchor="end" fill="#475569">3 รายการ</text>
  
  <text x="20" y="388" font-size="16" font-weight="900" fill="#0f172a">ยอดสุทธิ (GRAND TOTAL)</text>
  <text x="400" y="388" font-size="18" font-weight="900" text-anchor="end" fill="#047857">฿ 7,150.00</text>

  <line x1="20" y1="420" x2="400" y2="420" stroke="#0f172a" stroke-width="1.5"/>
  <text x="210" y="455" font-size="12" text-anchor="middle" fill="#64748b">ชำระด้วย: PromptPay QR โอนเงินเรียบร้อย</text>
  <text x="210" y="478" font-size="12" text-anchor="middle" fill="#64748b">ขอบคุณที่อุดหนุน Aroma Specialty Coffee</text>
  
  <rect x="145" y="520" width="130" height="42" rx="8" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="3"/>
  <text x="210" y="546" font-size="14" font-weight="bold" text-anchor="middle" fill="#059669">PAID / ชำระแล้ว</text>
</svg>
`);

const INITIAL_MOCK_SHOPPING_LISTS: PurchaseOrder[] = [
  {
    id: 'PO-20260905-01',
    store_name: 'โรงคั่วกาแฟ Aroma Specialty',
    buyer_name: 'บาริสต้าตั้ม',
    date: '2026-09-05',
    status: 'receipt_uploaded',
    receipt_image: SAMPLE_RECEIPT_IMAGE,
    receipt_uploaded_at: '2026-09-05T11:02:00Z',
    items: [
      {
        name: 'เมล็ดกาแฟ House Blend คั่วกลาง',
        quantity: 10,
        unit: 'กก.',
        cost_per_unit: 380,
        total_price: 3800,
        current_stock: 2.5,
        reorder_point: 5,
        checked: true,
      },
      {
        name: 'เมล็ดกาแฟ Single Origin Ethiopia',
        quantity: 3,
        unit: 'กก.',
        cost_per_unit: 650,
        total_price: 1950,
        current_stock: 0.8,
        reorder_point: 2,
        checked: true,
      },
      {
        name: 'ผงมัทฉะเกรดพิธีการ Uji',
        quantity: 5,
        unit: 'ถุง',
        cost_per_unit: 280,
        total_price: 1400,
        current_stock: 1,
        reorder_point: 3,
        checked: true,
      },
    ],
    totalAmount: 7150,
    note: 'บิลเงินสด มีรูปใบเสร็จชัดเจน รอกรรมการผู้จัดการกดอนุมัติเข้าสต็อก',
  },
  {
    id: 'PO-20260904-02',
    store_name: 'แม็คโคร สาขารังสิต',
    buyer_name: 'สมศรี (พนักงานจัดซื้อ)',
    date: '2026-09-04',
    status: 'completed',
    items: [
      {
        name: 'นมสด Meiji 2L',
        quantity: 12,
        unit: 'แกลลอน',
        cost_per_unit: 95,
        total_price: 1140,
        checked: true,
      },
      {
        name: 'นมข้นหวาน ตรามะลิ',
        quantity: 6,
        unit: 'กระป๋อง',
        cost_per_unit: 26,
        total_price: 156,
        checked: true,
      },
      {
        name: 'แก้วกาแฟเย็น 16oz พร้อมฝา',
        quantity: 500,
        unit: 'ใบ',
        cost_per_unit: 1.8,
        total_price: 900,
        checked: true,
      },
    ],
    totalAmount: 2196,
    verified_at: '2026-09-04T16:20:00Z',
  },
];

export default function PurchaseOrdersPage() {
  const { ingredients, adjustStock, updateIngredient, addIngredient } = useStock();
  const { user } = useAuth();
  const isManagerOrAdmin = Boolean(
    user?.roles?.some((r: string) => r === 'admin' || r === 'manager')
  );

  const [poList, setPoList] = useState<PurchaseOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [prefillItems, setPrefillItems] = useState<PurchaseOrderItem[]>([]);
  const [prefillStore, setPrefillStore] = useState('');

  // Modals state
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [uploadingReceiptPO, setUploadingReceiptPO] = useState<PurchaseOrder | null>(null);
  const [verifyingReceiptPO, setVerifyingReceiptPO] = useState<PurchaseOrder | null>(null);

  // Load POs from localStorage or initialize with mock
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartstock_shopping_orders');
      if (saved) {
        setPoList(JSON.parse(saved));
      } else {
        setPoList(INITIAL_MOCK_SHOPPING_LISTS);
        localStorage.setItem('smartstock_shopping_orders', JSON.stringify(INITIAL_MOCK_SHOPPING_LISTS));
      }
    } catch {
      setPoList(INITIAL_MOCK_SHOPPING_LISTS);
    }
  }, []);

  // Save changes to localStorage
  const saveOrders = (updated: PurchaseOrder[]) => {
    setPoList(updated);
    try {
      localStorage.setItem('smartstock_shopping_orders', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  };

  // Find low-stock items to recommend shopping
  const lowStock = ingredients.filter(
    (item) => item.status === 'low' || item.status === 'out' || item.quantity <= item.reorder_point
  );

  // Handle open create modal from low-stock recommendation
  const handleCreateFromLowStock = () => {
    const recommended: PurchaseOrderItem[] = lowStock.map((ing) => ({
      ingredient_id: ing.id,
      name: ing.name,
      quantity: Math.max(1, (ing.max_stock || ing.reorder_point * 3) - ing.quantity),
      unit: ing.unit,
      current_stock: ing.quantity,
      reorder_point: ing.reorder_point,
      checked: false,
    }));

    setPrefillItems(recommended);
    setPrefillStore(lowStock[0]?.supplier || 'แม็คโคร / ตลาดสด');
    setIsCreateModalOpen(true);
  };

  // Handle open blank create modal
  const handleOpenBlankCreate = () => {
    setPrefillItems([]);
    setPrefillStore('');
    setIsCreateModalOpen(true);
  };

  // Save new PO
  const handleSavePO = (newPO: PurchaseOrder) => {
    const updated = [newPO, ...poList];
    saveOrders(updated);
    setIsCreateModalOpen(false);
  };

  // Staff uploads receipts (can be single or multiple images)
  const handleUploadSuccess = (poId: string, receiptImages: string[], actualStore?: string) => {
    const updated = poList.map((po) => {
      if (po.id === poId) {
        return {
          ...po,
          status: 'receipt_uploaded' as const,
          receipt_image: receiptImages[0] || po.receipt_image,
          receipt_images: receiptImages,
          receipt_uploaded_at: new Date().toISOString(),
          actual_store_name: actualStore || po.store_name,
        };
      }
      return po;
    });

    saveOrders(updated);
    setUploadingReceiptPO(null);
  };

  // Manager approves receipt and executes actual stock IN
  const handleApproveAndStockIn = async (
    poId: string,
    verifiedItems: VerifiedReceiptItem[],
    actualStore?: string,
    totalReceiptAmount?: number,
    receiptImages?: string[]
  ) => {
    const targetPO = poList.find((p) => p.id === poId);
    if (!targetPO) return;

    const actualStoreName = actualStore || targetPO.actual_store_name || targetPO.store_name;
    const finalTotal = totalReceiptAmount !== undefined ? totalReceiptAmount : targetPO.totalAmount;

    // Execute actual Stock IN for each verified item with converted units
    for (const item of verifiedItems) {
      const stockInQty = item.quantity; // converted inventory quantity (e.g. 2000 ml instead of 2 bottles)
      const costToRecord =
        item.inventory_cost_per_unit !== undefined && item.inventory_cost_per_unit > 0
          ? item.inventory_cost_per_unit
          : item.cost_per_unit;

      if (item.ingredient_id) {
        // Stock IN existing item
        await adjustStock(
          item.ingredient_id,
          'in',
          stockInQty,
          `รับเข้าจากบิล #${poId} (${actualStoreName}) [ซื้อ ${item.purchase_quantity} ${item.purchase_unit}]`
        );

        // Update cost per unit and save package info if set
        const updatePayload: Partial<Ingredient> = {};
        if (costToRecord > 0) {
          updatePayload.cost_per_unit = costToRecord;
        }
        if (item.purchase_unit && item.pack_size && item.pack_size > 1) {
          updatePayload.package_unit = item.purchase_unit;
          updatePayload.package_size = item.pack_size;
        }
        if (Object.keys(updatePayload).length > 0) {
          await updateIngredient(item.ingredient_id, updatePayload);
        }
      } else {
        // New item: create in stock
        await addIngredient({
          name: item.name,
          category: 'other',
          unit: item.unit || 'ชิ้น',
          quantity: stockInQty,
          cost_per_unit: costToRecord,
          reorder_point: 5,
          max_stock: stockInQty * 3,
          tracking_type: 'strict',
          supplier: actualStoreName,
          package_unit: item.purchase_unit && item.pack_size > 1 ? item.purchase_unit : undefined,
          package_size: item.pack_size && item.pack_size > 1 ? item.pack_size : undefined,
        });
      }
    }

    // Update PO status to completed
    const updated = poList.map((po) => {
      if (po.id === poId) {
        const finalImages = receiptImages && receiptImages.length > 0 ? receiptImages : po.receipt_images;
        return {
          ...po,
          status: 'completed' as const,
          verified_at: new Date().toISOString(),
          totalAmount: finalTotal,
          actual_store_name: actualStoreName,
          receipt_image: (finalImages && finalImages[0]) || po.receipt_image,
          receipt_images: finalImages,
          items: verifiedItems.map((vi) => ({
            ingredient_id: vi.ingredient_id,
            name: vi.name,
            quantity: vi.quantity,
            unit: vi.unit,
            cost_per_unit: vi.cost_per_unit,
            total_price: vi.total_price,
            checked: true,
          })),
        };
      }
      return po;
    });

    saveOrders(updated);
    setVerifyingReceiptPO(null);
    alert(`รับเข้าสต็อกเรียบร้อยแล้วทั้งหมด ${verifiedItems.length} รายการ!`);
  };

  // Mark completed directly (optional manual bypass)
  const handleMarkCompleted = (poId: string) => {
    const updated = poList.map((po) => {
      if (po.id === poId) {
        return {
          ...po,
          status: 'completed' as const,
          verified_at: new Date().toISOString(),
        };
      }
      return po;
    });
    saveOrders(updated);
    setViewingPO(null);
  };

  // Delete PO
  const handleDeletePO = (poId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`คุณต้องการลบรายการสั่งซื้อ #${poId} หรือไม่?`)) return;
    const updated = poList.filter((p) => p.id !== poId);
    saveOrders(updated);
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'receipt_uploaded' | 'completed'>('all');

  // Summary Metrics
  const totalSpent = poList
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const pendingCount = poList.filter((p) => p.status === 'pending').length;
  const uploadedCount = poList.filter((p) => p.status === 'receipt_uploaded').length;
  const completedCount = poList.filter((p) => p.status === 'completed').length;

  const filteredPOs = poList.filter((po) => {
    if (statusFilter === 'all') return true;
    return po.status === statusFilter;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar
        title="รายการไปซื้อของ & สแกนใบเสร็จ"
        subtitle="จดลิสต์รายการไปจ่ายตลาด พนักงานอัปโหลดรูปบิล/ใบเสร็จ AI ตรวจสอบและรับเข้าสต็อกจริง"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-5 max-w-7xl mx-auto w-full">
        {/* PO Spending Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col justify-between">
            <span className="text-xs text-stone-500 font-normal">ยอดจัดซื้อรับเข้าแล้ว</span>
            <div className="mt-2 text-xl font-bold font-mono tabular-nums text-stone-900">
              ฿{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-stone-400 mt-1">{completedCount} ใบสั่งซื้อสำเร็จ</span>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col justify-between">
            <span className="text-xs text-stone-500 font-normal">รอนำไปซื้อ</span>
            <div className="mt-2 text-xl font-bold font-mono tabular-nums text-stone-700">
              {pendingCount}
            </div>
            <span className="text-[11px] text-stone-400 mt-1">รายการเช็คลิสต์เปิดอยู่</span>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col justify-between">
            <span className="text-xs text-stone-500 font-normal">มีใบเสร็จรอตรวจ</span>
            <div className="mt-2 text-xl font-bold font-mono tabular-nums text-amber-700">
              {uploadedCount}
            </div>
            <span className="text-[11px] text-amber-600 mt-1">รอ AI / ผู้จัดการตรวจ</span>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col justify-between">
            <span className="text-xs text-stone-500 font-normal">ของใกล้หมด</span>
            <div className="mt-2 text-xl font-bold font-mono tabular-nums text-rose-600">
              {lowStock.length}
            </div>
            <span className="text-[11px] text-rose-500 mt-1">รายการสต็อกต่ำกว่าเกณฑ์</span>
          </div>
        </div>

        {/* Recommended Low-Stock Alert Card */}
        {lowStock.length > 0 && (
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#92400e] shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-stone-900">
                  มีวัตถุดิบใกล้หมด <span className="font-mono tabular-nums font-bold">{lowStock.length}</span> รายการที่ต้องไปซื้อเพิ่ม
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                สร้างลิสต์รายการไปจ่ายตลาดจากของใกล้หมดได้ทันที ไม่ต้องกรอกราคาล่วงหน้า
              </p>
            </div>
            <Button
              onClick={handleCreateFromLowStock}
              icon={<Plus className="w-4 h-4" />}
              size="md"
              className="shrink-0 whitespace-nowrap shadow-xs w-full sm:w-auto cursor-pointer rounded-xl bg-stone-900 text-white hover:bg-stone-800"
            >
              ดึงของใกล้หมดทำลิสต์ไปซื้อ
            </Button>
          </div>
        )}

        {/* Shopping Lists Table */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700 shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span>ประวัติรายการไปซื้อของ (<span className="font-mono tabular-nums font-bold">{filteredPOs.length}</span>)</span>
              </h3>
              <p className="text-xs text-stone-400 font-normal mt-0.5">
                คลิกรายการเพื่อดูเช็คลิสต์ ส่งรูปใบเสร็จ หรือตรวจบิลรับเข้าสต็อก
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Tabs */}
              <div className="inline-flex p-1 bg-stone-100 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  ทั้งหมด ({poList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'pending'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  รอซื้อ ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('receipt_uploaded')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'receipt_uploaded'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  รอตรวจ ({uploadedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'completed'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  สำเร็จ ({completedCount})
                </button>
              </div>

              <Button
                onClick={handleOpenBlankCreate}
                icon={<Plus className="w-4 h-4" />}
                size="md"
                className="shrink-0 whitespace-nowrap shadow-xs w-full sm:w-auto cursor-pointer rounded-xl bg-stone-900 text-white hover:bg-stone-800"
              >
                สร้างลิสต์ไปซื้อของใหม่
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-stone-200">
                  <TableHead className="text-stone-900 font-semibold">เลขที่</TableHead>
                  <TableHead className="min-w-40 text-stone-900 font-semibold">ร้าน / ตลาดเป้าหมาย</TableHead>
                  <TableHead className="min-w-28 text-stone-900 font-semibold">ผู้ไปซื้อ</TableHead>
                  <TableHead className="min-w-24 text-stone-900 font-semibold">วันที่</TableHead>
                  <TableHead className="text-center min-w-20 text-stone-900 font-semibold">จำนวน</TableHead>
                  <TableHead className="text-right min-w-28 text-stone-900 font-semibold">ยอดเงิน</TableHead>
                  <TableHead className="text-center min-w-36 text-stone-900 font-semibold">สถานะ</TableHead>
                  <TableHead className="text-center min-w-36 text-stone-900 font-semibold">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-stone-400 font-normal">
                      {statusFilter === 'all'
                        ? 'ยังไม่มีรายการไปซื้อของ กดปุ่ม "+ สร้างลิสต์ไปซื้อของใหม่" เพื่อเริ่มต้น'
                        : 'ไม่พบรายการที่ตรงกับสถานะที่เลือก'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPOs.map((po) => {
                    const isReceiptUploaded = po.status === 'receipt_uploaded';
                    const isCompleted = po.status === 'completed';
                    const isPending = po.status === 'pending';

                    return (
                      <TableRow
                        key={po.id}
                        onClick={() => {
                          if (isReceiptUploaded) {
                            setVerifyingReceiptPO(po);
                          } else {
                            setViewingPO(po);
                          }
                        }}
                        className={`cursor-pointer transition-colors ${
                          isReceiptUploaded ? 'bg-[#faf6f0]/60 hover:bg-[#f5efe6]/70' : 'hover:bg-stone-50/80'
                        }`}
                      >
                        <TableCell className="font-mono tabular-nums font-semibold text-stone-900">
                          {po.id}
                        </TableCell>
                        <TableCell className="text-stone-800 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{po.store_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-stone-600 font-normal">{po.buyer_name || '-'}</TableCell>
                        <TableCell className="text-stone-500 font-mono tabular-nums text-xs font-normal">{po.date}</TableCell>
                        <TableCell className="text-center text-stone-700 font-normal">
                          <span className="font-mono tabular-nums">{po.items?.length || 0}</span> รายการ
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums font-semibold text-stone-900">
                          {(po.totalAmount ?? 0) > 0
                            ? `฿${(po.totalAmount ?? 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : <span className="text-stone-400 text-xs font-normal">รอราคาจากบิล</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> รับเข้าสต็อกแล้ว
                            </span>
                          )}
                          {isReceiptUploaded && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
                              <Sparkles className="w-3 h-3 text-[#78350f]" /> มีใบเสร็จ - รอตรวจ
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                              <Clock className="w-3 h-3 text-stone-500" /> รอนำไปซื้อ
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div
                            className="inline-flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Staff: Upload receipt */}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => setUploadingReceiptPO(po)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#78350f] hover:bg-[#92400e] text-white shadow-2xs transition-all cursor-pointer active:scale-95"
                                title="พนักงานถ่ายรูปบิล/ใบเสร็จส่งเข้าระบบ"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>ส่งใบเสร็จ</span>
                              </button>
                            )}

                            {/* Manager: Verify AI Receipt */}
                            {isReceiptUploaded && (
                              <button
                                type="button"
                                onClick={() => setVerifyingReceiptPO(po)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition-all cursor-pointer active:scale-95"
                                title="ตรวจใบเสร็จด้วย AI และกดยืนยันรับเข้าสต็อกจริง"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>ตรวจบิล &amp; นำเข้าสต็อก</span>
                              </button>
                            )}

                            {/* View & Print Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingPO(po)}
                              icon={<Printer className="w-3.5 h-3.5 text-stone-600" />}
                              className="h-7 px-2.5 text-xs font-normal shrink-0 whitespace-nowrap cursor-pointer rounded-lg border-stone-200 text-stone-700 hover:bg-stone-50"
                            >
                              {isCompleted && po.receipt_image ? 'ดูบิล & พิมพ์' : 'ดู & พิมพ์'}
                            </Button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => handleDeletePO(po.id, e)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Modal: Create Shopping List */}
      <CreatePOModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSavePO}
        availableIngredients={ingredients}
        initialItems={prefillItems}
        defaultStore={prefillStore}
      />

      {/* Modal: Upload Receipt Photo (Staff / Buyer) */}
      <UploadReceiptModal
        isOpen={Boolean(uploadingReceiptPO)}
        onClose={() => setUploadingReceiptPO(null)}
        po={uploadingReceiptPO}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Modal: AI Receipt Verification & Stock In (Manager / Admin) */}
      <ReceiptVerificationModal
        isOpen={Boolean(verifyingReceiptPO)}
        onClose={() => setVerifyingReceiptPO(null)}
        po={verifyingReceiptPO}
        ingredients={ingredients}
        onApproveAndStockIn={handleApproveAndStockIn}
        isManagerOrAdmin={isManagerOrAdmin}
      />

      {/* Modal: Print & Checklist View */}
      <POPrintViewModal
        po={viewingPO}
        onClose={() => setViewingPO(null)}
        onMarkCompleted={handleMarkCompleted}
      />
    </div>
  );
}
