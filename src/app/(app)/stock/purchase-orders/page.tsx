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

const INITIAL_MOCK_SHOPPING_LISTS: PurchaseOrder[] = [
  {
    id: 'SHOP-20260905-01',
    store_name: 'ตลาดสดมหาชัยซีฟู้ด',
    buyer_name: 'น้าแหวว (แม่ครัว)',
    date: '2026-09-05',
    status: 'pending',
    items: [
      {
        name: 'กุ้งขาวสดคัดไซส์',
        quantity: 8,
        unit: 'กก.',
        cost_per_unit: 220,
        total_price: 1760,
        current_stock: 2.1,
        reorder_point: 5,
        checked: false,
      },
      {
        name: 'ปลาหมึกกล้วยสด',
        quantity: 6,
        unit: 'กก.',
        cost_per_unit: 260,
        total_price: 1560,
        current_stock: 1.5,
        reorder_point: 4,
        checked: false,
      },
      {
        name: 'หอยลายสด',
        quantity: 10,
        unit: 'กก.',
        cost_per_unit: 95,
        total_price: 950,
        current_stock: 3,
        reorder_point: 6,
        checked: false,
      },
    ],
    subtotal: 4270,
    totalAmount: 4270,
    note: 'ไปซื้อช่วงตี 5 จะได้ของสดใหม่ คัดตัวโตๆ เก็บใบเสร็จเงินสดมาด้วย',
  },
  {
    id: 'SHOP-20260904-02',
    store_name: 'แม็คโคร Makro สาขาใกล้ร้าน',
    buyer_name: 'สมชาย (ผู้ช่วยเชฟ)',
    date: '2026-09-04',
    status: 'completed',
    items: [
      {
        name: 'เนื้อหมูสันนอก',
        quantity: 15,
        unit: 'กก.',
        cost_per_unit: 160,
        total_price: 2400,
        checked: true,
      },
      {
        name: 'น้ำมันปาล์มสำหรับทอด (แกลลอน)',
        quantity: 2,
        unit: 'กล่อง',
        cost_per_unit: 345,
        total_price: 690,
        checked: true,
      },
      {
        name: 'ถุงหิ้วใส่กล่องอาหาร 8x16',
        quantity: 5,
        unit: 'แพ็ค',
        cost_per_unit: 45,
        total_price: 225,
        checked: true,
      },
    ],
    subtotal: 3315,
    totalAmount: 3315,
    note: 'ซื้อของเข้าคลังและตรวจนับยอดเรียบร้อย',
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
    setPrefillStore('ตลาดสด / ร้านประจำ');
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
    if (confirm(`คุณต้องการลบรายการจ่ายตลาดเลขที่ ${id} หรือไม่?`)) {
      setPoList((prev) => prev.filter((po) => po.id !== id));
      if (viewingPO?.id === id) setViewingPO(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#ebecf0]">
      <Topbar
        title="รายการไปซื้อของ & จ่ายตลาด (Shopping Lists)"
        subtitle="ลิสต์รายการวัตถุดิบที่ต้องไปซื้อหน้าร้าน/ตลาด พิมพ์ใบเช็คลิสต์พกพา และควบคุมงบจัดซื้อ"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Recommended Low-Stock Alert Card */}
        {lowStock.length > 0 && (
          <div className="p-5 rounded-3xl skeuo-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-200/50">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-base text-slate-900">
                  มีวัตถุดิบใกล้หมด {lowStock.length} รายการที่ควรออกไปซื้อ
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                กดดึงวัตถุดิบที่ขาดจัดทำเป็นรายการไปจ่ายตลาดได้ทันที ไม่ต้องจดมือ
              </p>
            </div>
            <button
              onClick={handleCreateFromLowStock}
              className="px-4 py-2.5 rounded-2xl skeuo-btn-primary font-bold text-xs transition-all self-start sm:self-auto flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-700/20"
            >
              <Plus className="w-4 h-4" />
              ดึงของใกล้หมดทำรายการจ่ายตลาด
            </button>
          </div>
        )}

        {/* Shopping Lists Table */}
        <div className="skeuo-card rounded-3xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-800" />
                ประวัติรายการไปซื้อของ / จ่ายตลาด ({poList.length})
              </h3>
              <p className="text-xs text-slate-500">คลิกรายการเพื่อเปิดดูใบเช็คลิสต์ สั่งพิมพ์พกพาไปตลาด หรือส่งออก CSV</p>
            </div>

            <button
              onClick={handleOpenBlankCreate}
              className="px-4 py-2.5 rounded-2xl skeuo-btn-primary font-bold text-xs transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + ทำรายการซื้อของใหม่
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-200/60 border-b border-slate-300/70 text-slate-700 uppercase tracking-wider font-bold whitespace-nowrap">
                  <th className="py-3.5 px-4">เลขที่</th>
                  <th className="py-3.5 px-4 min-w-40">ร้าน / ตลาดที่จะไปซื้อ</th>
                  <th className="py-3.5 px-4 min-w-28">ผู้ไปซื้อ</th>
                  <th className="py-3.5 px-4 min-w-24">วันที่ซื้อ</th>
                  <th className="py-3.5 px-4 text-center min-w-24">จำนวนของ</th>
                  <th className="py-3.5 px-4 text-right min-w-28">งบประมาณรวม</th>
                  <th className="py-3.5 px-4 text-center min-w-28">สถานะ</th>
                  <th className="py-3.5 px-4 text-center min-w-28">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 whitespace-nowrap">
                {poList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                      ยังไม่มีรายการจ่ายตลาด กดปุ่ม "+ ทำรายการซื้อของใหม่" เพื่อเริ่มต้น
                    </td>
                  </tr>
                ) : (
                  poList.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => setViewingPO(po)}
                      className="hover:bg-slate-200/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-emerald-800">{po.id}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{po.store_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{po.buyer_name || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-500">{po.date}</td>
                      <td className="py-3.5 px-4 text-center text-slate-700 font-semibold">
                        {po.items?.length || 0} อย่าง
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-800">
                        ฿{po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {po.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold skeuo-badge-green">
                            <CheckCircle2 className="w-3 h-3" /> ซื้อของครบแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold skeuo-badge-amber">
                            <Clock className="w-3 h-3" /> รอนำไปซื้อ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingPO(po);
                            }}
                            className="px-3 py-1.5 rounded-xl skeuo-btn-secondary text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1"
                            title="เปิดดู / สั่งพิมพ์"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-700" />
                            <span>ดู & พิมพ์</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePO(po.id, e)}
                            className="p-1.5 rounded-xl hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
