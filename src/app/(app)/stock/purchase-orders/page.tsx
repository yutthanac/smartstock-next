'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Store,
  CheckCircle2,
  Clock,
  Package,
  Printer,
  Download,
  Trash2,
  ShoppingBag,
  Camera,
  Sparkles,
  Eye,
  Check,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';
import { Topbar } from '@/components/Topbar';
import { PurchaseOrder, PurchaseOrderItem } from './types';
import { CreatePOModal } from './components/CreatePOModal';
import { POPrintViewModal } from './components/POPrintViewModal';
import { UploadReceiptModal } from './components/UploadReceiptModal';
import { ReceiptVerificationModal, VerifiedReceiptItem } from './components/ReceiptVerificationModal';
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
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 660" width="420" height="660" style="background:#ffffff;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
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
        name: 'เมล็ดกาแฟ Single Origin Ethiopia (คั่วอ่อน)',
        quantity: 3,
        unit: 'กก.',
        cost_per_unit: 650,
        total_price: 1950,
        current_stock: 0.8,
        reorder_point: 2,
        checked: true,
      },
      {
        name: 'ผงมัทฉะเกรดพิธีการ Uji Matcha 100g',
        quantity: 5,
        unit: 'ถุง',
        cost_per_unit: 280,
        total_price: 1400,
        current_stock: 1,
        reorder_point: 3,
        checked: true,
      },
    ],
    subtotal: 7150,
    totalAmount: 7150,
    note: 'เลือกรอบคั่วไม่เกิน 7 วัน และขอใบกำกับภาษี',
  },
  {
    id: 'PO-20260904-02',
    store_name: 'แม็คโคร Makro',
    buyer_name: 'ผู้จัดการร้าน',
    date: '2026-09-04',
    status: 'completed',
    items: [
      {
        name: 'นมสด Meiji พาสเจอร์ไรส์ 2L',
        quantity: 12,
        unit: 'แกลลอน',
        cost_per_unit: 95,
        total_price: 1140,
        checked: true,
      },
      {
        name: 'ไซรัปวานิลลา Monin 700ml',
        quantity: 4,
        unit: 'ขวด',
        cost_per_unit: 290,
        total_price: 1160,
        checked: true,
      },
      {
        name: 'แก้วกาแฟเย็น PET 16oz พร้อมฝายกดื่ม',
        quantity: 2,
        unit: 'ลัง',
        cost_per_unit: 550,
        total_price: 1100,
        checked: true,
      },
      {
        name: 'เนยสดแท้ Pure Butter สำหรับขนม',
        quantity: 5,
        unit: 'กก.',
        cost_per_unit: 280,
        total_price: 1400,
        checked: true,
      },
    ],
    subtotal: 4800,
    totalAmount: 4800,
    verified_by: 'ผู้จัดการร้าน',
    verified_at: '2026-09-04T15:20:00Z',
    ai_confidence: 99,
    note: 'ตรวจเช็ควันหมดอายุนมสด และรับเข้าคลังเรียบร้อย',
  },
];

