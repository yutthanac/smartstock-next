'use client';

import React from 'react';
import {
  Printer,
  Download,
  X,
  Store,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  FileText,
  CheckSquare,
  Square,
  ShoppingBag,
} from 'lucide-react';
import { PurchaseOrder } from '../types';

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
      item.cost_per_unit.toFixed(2),
      item.total_price.toFixed(2),
    ]);

    const summaryRows = [
      [],
      ['', '', '', '', '', 'ยอดงบประมาณจัดซื้อรวม', po.totalAmount.toFixed(2)],
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
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="print-modal-card bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Screen only) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                ใบจ่ายตลาด: <span className="text-emerald-700">{po.store_name}</span>
              </h3>
              <p className="text-xs text-slate-500">
                เลขที่: {po.id} • วันที่: {po.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {po.status === 'pending' && onMarkCompleted && (
              <button
                onClick={() => onMarkCompleted(po.id)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                ซื้อของครบแล้ว
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบจ่ายตลาด (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Shopping List Document */}
        <div 
          className="print-sheet p-6 sm:p-8 overflow-y-auto print:overflow-visible print:p-0 bg-white text-slate-800 text-sm leading-normal space-y-4 print:space-y-4"
          style={{ fontFamily: "var(--font-sarabun), 'TH Sarabun New', 'TH Sarabun PSK', Sarabun, sans-serif" }}
        >
          
          {/* Header Title */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">SmartStock System</p>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                ใบรายการไปซื้อของ / จ่ายตลาด
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Shopping Checklist สำหรับพกพาหรือมอบหมายพนักงาน</p>
            </div>

            <div className="text-right space-y-1">
              <p className="font-mono font-bold text-sm sm:text-base text-slate-900">
                เลขที่: <span className="font-extrabold">{po.id}</span>
              </p>
              <p className="text-slate-600 text-xs sm:text-sm">
                วันที่ซื้อ: <span className="font-bold text-slate-800">{po.date}</span>
              </p>
              <p className="text-xs text-slate-500 font-medium">
                สถานะ: {po.status === 'completed' ? '✓ ซื้อครบแล้ว' : '⏳ รอออกไปซื้อ'}
              </p>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm print:bg-white">
            <div>
              <span className="text-slate-500 block text-xs">ร้านค้า / ตลาดเป้าหมาย:</span>
              <span className="font-bold text-slate-900 text-sm sm:text-base block mt-0.5">
                {po.store_name}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">ผู้ไปจ่ายตลาด:</span>
              <span className="font-semibold text-slate-800 text-sm sm:text-base block mt-0.5">
                {po.buyer_name || 'พนักงานร้าน'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-xs">งบประมาณโดยประมาณ:</span>
              <span className="font-black text-slate-900 text-sm sm:text-base block mt-0.5 text-emerald-800 print:text-black">
                ฿{po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Checklist Items Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-xs uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">ติ๊ก</th>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-4">รายการวัตถุดิบ / สินค้า</th>
                  <th className="py-2.5 px-3 text-center w-28">จำนวน</th>
                  <th className="py-2.5 px-3 text-center w-20">หน่วย</th>
                  <th className="py-2.5 px-3 text-right w-28">ราคา/หน่วย</th>
                  <th className="py-2.5 px-4 text-right w-28">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {po.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 print:hover:bg-transparent">
                    {/* Printable Checkbox */}
                    <td className="py-2 px-3 text-center">
                      <div className="w-5 h-5 mx-auto border-2 border-slate-400 rounded flex items-center justify-center print:border-black">
                        {item.checked && <span className="font-bold text-sm">✓</span>}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400 font-medium">{index + 1}</td>
                    <td className="py-2 px-4">
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      {item.current_stock !== undefined && (
                        <span className="text-xs text-slate-400 ml-2 print:hidden">
                          (คงเหลือที่ร้าน: {item.current_stock} {item.unit})
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-700">
                      {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      ฿{item.cost_per_unit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-slate-900">
                      ฿{item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}

                {/* Blank filler rows to fill A4 sheet proportionally */}
                {blankRows.map((rowNum) => (
                  <tr key={`blank-${rowNum}`} className="h-8">
                    <td className="py-2 px-3 text-center">
                      <div className="w-5 h-5 mx-auto border border-dashed border-slate-300 rounded print:border-slate-400"></div>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-300 text-xs">{rowNum}</td>
                    <td className="py-2 px-4 text-slate-300"></td>
                    <td className="py-2 px-3 text-center text-slate-300"></td>
                    <td className="py-2 px-3 text-center text-slate-300"></td>
                    <td className="py-2 px-3 text-right text-slate-300"></td>
                    <td className="py-2 px-4 text-right text-slate-300"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes & Budget Summary */}
          <div className="flex justify-between items-start gap-4 pt-1">
            <div className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm print:bg-white">
              <span className="font-bold text-slate-700 block">หมายเหตุ / ฝากซื้อพิเศษ:</span>
              <p className="text-slate-600 mt-1">
                {po.note || 'ตรวจดูความสดของวัตถุดิบและเก็บใบเสร็จ/บิลเงินสดกลับมาด้วยทุกครั้ง'}
              </p>
            </div>

            <div className="w-64 p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm print:bg-white space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>จำนวนรายการ:</span>
                <span className="font-bold text-slate-800">{po.items.length} รายการ</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-slate-300 text-sm">
                <span>งบประมาณรวม:</span>
                <span className="text-emerald-800 print:text-black font-extrabold text-base">
                  ฿{po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info (screen only) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden">
          <p className="text-xs text-slate-500 font-medium">
            พิมพ์ใบนี้แล้วนำไปเดินเลือกซื้อที่ตลาด สามารถใช้ปากกาติ๊กช่องด้านหน้าได้สะดวก
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
