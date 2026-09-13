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

interface AuditRow {
  ingredient: Ingredient;
  countedQty: string; // string for input control
  countedBackstock: string; // for 2-tier (packages)
  countedBar: string; // for 2-tier (base unit remainder)
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

  // Map ingredient id -> audit row for quick lookup
  const rowMap = useMemo(() => {
    const m: Record<number, AuditRow> = {};
    rows.forEach((r) => { m[r.ingredient.id] = r; });
    return m;
  }, [rows]);

  const initializeSheet = () => {
    const newRows = filteredIngredients.map((ing) => ({
      ingredient: ing,
      countedQty: String(ing.quantity), // pre-fill with system qty
      countedBackstock: ing.is_two_tier ? String(ing.backstock_quantity ?? 0) : '',
      countedBar: ing.is_two_tier ? String(ing.bar_quantity ?? 0) : '',
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

  const updateTierRow = (id: number, field: 'countedBackstock' | 'countedBar', value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.ingredient.id !== id) return r;
        const next = { ...r, [field]: value };
        const bs = parseFloat(field === 'countedBackstock' ? value : r.countedBackstock) || 0;
        const bar = parseFloat(field === 'countedBar' ? value : r.countedBar) || 0;
        const ps = r.ingredient.package_size || 1;
        const total = (bs * ps) + bar;
        next.countedQty = String(total);
        return next;
      })
    );
  };

  const getVariance = (row: AuditRow): number => {
    const counted = parseFloat(row.countedQty);
    if (isNaN(counted)) return 0;
    return counted - row.ingredient.quantity;
  };

