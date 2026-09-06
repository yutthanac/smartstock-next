import React from 'react';
import { Layers, Edit2, Trash2 } from 'lucide-react';
import { MenuItem } from '@/types';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';

interface MenuListViewProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}

export const MenuListView: React.FC<MenuListViewProps> = ({ items, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รูปภาพ & เมนู</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead className="text-right">ราคาขาย</TableHead>
              <TableHead className="text-right">ต้นทุน BOM</TableHead>
              <TableHead className="text-right">กำไร/จาน</TableHead>
              <TableHead className="text-center">มาร์จิ้น (% Margin)</TableHead>
              <TableHead>สูตรวัตถุดิบ (BOM Recipes)</TableHead>
              <TableHead className="text-center">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                      <img
                        src={item.image || '/images/logo_ss.png'}
                        alt={item.name}
                        className={`w-full h-full ${item.image ? 'object-cover rounded-xl' : 'object-contain'}`}
                      />
                    </div>
                    <div>
                      <div className="font-normal text-slate-900 text-sm">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{item.description}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-normal text-slate-800 text-sm font-mono">
                  ฿{item.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-normal text-slate-500 font-mono">
                  ฿{item.recipe_cost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-normal text-slate-700 font-mono">
                  ฿{(item.price - item.recipe_cost).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="neutral">
                    {item.margin_percent}%
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {item.recipes && item.recipes.length > 0 ? (
                      item.recipes.map((r, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200"
                        >
                          <span className="font-normal">{r.ingredient_name || `#${r.ingredient_id}`}</span>
                          <span className="font-normal text-slate-800 font-mono">{r.quantity_used} {r.ingredient_unit}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">ไม่มีสูตร</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(item)}
                      title="แก้ไขสูตร"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onDelete(item.id)}
                      className="hover:text-rose-600 hover:bg-rose-50"
                      title="ลบเมนู"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
