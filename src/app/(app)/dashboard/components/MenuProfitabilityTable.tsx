import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';

interface MenuProfitabilityTableProps {
  menuProfitability: DashboardKPI['menu_profitability'];
}

export const MenuProfitabilityTable: React.FC<MenuProfitabilityTableProps> = ({ menuProfitability }) => {
  return (
    <section className="skeuo-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">ตารางวิเคราะห์ต้นทุนและกำไรต่อเมนู (BOM Margin)</h3>
          <p className="text-sm text-slate-500 mt-0.5 font-normal">คำนวณต้นทุนวัตถุดิบจริงตามสูตรชง/เสิร์ฟ x ปริมาณที่ใช้ต่อแก้ว</p>
        </div>
        <Link
          href="/menu"
          className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 bg-white px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs"
        >
          จัดการสูตรเมนู <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อเมนู</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead className="text-right">ราคาขาย</TableHead>
              <TableHead className="text-right">ต้นทุนวัตถุดิบ (BOM)</TableHead>
              <TableHead className="text-right">กำไรต่อเสิร์ฟ</TableHead>
              <TableHead className="text-right">มาร์จิ้น (% Margin)</TableHead>
              <TableHead className="text-right">ยอดขายวันนี้</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuProfitability.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-slate-800 text-sm">{item.name}</TableCell>
                <TableCell className="text-slate-500 font-normal text-xs">{item.category}</TableCell>
                <TableCell className="text-right font-medium text-slate-800 font-mono text-sm">฿{item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right text-slate-500 font-normal font-mono text-sm">฿{item.cost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium text-slate-800 font-mono text-sm">฿{item.profit.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="neutral" size="md">
                    {item.margin.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-normal text-slate-700 text-sm">{item.sales_count} แก้ว/เสิร์ฟ</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
