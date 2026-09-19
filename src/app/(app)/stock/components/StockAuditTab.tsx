'use client';

import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  Loader2,
  Search,
  Package,
} from 'lucide-react';
import { Ingredient } from '@/types';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/Table';
import { Dropdown } from '@/components/Dropdown';
import { formatStockUnits, formatInteger } from '@/lib/cafePresets';

interface AuditRow {
  ingredient: Ingredient;
  countedQty: string; // string for input control (in base units)
  note: string;
}

interface StockAuditTabProps {
  ingredients: Ingredient[];
  storeId?: string | number | null;
  onReconcileComplete?: () => void;
}

export function StockAuditTab({ ingredients, storeId, onReconcileComplete }: StockAuditTabProps) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Derive unique category list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(ingredients.map((i) => i.category || 'ไม่ระบุหมวดหมู่')));
    return [{ value: 'all', label: 'ทุกหมวดหมู่' }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [ingredients]);

  // Filter ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchCat = filterCategory === 'all' || (ing.category || 'ไม่ระบุหมวดหมู่') === filterCategory;
      const matchSearch = ing.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [ingredients, filterCategory, search]);

  const initializeSheet = () => {
    const newRows = filteredIngredients.map((ing) => ({
      ingredient: ing,
      countedQty: String(Math.round(ing.quantity)), // pre-fill with rounded integer
      note: '',
    }));
    setRows(newRows);
    setIsInitialized(true);
    setResultMsg(null);
  };

  const updateRow = (id: number, field: 'countedQty' | 'note', value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.ingredient.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const getVariance = (row: AuditRow): number => {
    const counted = parseInt(row.countedQty, 10);
    if (isNaN(counted)) return 0;
    return counted - Math.round(row.ingredient.quantity);
  };

  // Only rows with an actual difference
  const changedRows = rows.filter((r) => {
    const counted = parseInt(r.countedQty, 10);
    return !isNaN(counted) && counted !== Math.round(r.ingredient.quantity);
  });

  const handleReconcile = async () => {
    if (changedRows.length === 0) {
      setResultMsg({ type: 'error', text: 'ไม่มีรายการที่ยอดนับต่างจากระบบ — ไม่จำเป็นต้องปรับ' });
      return;
    }

    setIsSubmitting(true);
    setResultMsg(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
      const token = localStorage.getItem('smartstock_token');

      const payload = {
        store_id: storeId ?? undefined,
        items: changedRows.map((r) => ({
          ingredient_id: r.ingredient.id,
          actual_quantity: parseInt(r.countedQty, 10) || 0,
          note: r.note.trim() || 'รีเช็คสต๊อกประจำงวด (ปรับยอดนับจริง)',
        })),
      };

      const res = await fetch(`${apiUrl}/ingredients/audit/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(storeId ? { 'X-Store-ID': String(storeId) } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResultMsg({
        type: 'success',
        text: `ปรับยอดสำเร็จ ${data.updated_count ?? changedRows.length} รายการ`,
      });

      onReconcileComplete?.();
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: `เกิดข้อผิดพลาด: ${err.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700 shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">รีเช็คสต๊อกจริง (Stock Audit)</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              ตรวจนับสต็อกรวมเดี่ยว บันทึกยอดจริงเป็นจำนวนเต็ม พร้อมปรับสมดุลทันที
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!isInitialized ? (
            <Button
              onClick={initializeSheet}
              size="sm"
              className="bg-stone-900 text-white hover:bg-stone-800 rounded-xl whitespace-nowrap text-xs shadow-2xs"
            >
              เริ่มตรวจนับสต็อก
            </Button>
          ) : (
            <>
              <Button
                onClick={initializeSheet}
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                className="rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 text-xs shadow-2xs"
              >
                รีเซ็ตแผ่นนับ
              </Button>
              <Button
                onClick={handleReconcile}
                isLoading={isSubmitting}
                size="sm"
                className="bg-stone-900 text-white hover:bg-stone-800 rounded-xl whitespace-nowrap text-xs shadow-2xs"
                disabled={isSubmitting || changedRows.length === 0}
              >
                ยืนยันปรับยอด ({changedRows.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Result feedback */}
      {resultMsg && (
        <div
          className={`px-4 py-3 rounded-xl text-xs flex items-center gap-2 border ${
            resultMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {resultMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{resultMsg.text}</span>
        </div>
      )}

      {/* Filters and Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาวัตถุดิบ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full pl-8 pr-3 text-xs rounded-xl bg-white border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 shadow-2xs"
            />
          </div>

          <Dropdown
            value={filterCategory}
            onChange={setFilterCategory}
            options={categories}
            size="sm"
            className="w-full sm:w-44"
            buttonClassName="border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs shadow-2xs rounded-xl"
          />
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-stone-200">
                <TableHead className="text-stone-900 font-semibold text-xs">วัตถุดิบ</TableHead>
                <TableHead className="text-stone-900 font-semibold text-xs">หมวดหมู่</TableHead>
                <TableHead className="text-right text-stone-900 font-semibold text-xs whitespace-nowrap">
                  ยอดในระบบ
                </TableHead>
                <TableHead className="text-right text-stone-900 font-semibold text-xs whitespace-nowrap min-w-[180px]">
                  ยอดที่นับได้จริง
                </TableHead>
                <TableHead className="text-right text-stone-900 font-semibold text-xs whitespace-nowrap">
                  ผลต่าง (Diff)
                </TableHead>
                <TableHead className="text-stone-900 font-semibold text-xs">หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const variance = getVariance(row);
                const hasVariance = variance !== 0;
                const isNegative = variance < 0;
                const formattedSystem = formatStockUnits(
                  row.ingredient.quantity,
                  row.ingredient.package_size,
                  row.ingredient.package_unit,
                  row.ingredient.unit
                );
                const packSize = Number(row.ingredient.package_size || 0);
                const packUnit = row.ingredient.package_unit || '';
                const countedVal = parseInt(row.countedQty, 10);
                const countedPacks = packSize > 0 && !isNaN(countedVal) ? Math.floor(countedVal / packSize) : 0;
                const countedRemainder = packSize > 0 && !isNaN(countedVal) ? countedVal % packSize : 0;

                return (
                  <TableRow key={row.ingredient.id} className="hover:bg-stone-50/60">
                    <TableCell className="font-medium text-stone-900 text-xs">
                      <div>
                        <div className="font-semibold">{row.ingredient.name}</div>
                        {Boolean(packSize > 0 && packUnit) && (
                          <div className="text-[11px] text-stone-400 font-normal">
                            1 {packUnit} = {formatInteger(packSize)} {row.ingredient.unit}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-stone-500 text-xs font-normal">
                      {row.ingredient.category || '-'}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="text-xs font-mono tabular-nums">
                        <span className="font-bold text-stone-900">{formattedSystem.packText}</span>{' '}
                        <span className="text-stone-500 text-[11px]">({formattedSystem.baseText})</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={row.countedQty}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*$/.test(val)) {
                                updateRow(row.ingredient.id, 'countedQty', val);
                              }
                            }}
                            className={`w-28 h-8 text-right text-xs font-mono tabular-nums px-2 rounded-xl border transition-colors focus:outline-none font-bold ${
                              hasVariance
                                ? isNegative
                                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                                  : 'border-amber-300 bg-amber-50 text-amber-800'
                                : 'border-stone-200 bg-stone-50 text-stone-900 focus:bg-white'
                            }`}
                          />
                          <span className="text-xs text-stone-500 whitespace-nowrap">{row.ingredient.unit}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {!hasVariance ? (
                        <span className="inline-flex items-center gap-1 text-stone-400 text-xs font-normal">
                          <Minus className="w-3.5 h-3.5" />
                          ตรง
                        </span>
                      ) : isNegative ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-mono tabular-nums text-xs font-semibold">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {variance.toLocaleString()} {row.ingredient.unit}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-mono tabular-nums text-xs font-semibold">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{variance.toLocaleString()} {row.ingredient.unit}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <input
                        type="text"
                        placeholder={hasVariance ? 'ระบุสาเหตุ...' : ''}
                        value={row.note}
                        onChange={(e) => updateRow(row.ingredient.id, 'note', e.target.value)}
                        className="w-full min-w-[150px] h-8 text-xs px-2.5 rounded-xl border border-stone-200 bg-transparent text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 font-normal"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <span className="text-sm">กำลังโหลดรายการ...</span>
          </div>
        )}
      </div>

      {/* Footer summary */}
      {changedRows.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-stone-900 text-white text-xs">
          <span>
            {changedRows.length} รายการมีผลต่าง —
            <span className="text-rose-300 ml-1 font-semibold">{changedRows.filter((r) => getVariance(r) < 0).length} รายการขาด</span>
            <span className="text-stone-500 mx-1.5">·</span>
            <span className="text-amber-300 font-semibold">{changedRows.filter((r) => getVariance(r) > 0).length} รายการเกิน</span>
          </span>
          <Button
            onClick={handleReconcile}
            isLoading={isSubmitting}
            size="sm"
            className="bg-white text-stone-900 hover:bg-stone-100 rounded-xl"
            disabled={isSubmitting}
          >
            ยืนยันปรับยอดทั้งหมด
          </Button>
        </div>
      )}
    </div>
  );
}
