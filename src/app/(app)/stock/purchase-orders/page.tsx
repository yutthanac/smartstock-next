'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Send,
  Building2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Package,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';

export default function PurchaseOrdersPage() {
  const { ingredients } = useStock();

  const [poList, setPoList] = useState([
    {
      id: 'PO-20260901-01',
      supplier: 'บจก. ซีพี แอ็กซ์ตร้า',
      date: '2026-09-01',
      itemsCount: 3,
      totalAmount: 4850,
      status: 'pending', // pending, received
    },
    {
      id: 'PO-20260828-02',
      supplier: 'ตลาดสดมหาชัยซีฟู้ด',
      date: '2026-08-28',
      itemsCount: 2,
      totalAmount: 2600,
      status: 'received',
    },
  ]);

  const lowStock = ingredients.filter((i) => i.quantity <= i.reorder_point);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar title="ใบสั่งซื้อ & ซัพพลายเออร์ (Purchase Orders)" subtitle="จัดการจัดซื้อวัตถุดิบเติมสต็อกและคู่ค้า" />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Recommended PO Quick-Gen Card */}
        {lowStock.length > 0 && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#12312d] to-[#1c4d46] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#4fb0a5]" />
                <h3 className="font-bold text-base">ระบบตรวจพบวัตถุดิบใกล้หมด {lowStock.length} รายการ</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                สร้างใบสั่งซื้อ (PO) ส่งหาซัพพลายเออร์อัตโนมัติตามจุดสั่งซื้อที่ตั้งไว้
              </p>
            </div>
            <button className="px-4 py-2.5 rounded-xl bg-[#4fb0a5] hover:bg-[#3d9b90] text-slate-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto">
              + สร้าง PO เติมสต็อกด่วนทันที
            </button>
          </div>
        )}

        {/* PO List Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#4fb0a5]" />
              รายการใบสั่งซื้อล่าสุด
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">เลขที่ PO</th>
                  <th className="py-3 px-4">ซัพพลายเออร์</th>
                  <th className="py-3 px-4">วันที่สั่งซื้อ</th>
                  <th className="py-3 px-4 text-center">จำนวนรายการ</th>
                  <th className="py-3 px-4 text-right">ยอดรวม (บาท)</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {poList.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{po.id}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{po.supplier}</td>
                    <td className="py-3 px-4 text-slate-500">{po.date}</td>
                    <td className="py-3 px-4 text-center">{po.itemsCount} รายการ</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ฿{po.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {po.status === 'received' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> รับของเข้าคลังแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> รอส่งมอบสินค้า
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="text-xs text-[#4fb0a5] hover:underline font-semibold">
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
