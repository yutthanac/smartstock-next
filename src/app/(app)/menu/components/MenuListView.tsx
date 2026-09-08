import React from 'react';
import { Layers, Edit2, Trash2, GripVertical } from 'lucide-react';
import { MenuItem } from '@/types';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/Table';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface MenuListViewProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
  onReorder?: (orderedIds: number[]) => Promise<boolean | void>;
}

interface SortableMenuRowProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}

function SortableMenuRow({ item, onEdit, onDelete }: SortableMenuRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: isDragging ? 'relative' : undefined,
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'bg-slate-100 shadow-md ring-1 ring-slate-300' : ''}
    >
      {/* Drag Handle */}
      <TableCell className="w-10 px-2 text-center whitespace-nowrap">
        <button
          type="button"
          className="cursor-grab touch-none p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 active:cursor-grabbing transition-colors inline-flex items-center justify-center"
          title="คลิกค้างเพื่อลากสลับตำแหน่งเมนู"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </TableCell>

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

      <TableCell className="whitespace-nowrap">
        <Badge variant="neutral">
          {item.category}
        </Badge>
      </TableCell>

      <TableCell className="text-right font-normal text-slate-800 text-sm font-mono whitespace-nowrap">
        ฿{item.price.toFixed(2)}
      </TableCell>

      <TableCell className="text-right font-normal text-slate-500 font-mono whitespace-nowrap">
        ฿{item.recipe_cost.toFixed(2)}
      </TableCell>

      <TableCell className="text-right font-normal text-slate-700 font-mono whitespace-nowrap">
        ฿{(item.price - item.recipe_cost).toFixed(2)}
      </TableCell>

      <TableCell className="text-center whitespace-nowrap">
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
                className="inline-flex items-center gap-1 text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200 whitespace-nowrap"
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

      <TableCell className="text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(item)}
            title="แก้ไขสูตร"
            className="w-8 h-8 p-0 rounded-xl inline-flex items-center justify-center"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDelete(item.id)}
            className="w-8 h-8 p-0 rounded-xl inline-flex items-center justify-center hover:text-rose-600 hover:bg-rose-50"
            title="ลบเมนู"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export const MenuListView: React.FC<MenuListViewProps> = ({ items, onEdit, onDelete, onReorder }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const itemIds = React.useMemo(() => items.map((i) => i.id), [items]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemIds.indexOf(active.id as number);
    const newIndex = itemIds.indexOf(over.id as number);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(itemIds, oldIndex, newIndex);
    if (onReorder) {
      await onReorder(newOrder);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-2 text-center whitespace-nowrap text-slate-400 font-normal text-xs" title="ลากเพื่อสลับลำดับ">
                  ย้าย
                </TableHead>
                <TableHead className="whitespace-nowrap">รูปภาพ & เมนู</TableHead>
                <TableHead className="whitespace-nowrap">หมวดหมู่</TableHead>
                <TableHead className="text-right whitespace-nowrap">ราคาขาย</TableHead>
                <TableHead className="text-right whitespace-nowrap">ต้นทุน</TableHead>
                <TableHead className="text-right whitespace-nowrap">กำไร/จาน</TableHead>
                <TableHead className="text-center whitespace-nowrap">มาร์จิ้น</TableHead>
                <TableHead className="whitespace-nowrap">สูตรวัตถุดิบ </TableHead>
                <TableHead className="text-center whitespace-nowrap w-24">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <SortableMenuRow
                    key={item.id}
                    item={item}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
};
