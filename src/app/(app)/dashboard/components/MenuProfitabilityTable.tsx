import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/Table';

interface MenuProfitabilityTableProps {
  menuProfitability: DashboardKPI['menu_profitability'];
}

export const MenuProfitabilityTable: React.FC<MenuProfitabilityTableProps> = ({ menuProfitability }) => {
  return (
    <section className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-stone-900 text-base">ตารางวิเคราะห์ต้นทุนและกำไรต่อเมนู</h3>
          <p className="text-sm text-stone-500 mt-0.5 font-normal">คำนวณต้นทุนวัตถุดิบจริงตามสูตรชง/เสิร์ฟ x ปริมาณที่ใช้ต่อแก้ว</p>
        </div>
        <Link
          href="/menu"
          className="text-xs font-semibold text-stone-800 hover:text-stone-950 border border-stone-200 bg-stone-50 hover:bg-stone-100 px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs transition-colors"
        >
          จัดการสูตรเมนู <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="border-stone-200">
              <TableHead className="text-stone-600 font-semibold">ชื่อเมนู</TableHead>
              <TableHead className="text-stone-600 font-semibold">หมวดหมู่</TableHead>
              <TableHead className="text-right text-stone-600 font-semibold">ราคาขาย</TableHead>
              <TableHead className="text-right text-stone-600 font-semibold">ต้นทุนวัตถุดิบ</TableHead>
              <TableHead className="text-right text-stone-600 font-semibold">กำไรต่อเสิร์ฟ</TableHead>
              <TableHead className="text-right text-stone-600 font-semibold">มาร์จิ้น</TableHead>
              <TableHead className="text-right text-stone-600 font-semibold">ยอดขายวันนี้</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuProfitability.map((item) => (
              <TableRow key={item.id} className="border-stone-100 hover:bg-stone-50/50">
                <TableCell className="font-semibold text-stone-900 text-sm">{item.name}</TableCell>
                <TableCell className="text-stone-500 font-normal text-sm">{item.category}</TableCell>
                <TableCell className="text-right font-semibold text-stone-900 tabular-nums text-sm">฿{item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right text-stone-500 font-normal tabular-nums text-sm">฿{item.cost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold text-stone-900 tabular-nums text-sm">฿{item.profit.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
                    {item.margin.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-normal text-stone-700 text-sm">
                  <span className="font-semibold text-stone-900 tabular-nums">{item.sales_count}</span> <span className="text-stone-500">แก้ว/เสิร์ฟ</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
