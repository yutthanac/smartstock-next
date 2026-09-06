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
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { PurchaseOrder, PurchaseOrderItem } from './types';
import { CreatePOModal } from './components/CreatePOModal';
import { POPrintViewModal } from './components/POPrintViewModal';
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

const INITIAL_MOCK_SHOPPING_LISTS: PurchaseOrder[] = [
  {
    id: 'PO-20260905-01',
    store_name: 'โรงคั่วกาแฟ Aroma Specialty',
    buyer_name: 'บาริสต้าตั้ม',
    date: '2026-09-05',
    status: 'pending',
    items: [
      {
        name: 'เมล็ดกาแฟ House Blend คั่วกลาง',
        quantity: 10,
        unit: 'กก.',
        cost_per_unit: 380,
        total_price: 3800,
        current_stock: 2.5,
        reorder_point: 5,
        checked: false,
      },
      {
        name: 'เมล็ดกาแฟ Single Origin Ethiopia (คั่วอ่อน)',
        quantity: 3,
        unit: 'กก.',
        cost_per_unit: 650,
        total_price: 1950,
        current_stock: 0.8,
        reorder_point: 2,
        checked: false,
      },
      {
        name: 'ผงมัทฉะเกรดพิธีการ Uji Matcha 100g',
        quantity: 5,
        unit: 'ถุง',
        cost_per_unit: 280,
        total_price: 1400,
        current_stock: 1,
        reorder_point: 3,
        checked: false,
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
    note: 'ตรวจเช็ควันหมดอายุนมสด และรับเข้าคลังเรียบร้อย',
  },
];

export default function PurchaseOrdersPage() {
  const { ingredients } = useStock();

  const [poList, setPoList] = useState<PurchaseOrder[]>(INITIAL_MOCK_SHOPPING_LISTS);
  const [isMounted, setIsMounted] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [prefillItems, setPrefillItems] = useState<PurchaseOrderItem[]>([]);
  const [prefillStore, setPrefillStore] = useState<string>('');

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
        cost_per_unit: ing.cost_per_unit || 50,
        total_price: (suggestedQty > 0 ? suggestedQty : 3) * (ing.cost_per_unit || 50),
        current_stock: ing.quantity,
        reorder_point: ing.reorder_point,
        checked: false,
      };
    });

    setPrefillItems(items);
    setPrefillStore('โรงคั่วกาแฟ / ซัพพลายเออร์');
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
        title="รายการสั่งซื้อวัตถุดิบ"
        subtitle="จัดการรายการสั่งซื้อวัตถุดิบ คุมงบประมาณ และพิมพ์ใบเช็คลิสต์"
      />

      <main className="p-6 md:p-8 space-y-5 max-w-7xl mx-auto w-full">
        {/* Recommended Low-Stock Alert Card */}
        {lowStock.length > 0 && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <h3 className="font-medium text-sm text-slate-900">
                  มีวัตถุดิบใกล้หมด {lowStock.length} รายการที่ต้องสั่งเพิ่ม
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                สร้างรายการสั่งซื้อจากของใกล้หมดได้ทันที
              </p>
            </div>
            <Button
              onClick={handleCreateFromLowStock}
              icon={<Plus className="w-3.5 h-3.5" />}
              size="sm"
            >
              ดึงของใกล้หมดทำรายการสั่งซื้อ
            </Button>
          </div>
        )}

        {/* Shopping Lists Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-normal text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-500" />
                ประวัติการสั่งซื้อวัตถุดิบ ({poList.length})
              </h3>
              <p className="text-xs text-slate-400 font-normal">คลิกรายการเพื่อดูรายละเอียด พิมพ์ใบเช็คลิสต์ หรือส่งออก CSV</p>
            </div>

            <Button
              onClick={handleOpenBlankCreate}
              icon={<Plus className="w-3.5 h-3.5" />}
              size="sm"
            >
              สั่งซื้อวัตถุดิบใหม่
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>เลขที่</TableHead>
                  <TableHead className="min-w-40">ร้าน / ซัพพลายเออร์</TableHead>
                  <TableHead className="min-w-28">ผู้สั่งซื้อ</TableHead>
                  <TableHead className="min-w-24">วันที่สั่ง</TableHead>
                  <TableHead className="text-center min-w-24">จำนวน</TableHead>
                  <TableHead className="text-right min-w-28">ยอดรวม</TableHead>
                  <TableHead className="text-center min-w-28">สถานะ</TableHead>
                  <TableHead className="text-center min-w-28">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-normal">
                      ยังไม่มีรายการสั่งซื้อ กดปุ่ม "+ สั่งซื้อวัตถุดิบใหม่" เพื่อเริ่มต้น
                    </TableCell>
                  </TableRow>
                ) : (
                  poList.map((po) => (
                    <TableRow
                      key={po.id}
                      onClick={() => setViewingPO(po)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono font-normal text-slate-700">{po.id}</TableCell>
                      <TableCell className="text-slate-700 font-normal">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{po.store_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-normal">{po.buyer_name || '-'}</TableCell>
                      <TableCell className="text-slate-400 font-normal">{po.date}</TableCell>
                      <TableCell className="text-center text-slate-500 font-normal">
                        {po.items?.length || 0} อย่าง
                      </TableCell>
                      <TableCell className="text-right font-mono font-normal text-slate-700">
                        ฿{po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {po.status === 'completed' ? (
                          <Badge variant="outline" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-slate-500" />}>
                            ซื้อครบแล้ว
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3 text-amber-600" />}>
                            รอนำไปซื้อ
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingPO(po);
                            }}
                            icon={<Printer className="w-3.5 h-3.5 text-slate-600" />}
                            className="h-7 px-2.5 text-[11px] font-normal"
                          >
                            ดู & พิมพ์
                          </Button>
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
                  ))
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

      {/* Modal: Print & Checklist View */}
      <POPrintViewModal
        po={viewingPO}
        onClose={() => setViewingPO(null)}
        onMarkCompleted={handleMarkCompleted}
      />
    </div>
  );
}