export default function PurchaseOrdersPage() {
  const { ingredients, adjustStock, updateIngredient, fetchData } = useStock();
  const { user, activeStore } = useAuth();

  const [poList, setPoList] = useState<PurchaseOrder[]>(INITIAL_MOCK_SHOPPING_LISTS);
  const [isMounted, setIsMounted] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [uploadingReceiptPO, setUploadingReceiptPO] = useState<PurchaseOrder | null>(null);
  const [verifyingReceiptPO, setVerifyingReceiptPO] = useState<PurchaseOrder | null>(null);

  const [prefillItems, setPrefillItems] = useState<PurchaseOrderItem[]>([]);
  const [prefillStore, setPrefillStore] = useState<string>('');

  // Role permissions check
  const isManagerOrAdmin = !user
    ? true
    : ['owner', 'admin', 'manager'].includes(activeStore?.my_role || '') ||
      (user as any)?.role === 'admin' ||
      (user as any)?.role === 'owner' ||
      (user as any)?.role === 'manager' ||
      Boolean(user?.roles?.some((r: any) => ['owner', 'admin', 'manager'].includes(r.name)));

  // Hydrate from localStorage after mount to prevent SSR mismatch
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('smartstock_shopping_orders');
    if (saved) {
      try {
        setPoList(JSON.parse(saved));
      } catch {
        // fallback
      }
    }
  }, []);

  // Save to localStorage whenever poList changes (only after mounted)
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('smartstock_shopping_orders', JSON.stringify(poList));
    }
  }, [poList, isMounted]);

  // Low stock items
  const lowStock = ingredients.filter((i) => i.quantity <= i.reorder_point);

  // Quick shopping list from low stock
  const handleCreateFromLowStock = () => {
    const items: PurchaseOrderItem[] = lowStock.map((ing) => {
      const suggestedQty = Math.max(1, Math.ceil(ing.reorder_point * 2 - ing.quantity));
      return {
        ingredient_id: ing.id,
        name: ing.name,
        quantity: suggestedQty > 0 ? suggestedQty : 3,
        unit: ing.unit,
        cost_per_unit: ing.cost_per_unit || undefined,
        total_price: ing.cost_per_unit ? (suggestedQty > 0 ? suggestedQty : 3) * ing.cost_per_unit : undefined,
        current_stock: ing.quantity,
        reorder_point: ing.reorder_point,
        checked: false,
      };
    });

    setPrefillItems(items);
    setPrefillStore('');
    setIsCreateModalOpen(true);
  };

  const handleOpenBlankCreate = () => {
    setPrefillItems([]);
    setPrefillStore('');
    setIsCreateModalOpen(true);
  };

  const handleSavePO = (newPO: PurchaseOrder) => {
    setPoList((prev) => [newPO, ...prev]);
    setViewingPO(newPO);
  };

  const handleUploadSuccess = (poId: string, receiptBase64: string, actualStore?: string) => {
    let updatedPO: PurchaseOrder | null = null;
    setPoList((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          updatedPO = {
            ...po,
            receipt_image: receiptBase64,
            receipt_uploaded_at: new Date().toISOString(),
            status: 'receipt_uploaded',
            store_name: actualStore || po.store_name,
          };
          return updatedPO;
        }
        return po;
      })
    );
    setUploadingReceiptPO(null);

    // Open verification modal immediately for seamless manager review
    if (updatedPO) {
      setVerifyingReceiptPO(updatedPO);
    }
  };

  const handleApproveAndStockIn = async (
    poId: string,
    verifiedItems: VerifiedReceiptItem[],
    actualStore?: string,
    totalReceiptAmount?: number,
    newReceiptImage?: string
  ) => {
    // 1. Update real backend inventory & costs
    for (const item of verifiedItems) {
      if (item.ingredient_id) {
        const note = `รับเข้าจากใบเสร็จจัดซื้อ #${poId}${actualStore ? ` (${actualStore})` : ''}`;
        try {
          await adjustStock(item.ingredient_id, 'in', item.quantity, note);
          if (item.cost_per_unit > 0) {
            await updateIngredient(item.ingredient_id, { cost_per_unit: item.cost_per_unit });
          }
        } catch (err) {
          console.error('Failed to update stock for item:', item.name, err);
        }
      }
    }

    // 2. Update PO record
    const calculatedTotal = verifiedItems.reduce((sum, it) => sum + (it.total_price || 0), 0);
    const finalTotal = totalReceiptAmount && totalReceiptAmount > 0 ? totalReceiptAmount : calculatedTotal;

    setPoList((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          return {
            ...po,
            status: 'completed',
            store_name: actualStore || po.store_name,
            receipt_image: newReceiptImage || po.receipt_image,
            items: verifiedItems.map((v) => ({
              ingredient_id: v.ingredient_id,
              name: v.name,
              quantity: v.quantity,
              unit: v.unit,
              cost_per_unit: v.cost_per_unit,
              total_price: v.total_price,
              checked: true,
            })),
            subtotal: finalTotal,
            totalAmount: finalTotal,
            verified_by: user?.name || activeStore?.name || 'ผู้จัดการร้าน',
            verified_at: new Date().toISOString(),
            ai_confidence: 98,
          };
        }
        return po;
      })
    );

    setVerifyingReceiptPO(null);
    if (viewingPO?.id === poId) {
      setViewingPO(null);
    }

    // Refresh stock list from backend
    try {
      await fetchData();
    } catch {
      // ignore
    }
  };

  const handleMarkCompleted = (id: string) => {
    setPoList((prev) =>
      prev.map((po) =>
        po.id === id
          ? {
              ...po,
              status: 'completed' as const,
              items: po.items.map((it) => ({ ...it, checked: true })),
            }
          : po
      )
    );
    if (viewingPO && viewingPO.id === id) {
      setViewingPO((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              items: prev.items.map((it) => ({ ...it, checked: true })),
            }
          : null
      );
    }
  };

  const handleDeletePO = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`คุณต้องการลบรายการสั่งซื้อเลขที่ ${id} หรือไม่?`)) {
      setPoList((prev) => prev.filter((po) => po.id !== id));
      if (viewingPO?.id === id) setViewingPO(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Topbar
        title="รายการไปซื้อของ & สแกนใบเสร็จ"
        subtitle="จดลิสต์รายการไปจ่ายตลาด พนักงานอัปโหลดรูปบิล/ใบเสร็จ AI ตรวจสอบและรับเข้าสต็อกจริง"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-5 max-w-7xl mx-auto w-full">
        {/* Recommended Low-Stock Alert Card */}
        {lowStock.length > 0 && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <h3 className="font-medium text-sm text-slate-900">
                  มีวัตถุดิบใกล้หมด {lowStock.length} รายการที่ต้องไปซื้อเพิ่ม
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                สร้างลิสต์รายการไปจ่ายตลาดจากของใกล้หมดได้ทันที ไม่ต้องกรอกราคาล่วงหน้า
              </p>
            </div>
            <Button
              onClick={handleCreateFromLowStock}
              icon={<Plus className="w-3.5 h-3.5" />}
              size="sm"
              className="shrink-0 whitespace-nowrap cursor-pointer"
            >
              ดึงของใกล้หมดทำลิสต์ไปซื้อ
            </Button>
          </div>
        )}

        {/* Shopping Lists Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-600" />
                ประวัติรายการไปซื้อของ ({poList.length})
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                คลิกรายการเพื่อดูเช็คลิสต์ ส่งรูปใบเสร็จ หรือตรวจบิลรับเข้าสต็อก
              </p>
            </div>

            <Button
              onClick={handleOpenBlankCreate}
              icon={<Plus className="w-3.5 h-3.5" />}
              size="sm"
              className="shrink-0 whitespace-nowrap cursor-pointer"
            >
              สร้างลิสต์ไปซื้อของใหม่
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>เลขที่</TableHead>
                  <TableHead className="min-w-40">ร้าน / ตลาดเป้าหมาย</TableHead>
                  <TableHead className="min-w-28">ผู้ไปซื้อ</TableHead>
                  <TableHead className="min-w-24">วันที่</TableHead>
                  <TableHead className="text-center min-w-20">จำนวน</TableHead>
                  <TableHead className="text-right min-w-28">ยอดเงิน</TableHead>
                  <TableHead className="text-center min-w-36">สถานะ</TableHead>
                  <TableHead className="text-center min-w-36">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-normal">
                      ยังไม่มีรายการไปซื้อของ กดปุ่ม "+ สร้างลิสต์ไปซื้อของใหม่" เพื่อเริ่มต้น
                    </TableCell>
                  </TableRow>
                ) : (
                  poList.map((po) => {
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
                          isReceiptUploaded ? 'bg-indigo-50/30 hover:bg-indigo-50/60' : ''
                        }`}
                      >
                        <TableCell className="font-mono font-medium text-slate-700">
                          {po.id}
                        </TableCell>
                        <TableCell className="text-slate-800 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{po.store_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 font-normal">{po.buyer_name || '-'}</TableCell>
                        <TableCell className="text-slate-400 font-normal">{po.date}</TableCell>
                        <TableCell className="text-center text-slate-600 font-normal">
                          {po.items?.length || 0} รายการ
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-slate-800">
                          {(po.totalAmount ?? 0) > 0
                            ? `฿${(po.totalAmount ?? 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : <span className="text-slate-400 text-xs font-normal">รอราคาจากบิล</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {isCompleted && (
                            <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}>
                              รับเข้าสต็อกแล้ว
                            </Badge>
                          )}
                          {isReceiptUploaded && (
                            <Badge
                              variant="outline"
                              size="sm"
                              className="border-indigo-200 text-indigo-700 bg-indigo-50/60 font-medium"
                              icon={<Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />}
                            >
                              มีใบเสร็จ - รอตรวจ
                            </Badge>
                          )}
                          {isPending && (
                            <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3 text-amber-600" />}>
                              รอนำไปซื้อ
                            </Badge>
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
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all cursor-pointer active:scale-95"
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
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm shadow-indigo-200 transition-all cursor-pointer active:scale-95 animate-pulse hover:animate-none"
                                title="ตรวจใบเสร็จด้วย AI และกดยืนยันรับเข้าสต็อกจริง"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>ตรวจบิล & นำเข้าสต็อก</span>
                              </button>
                            )}

                            {/* View & Print Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingPO(po)}
                              icon={<Printer className="w-3.5 h-3.5 text-slate-600" />}
                              className="h-7 px-2.5 text-[11px] font-normal shrink-0 whitespace-nowrap cursor-pointer"
                            >
                              {isCompleted && po.receipt_image ? 'ดูบิล & พิมพ์' : 'ดู & พิมพ์'}
                            </Button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => handleDeletePO(po.id, e)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