  // Only rows with an actual difference
  const changedRows = rows.filter((r) => {
    const counted = parseFloat(r.countedQty);
    return !isNaN(counted) && Math.abs(counted - r.ingredient.quantity) >= 0.001;
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (storeId) headers['X-Store-ID'] = String(storeId);

      // Retrieve token from localStorage if auth is implemented
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        items: changedRows.map((r) => ({
          ingredient_id: r.ingredient.id,
          counted_qty: parseFloat(r.countedQty),
          counted_backstock_qty: r.ingredient.is_two_tier ? parseFloat(r.countedBackstock || '0') : undefined,
          counted_bar_qty: r.ingredient.is_two_tier ? parseFloat(r.countedBar || '0') : undefined,
          note: r.note.trim() || undefined,
        })),
      };

      const res = await fetch(`${apiUrl}/ingredients/audit-reconcile`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setResultMsg({
          type: 'success',
          text: `${data.message} (${data.adjusted_count} รายการ)`,
        });
        setRows([]);
        setIsInitialized(false);
        onReconcileComplete?.();
      } else {
        setResultMsg({ type: 'error', text: data.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
      }
    } catch {
      setResultMsg({ type: 'error', text: 'ไม่สามารถเชื่อมต่อ Server ได้ กรุณาลองใหม่' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render pre-init state (instructions + filters)
  if (!isInitialized) {
    return (
      <div className="space-y-5">
        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6 text-stone-700" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-stone-900 text-base">ตรวจนับสต็อกสิ้นวัน / ปิดกะ</h2>
              <p className="text-sm text-stone-500 font-normal mt-0.5">
                กรอกยอดนับจริง เพื่อเทียบกับยอดในระบบ และปรับผลต่างพร้อมกันในครั้งเดียว
              </p>
            </div>
            <Button
              onClick={initializeSheet}
              icon={<RotateCcw className="w-4 h-4" />}
              size="md"
              className="bg-stone-900 text-white hover:bg-stone-800 rounded-xl shadow-xs shrink-0 w-full sm:w-auto"
            >
              ⚡ ดึงยอดระบบเป็นค่าเริ่มต้น
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาวัตถุดิบ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full pl-9 pr-3 text-sm rounded-xl bg-white border border-stone-200/90 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors font-normal shadow-2xs"
            />
          </div>
          <Dropdown
            value={filterCategory}
            onChange={setFilterCategory}
            options={categories}
            size="md"
            className="w-full sm:w-52"
            buttonClassName="border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 shadow-2xs rounded-xl"
          />
        </div>

        {/* Preview count */}
        <div className="text-xs text-stone-400 font-normal">
          รายการที่จะโหลดเข้าแผ่นนับ: <span className="font-semibold text-stone-600">{filteredIngredients.length}</span> วัตถุดิบ
        </div>

        {resultMsg && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            resultMsg.type === 'success'
              ? 'bg-stone-100 text-stone-700 border border-stone-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {resultMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {resultMsg.text}
          </div>
        )}
      </div>
    );
  }

  // Active audit sheet
  return (
    <div className="space-y-4">
      {/* Header / Summary Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-stone-700" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">แผ่นตรวจนับสต็อกสิ้นวัน</h3>
            <p className="text-xs text-stone-400 font-normal mt-0.5">
              {rows.length} รายการ &nbsp;·&nbsp;
              <span className="text-amber-600 font-medium">{changedRows.length} รายการมีผลต่าง</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setIsInitialized(false); setRows([]); setResultMsg(null); }}
            className="text-stone-600 border-stone-200 hover:bg-stone-50 rounded-xl"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleReconcile}
            isLoading={isSubmitting}
            icon={<CheckCircle2 className="w-4 h-4" />}
            size="md"
            className="bg-stone-900 text-white hover:bg-stone-800 rounded-xl shadow-xs flex-1 sm:flex-none"
            disabled={isSubmitting}
          >
            ยืนยัน Reconcile &amp; Apply ({changedRows.length})
          </Button>
        </div>
      </div>

      {resultMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          resultMsg.type === 'success'
            ? 'bg-stone-100 text-stone-700 border border-stone-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {resultMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {resultMsg.text}
        </div>
      )}

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-stone-200">
                <TableHead className="text-stone-900 font-semibold whitespace-nowrap">ชื่อวัตถุดิบ</TableHead>
                <TableHead className="text-stone-900 font-semibold whitespace-nowrap">หมวดหมู่</TableHead>
                <TableHead className="text-stone-900 font-semibold whitespace-nowrap text-center">การตัดสต็อก</TableHead>
                <TableHead className="text-stone-900 font-semibold whitespace-nowrap text-right">ยอดในระบบ</TableHead>
                <TableHead className="text-stone-900 font-semibold whitespace-nowrap text-right">ยอดนับจริง</TableHead>
                <TableHead className="text-stone-900 font-semibold whitespace-nowrap text-right">ผลต่าง (Variance)</TableHead>
                <TableHead className="text-stone-900 font-semibold whitespace-nowrap">หมายเหตุ / สาเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const variance = getVariance(row);
                const hasVariance = Math.abs(variance) >= 0.001;
                const isNegative = variance < 0;
                const isPositive = variance > 0;

                return (
                  <TableRow
                    key={row.ingredient.id}
                    className={`transition-colors ${
                      hasVariance
                        ? isNegative
                          ? 'bg-rose-50/60 hover:bg-rose-50'
                          : 'bg-amber-50/60 hover:bg-amber-50'
                        : 'hover:bg-stone-50/80'
                    }`}
                  >
                    <TableCell>
                      <div className="font-medium text-stone-900 text-sm">{row.ingredient.name}</div>
                      {row.ingredient.supplier && (
                        <div className="text-xs text-stone-400">{row.ingredient.supplier}</div>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-stone-500 text-xs">{row.ingredient.category || '—'}</span>
                    </TableCell>

                    <TableCell className="text-center">
                      {row.ingredient.is_two_tier ? (
                        <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-900 border-amber-300">ระบบ 2 คลัง</Badge>
                      ) : row.ingredient.tracking_type === 'bulk_expense' ? (
                        <Badge variant="warning" size="sm">เปิดใช้ทั้งแพ็ค</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">ตัดตามแก้ว</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {row.ingredient.is_two_tier ? (
                        <div className="text-xs font-mono tabular-nums text-stone-700">
                          <div className="font-bold text-stone-900">{Number(row.ingredient.quantity).toLocaleString()} {row.ingredient.unit}</div>
                          <div className="text-[11px] text-stone-400 font-sans">
                            หลัง {row.ingredient.backstock_quantity ?? 0} {row.ingredient.package_unit || 'แพ็ค'} + บาร์ {Number(row.ingredient.bar_quantity ?? 0).toLocaleString()} {row.ingredient.unit}
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono tabular-nums text-sm text-stone-600 font-normal">
                          {row.ingredient.quantity} {row.ingredient.unit}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {row.ingredient.is_two_tier ? (
                        <div className="flex flex-col items-end gap-1 py-0.5">
                          <div className="flex items-center justify-end gap-1.5 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-stone-400 font-medium">หลัง:</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={row.countedBackstock}
                                onChange={(e) => updateTierRow(row.ingredient.id, 'countedBackstock', e.target.value)}
                                className="w-14 h-7 text-right text-xs font-mono tabular-nums px-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400 font-bold"
                              />
                              <span className="text-[11px] text-stone-500 font-sans">{row.ingredient.package_unit || 'แพ็ค'}</span>
                            </div>
                            <span className="text-stone-300 font-bold">+</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-stone-400 font-medium">บาร์:</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={row.countedBar}
                                onChange={(e) => updateTierRow(row.ingredient.id, 'countedBar', e.target.value)}
                                className="w-16 h-7 text-right text-xs font-mono tabular-nums px-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400 font-bold"
                              />
                              <span className="text-[11px] text-stone-500 font-sans">{row.ingredient.unit}</span>
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-stone-700 font-bold">
                            = {Number(row.countedQty || 0).toLocaleString()} {row.ingredient.unit}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.countedQty}
                              onChange={(e) => updateRow(row.ingredient.id, 'countedQty', e.target.value)}
                              className={`w-24 h-8 text-right text-sm font-mono tabular-nums px-2 rounded-lg border transition-colors focus:outline-none ${
                                hasVariance
                                  ? isNegative
                                    ? 'border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-400'
                                    : 'border-amber-300 bg-amber-50 text-amber-700 focus:border-amber-400'
                                  : 'border-stone-200 bg-stone-50 text-stone-800 focus:border-stone-400'
                              }`}
                            />
                            <span className="text-xs text-stone-400 whitespace-nowrap">{row.ingredient.unit}</span>
                          </div>
                          {Boolean(row.ingredient.package_unit && row.ingredient.package_size && row.ingredient.package_size > 0 && parseFloat(row.countedQty) >= 0) && (
                            <span className="text-[10px] text-stone-400 font-mono">
                              ≈ {(parseFloat(row.countedQty || '0') / row.ingredient.package_size!).toFixed(1)} {row.ingredient.package_unit}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {!hasVariance ? (
                        <span className="inline-flex items-center gap-1 text-stone-400 text-xs font-normal">
                          <Minus className="w-3.5 h-3.5" />
                          ตรง
                        </span>
                      ) : isNegative ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-mono tabular-nums text-sm font-medium">
                          <TrendingDown className="w-4 h-4" />
                          {variance.toFixed(2)} {row.ingredient.unit}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-mono tabular-nums text-sm font-medium">
                          <TrendingUp className="w-4 h-4" />
                          +{variance.toFixed(2)} {row.ingredient.unit}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <input
                        type="text"
                        placeholder={hasVariance ? 'เช่น ของเสีย, ทำหก, ลืมคีย์...' : ''}
                        value={row.note}
                        onChange={(e) => updateRow(row.ingredient.id, 'note', e.target.value)}
                        className="w-full min-w-[160px] h-8 text-xs px-2.5 rounded-lg border border-stone-200 bg-transparent text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors font-normal"
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
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-stone-900 text-white text-sm">
          <span className="font-normal">
            {changedRows.length} รายการมีผลต่าง —
            <span className="text-rose-300 ml-1">{changedRows.filter((r) => getVariance(r) < 0).length} รายการน้อยกว่าระบบ</span>
            <span className="text-amber-300 mx-1">·</span>
            <span className="text-amber-300">{changedRows.filter((r) => getVariance(r) > 0).length} รายการมากกว่าระบบ</span>
          </span>
          <Button
            onClick={handleReconcile}
            isLoading={isSubmitting}
            size="sm"
            className="bg-white text-stone-900 hover:bg-stone-100 rounded-lg"
            disabled={isSubmitting}
          >
            ยืนยันทั้งหมด
          </Button>
        </div>
      )}
    </div>
  );
}
