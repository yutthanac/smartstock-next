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
      className={isDragging ? 'bg-stone-100 shadow-md ring-1 ring-stone-300' : ''}
    >
      {/* Drag Handle */}
      <TableCell className="w-10 px-2 text-center whitespace-nowrap">
        <button
          type="button"
          className="cursor-grab touch-none p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 active:cursor-grabbing transition-colors inline-flex items-center justify-center"
          title="คลิกค้างเพื่อลากสลับตำแหน่งเมนู"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-stone-200/90 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
            <img
              src={item.image || '/images/logo_ss.png'}
              alt={item.name}
              className={`w-full h-full ${item.image ? 'object-cover rounded-lg' : 'object-contain'}`}
            />
          </div>
          <div>
            <div className="font-semibold text-stone-900 text-sm">{item.name}</div>
            {item.description && (
              <div className="text-xs text-stone-400 line-clamp-1 max-w-xs">{item.description}</div>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
          {item.category}
        </span>
      </TableCell>

      <TableCell className="text-right font-semibold text-stone-900 text-sm font-mono tabular-nums whitespace-nowrap">
        ฿{item.price.toFixed(2)}
      </TableCell>

      <TableCell className="text-right font-medium text-stone-500 font-mono tabular-nums whitespace-nowrap">
        ฿{item.recipe_cost.toFixed(2)}
      </TableCell>

      <TableCell className="text-right font-semibold text-stone-800 font-mono tabular-nums whitespace-nowrap">
        ฿{(item.price - item.recipe_cost).toFixed(2)}
      </TableCell>

      <TableCell className="text-center whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]">
          {item.margin_percent}%
        </span>
      </TableCell>

      <TableCell className="max-w-xs">
        <div className="flex flex-wrap gap-1">
          {item.recipes && item.recipes.length > 0 ? (
            item.recipes.map((r, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs bg-stone-50 text-stone-700 px-2 py-0.5 rounded-lg border border-stone-200 whitespace-nowrap"
              >
                <span className="font-normal">{r.ingredient_name || `#${r.ingredient_id}`}</span>
                <span className="font-medium text-stone-900 font-mono tabular-nums">{r.quantity_used} {r.ingredient_unit}</span>
              </span>
            ))
          ) : (
            <span className="text-stone-400 text-xs italic">ไม่มีสูตร</span>
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
            className="w-8 h-8 p-0 rounded-xl inline-flex items-center justify-center bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDelete(item.id)}
            className="w-8 h-8 p-0 rounded-xl inline-flex items-center justify-center bg-stone-100 border border-stone-200 text-stone-700 hover:text-rose-600 hover:bg-stone-200"
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
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
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
                <TableHead className="w-10 px-2 text-center whitespace-nowrap text-stone-400 font-medium text-xs" title="ลากเพื่อสลับลำดับ">
                  ย้าย
                </TableHead>
                <TableHead className="whitespace-nowrap">รูปภาพ & เมนู</TableHead>
                <TableHead className="whitespace-nowrap">หมวดหมู่</TableHead>
                <TableHead className="text-right whitespace-nowrap">ราคาขาย</TableHead>
                <TableHead className="text-right whitespace-nowrap">ต้นทุน</TableHead>
                <TableHead className="text-right whitespace-nowrap">กำไร/จาน</TableHead>
                <TableHead className="text-center whitespace-nowrap">มาร์จิ้น</TableHead>
                <TableHead className="whitespace-nowrap">สูตรวัตถุดิบ</TableHead>
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
