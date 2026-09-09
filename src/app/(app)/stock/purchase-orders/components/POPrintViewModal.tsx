'use client';

import React from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { Button } from '@/components/Button';

interface POPrintViewModalProps {
  po: PurchaseOrder | null;
  onClose: () => void;
  onMarkCompleted?: (id: string) => void;
}

export const POPrintViewModal: React.FC<POPrintViewModalProps> = ({
  po,
  onClose,
  onMarkCompleted,
}) => {
  if (!po) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['ลำดับ', 'สถานะซื้อ', 'รายการวัตถุดิบ/สินค้า', 'จำนวนที่ต้องซื้อ', 'หน่วย', 'ราคาประมาณ/หน่วย (บาท)', 'ยอดเงินรวม (บาท)'];
    
    const rows = po.items.map((item, idx) => [
      idx + 1,
      item.checked ? '"ซื้อแล้ว"' : '"ยังไม่ซื้อ"',
      `"${(item.name || '').replace(/"/g, '""')}"`,
      item.quantity,
      `"${item.unit}"`,
      item.cost_per_unit != null ? item.cost_per_unit.toFixed(2) : '-',
      item.total_price != null ? item.total_price.toFixed(2) : '-',
    ]);

    const summaryRows = [
      [],
      ['', '', '', '', '', 'ยอดงบประมาณจัดซื้อรวม', (po.totalAmount ?? 0) > 0 ? (po.totalAmount ?? 0).toFixed(2) : '-'],
      [],
      ['เลขที่ใบรายการ:', po.id],
      ['ไปซื้อที่ร้าน/ตลาด:', `"${po.store_name}"`],
      ['วันที่ไปจ่ายตลาด:', po.date],
      ['ผู้ไปจ่ายตลาด:', `"${po.buyer_name || 'พนักงานร้าน'}"`],
      ['หมายเหตุ:', `"${(po.note || '').replace(/"/g, '""')}"`],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(',')), ...summaryRows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ShoppingList_${po.store_name}_${po.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Blank filler rows so small lists fill the A4 page naturally
  const minRows = 19;
  const blankRowsCount = Math.max(0, minRows - po.items.length);
  const blankRows = Array.from({ length: blankRowsCount }, (_, i) => po.items.length + i + 1);

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="print-modal-card bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Screen only) */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700 flex items-center justify-center font-normal">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base flex items-center gap-2">
                ใบจ่ายตลาด: <span className="text-stone-900 font-semibold">{po.store_name}</span>
              </h3>
              <p className="text-xs text-stone-500">
                เลขที่: <span className="font-mono tabular-nums font-semibold">{po.id}</span> • วันที่: <span className="font-mono tabular-nums">{po.date}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {po.status === 'pending' && onMarkCompleted && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onMarkCompleted(po.id)}
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                className="hidden sm:inline-flex rounded-xl border-stone-200 text-stone-700 hover:bg-stone-100"
              >
                ซื้อของครบแล้ว
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              icon={<Download className="w-4 h-4 text-stone-600" />}
              className="rounded-xl border-stone-200 text-stone-700 hover:bg-stone-100"
            >
              Export CSV
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
              className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"
            >
              พิมพ์ใบจ่ายตลาด (Print)
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Shopping List Document */}
        <div 
          className="print-sheet p-6 sm:p-8 overflow-y-auto print:overflow-visible print:p-0 bg-white text-stone-800 text-sm leading-normal space-y-4 print:space-y-4"
          style={{ fontFamily: "var(--font-sarabun), 'TH Sarabun New', 'TH Sarabun PSK', Sarabun, sans-serif" }}
        >
          
          {/* Header Title */}
          <div className="flex justify-between items-start border-b-2 border-stone-900 pb-3">
            <div>
              <p className="text-xs uppercase font-bold text-stone-500 tracking-wider">SmartStock System</p>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
                ใบรายการไปซื้อของ / จ่ายตลาด
              </h1>
              <p className="text-stone-500 text-xs mt-0.5">Shopping Checklist สำหรับพกพาหรือมอบหมายพนักงาน</p>
            </div>

            <div className="text-right space-y-1">
              <p className="font-mono tabular-nums font-bold text-sm sm:text-base text-stone-900">
                เลขที่: <span className="font-extrabold">{po.id}</span>
              </p>
              <p className="text-stone-600 text-xs sm:text-sm">
                วันที่ซื้อ: <span className="font-bold text-stone-800 font-mono tabular-nums">{po.date}</span>
              </p>
              <p className="text-xs text-stone-500 font-medium">
                สถานะ: {po.status === 'completed' ? '✓ ซื้อครบแล้ว' : '⏳ รอออกไปซื้อ'}
              </p>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm print:bg-white">
            <div>
              <span className="text-stone-500 block text-xs">ร้านค้า / ตลาดเป้าหมาย:</span>
              <span className="font-bold text-stone-900 text-sm sm:text-base block mt-0.5">
                {po.store_name}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-xs">ผู้ไปจ่ายตลาด:</span>
              <span className="font-semibold text-stone-800 text-sm sm:text-base block mt-0.5">
                {po.buyer_name || 'พนักงานร้าน'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block text-xs">งบประมาณโดยประมาณ:</span>
              <span className="font-black text-[#78350f] text-sm sm:text-base block mt-0.5 font-mono tabular-nums print:text-black">
                {(po.totalAmount ?? 0) > 0
                  ? `฿${(po.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'ยังไม่ระบุราคา'}
              </span>
            </div>
          </div>

          {/* Checklist Items Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-stone-800 font-semibold text-xs uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">ติ๊ก</th>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-4">รายการวัตถุดิบ / สินค้า</th>
                  <th className="py-2.5 px-3 text-center w-28">จำนวน</th>
                  <th className="py-2.5 px-3 text-center w-20">หน่วย</th>
                  <th className="py-2.5 px-3 text-right w-28">ราคา/หน่วย</th>
                  <th className="py-2.5 px-4 text-right w-28">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {po.items.map((item, index) => (
                  <tr key={index} className="hover:bg-stone-50 print:hover:bg-transparent">
                    {/* Printable Checkbox */}
                    <td className="py-2 px-3 text-center">
                      <div className="w-5 h-5 mx-auto border-2 border-stone-400 rounded flex items-center justify-center print:border-black">
                        {item.checked && <span className="font-bold text-sm">✓</span>}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center text-stone-400 font-medium font-mono tabular-nums">{index + 1}</td>
                    <td className="py-2 px-4">
                      <span className="font-semibold text-stone-900">{item.name}</span>
                      {item.current_stock !== undefined && (
                        <span className="text-xs text-stone-500 ml-2 print:hidden font-mono tabular-nums">
                          (คงเหลือที่ร้าน: {item.current_stock} {item.unit})
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-stone-900 font-mono tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-center text-stone-700">
                      {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right text-stone-600 font-mono tabular-nums">
                      {item.cost_per_unit != null && item.cost_per_unit > 0
                        ? `฿${item.cost_per_unit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-stone-900 font-mono tabular-nums">
                      {item.total_price != null && item.total_price > 0
                        ? `฿${item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                  </tr>
                ))}

                {/* Blank filler rows to fill A4 sheet proportionally */}
                {blankRows.map((rowNum) => (
                  <tr key={`blank-${rowNum}`} className="h-8">
                    <td className="py-2 px-3 text-center">
                      <div className="w-5 h-5 mx-auto border border-dashed border-stone-300 rounded print:border-stone-400"></div>
                    </td>
                    <td className="py-2 px-3 text-center text-stone-300 font-medium font-mono tabular-nums">{rowNum}</td>
                    <td className="py-2 px-4"></td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-4"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Notes & Signatures for Print */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
            <div className="p-3 border border-stone-200 rounded-xl bg-stone-50/50 print:bg-white">
              <span className="font-bold text-stone-800 block mb-1">หมายเหตุเพิ่มเติม / ข้อความถึงผู้ไปซื้อ:</span>
              <p className="text-stone-600 whitespace-pre-line leading-relaxed">
                {po.note || 'ไม่มีหมายเหตุเพิ่มเติม'}
              </p>
            </div>

            <div className="border border-stone-200 rounded-xl p-3 flex flex-col justify-between print:border-stone-400">
              <div className="text-stone-500 flex justify-between">
                <span>ลายเซ็นผู้ไปซื้อ: _______________________</span>
                <span>วันที่: ____/____/______</span>
              </div>
              <div className="text-stone-500 flex justify-between pt-2 border-t border-dashed border-stone-200">
                <span>ผู้รับของเข้าคลัง: _____________________</span>
                <span>ตรวจนับถูกต้องครบถ้วน [  ]</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
