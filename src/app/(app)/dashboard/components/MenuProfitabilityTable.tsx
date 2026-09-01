import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardKPI } from '@/types';

interface MenuProfitabilityTableProps {
  menuProfitability: DashboardKPI['menu_profitability'];
}

export const MenuProfitabilityTable: React.FC<MenuProfitabilityTableProps> = ({ menuProfitability }) => {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">ตารางวิเคราะห์ต้นทุนและกำไรต่อเมนู (BOM Margin)</h3>
          <p className="text-xs text-slate-500">คำนวณต้นทุนวัตถุดิบจริงตามสูตรอาหาร x ปริมาณที่ใช้ต่อ 1 จาน</p>
        </div>
        <Link
          href="/menu"
          className="text-xs font-semibold text-[#4fb0a5] hover:underline flex items-center"
        >
          จัดการสูตรเมนู <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 rounded-l-xl">ชื่อเมนู</th>
              <th className="py-3 px-4">หมวดหมู่</th>
              <th className="py-3 px-4 text-right">ราคาขาย</th>
              <th className="py-3 px-4 text-right">ต้นทุนวัตถุดิบ (BOM)</th>
              <th className="py-3 px-4 text-right">กำไรต่อจาน</th>
              <th className="py-3 px-4 text-right">มาร์จิ้น (% Margin)</th>
              <th className="py-3 px-4 text-right rounded-r-xl">ยอดขายวันนี้</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {menuProfitability.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                <td className="py-3 px-4 text-slate-500">{item.category}</td>
                <td className="py-3 px-4 text-right font-semibold text-slate-800">฿{item.price.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-amber-600 font-medium">฿{item.cost.toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600">฿{item.profit.toFixed(2)}</td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e6f7f5] text-[#235851]">
                    {item.margin.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-700">{item.sales_count} จาน</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
