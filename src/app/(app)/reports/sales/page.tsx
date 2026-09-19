'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShoppingBag,
  Sparkles,
  Filter,
  Receipt,
  Minus,
  AlertCircle,
  ArrowDownLeft,
  Trash2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { SalesDonutCard } from '../../dashboard/components/SalesDonutCard';
import { WasteStatsResponse } from '@/types';

type PeriodFilter = '7days' | '30days' | 'year';

export default function SalesReportPage() {
  const { activeStore } = useAuth();
  const { dashboard, orders, fetchWasteStats, fetchRefundStats } = useStock();
  const [period, setPeriod] = useState<PeriodFilter>('7days');
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
  const [wasteStats, setWasteStats] = useState<WasteStatsResponse | null>(null);

  // Refund stats state
  // Refund stats state
  const [refundStats, setRefundStats] = useState<{
    gross_sales: number;
    refund_total: number;
    refund_count: number;
    mistake_total?: number;
    mistake_count?: number;
    net_sales: number;
    refunded_orders: Array<{
      id: number;
      order_number: string;
      total: number;
      status: string;
      refund_reason: string;
      refunded_at: string;
      refunded_by: string;
      created_at: string;
    }>;
  } | null>(null);

  // Mistake & Spoilage loss breakdown (ชงผิด / ทำหก / ยอดสูญเสีย)
  const mistakeStats = useMemo(() => {
    if (!refundStats?.refunded_orders) return { total: 0, count: 0, orders: [] };
    const orders = refundStats.refunded_orders.filter((o) => {
      const r = (o.refund_reason || '').toLowerCase();
      return r.includes('ชงผิด') || r.includes('หก') || r.includes('สูญเสีย') || r.includes('เสีย');
    });
    const total = refundStats.mistake_total ?? orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const count = refundStats.mistake_count ?? orders.length;
    return { total, count, orders };
  }, [refundStats]);

  const prevStoreIdRef = React.useRef<number | undefined>(activeStore?.id);
  useEffect(() => {
    if (prevStoreIdRef.current !== activeStore?.id) {
      setRefundStats(null);
      setWasteStats(null);
      prevStoreIdRef.current = activeStore?.id;
    }

    fetchRefundStats().then((data) => {
      if (data) setRefundStats(data);
    });

    const wastePeriod = period === 'year' ? 'all' : period === '30days' ? 'month' : 'week';
    fetchWasteStats(wastePeriod).then(setWasteStats);
  }, [fetchRefundStats, fetchWasteStats, period, activeStore?.id]);

  // Total 7 days sales
  const salesDataset = useMemo(() => {
    if (period === '30days' && dashboard.sales_monthly) {
      return dashboard.sales_monthly;
    }
    if (period === 'year' && dashboard.sales_yearly) {
      return dashboard.sales_yearly;
    }
    return dashboard.sales_7days || [];
  }, [period, dashboard]);

  const totalSales = salesDataset.reduce((sum, d) => sum + (Number(d.sales) || 0), 0);
  const totalCost = salesDataset.reduce((sum, d) => sum + (Number(d.cost) || 0), 0);
  const totalProfit = salesDataset.reduce((sum, d) => sum + (Number(d.profit) || 0), 0);
  const profitMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;

  // Basket Size (Average Order Value)
  const scopedOrders = useMemo(() => {
    if (!activeStore) return orders;
    return orders.filter((o) => !o.store_id || o.store_id === activeStore.id);
  }, [orders, activeStore]);

  const totalOrderCount = scopedOrders.length;
  const avgBasketSize =
    totalOrderCount > 0
      ? Math.round(totalSales / totalOrderCount)
      : 0;

  // Category breakdown calculation
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    (dashboard.menu_profitability || []).forEach((item) => {
      if ((item.sales_count || 0) > 0) {
        const cat = item.category || 'ทั่วไป';
        const revenue = (item.price || 0) * item.sales_count;
        map.set(cat, (map.get(cat) || 0) + revenue);
      }
    });

    if (map.size === 0) {
      return [];
    }

    const totalRev = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      percent: totalRev > 0 ? Math.round((value / totalRev) * 100) : 0,
    }));
  }, [dashboard.menu_profitability]);

  // AI Executive Summary Generator
  const handleGenerateSummary = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      const mistakeNote =
        mistakeStats.count > 0
          ? ` มียอดสูญเสียจากการชงผิด/หก ${mistakeStats.count} รายการ รวมมูลค่า -฿${mistakeStats.total.toLocaleString()} ซึ่งระบบได้นำวัตถุดิบคืนเข้าสต็อกและตัดเป็นยอดสูญเสียเรียบร้อย`
          : '';

      if (totalSales === 0) {
        setExecutiveSummary(
          mistakeStats.count > 0
            ? `ยังไม่มีคำสั่งซื้อที่ปิดยอดขายสำเร็จในช่วงเวลานี้${mistakeNote}`
            : 'ยังไม่มีคำสั่งซื้อและยอดขายในช่วงเวลานี้ เมื่อเริ่มมีรายการขายในระบบ ระบบ AI จะประมวลผลอินไซต์และช่วงเวลาขายดีให้อัตโนมัติ'
        );
      } else {
        setExecutiveSummary(
          `ภาพรวมยอดขายช่วงเวลาที่เลือกมียอดขายรวม ฿${totalSales.toLocaleString()} และกำไรสุทธิ ฿${totalProfit.toLocaleString()} (มาร์จิ้น ${profitMargin}%) โดยมีคำสั่งซื้อทั้งหมด ${totalOrderCount} บิล ค่าเฉลี่ยต่อบิล (Basket Size) อยู่ที่ ฿${avgBasketSize}.${mistakeNote}`
        );
      }
      setAiAnalyzing(false);
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="รายงานยอดขาย" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">
        {/* Filter Period Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
            <Filter className="w-4 h-4 text-stone-500" />
            <span>ช่วงเวลา:</span>
          </div>

          <div className="inline-flex rounded-xl border border-stone-200/80 p-1 bg-stone-100 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setPeriod('7days')}
              className={`h-9 px-3.5 text-xs rounded-lg transition-all cursor-pointer font-medium whitespace-nowrap ${
                period === '7days'
                  ? 'bg-stone-900 text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              7 วันล่าสุด
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`h-9 px-3.5 text-xs rounded-lg transition-all cursor-pointer font-medium whitespace-nowrap ${
                period === '30days'
                  ? 'bg-stone-900 text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              30 วัน (รายสัปดาห์)
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`h-9 px-3.5 text-xs rounded-lg transition-all cursor-pointer font-medium whitespace-nowrap ${
                period === 'year'
                  ? 'bg-stone-900 text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              12 เดือน (รายปี)
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500">ยอดขายรวม</span>
              <BarChart3 className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-bold text-stone-900 font-mono tabular-nums">฿{(refundStats?.gross_sales ?? totalSales).toLocaleString()}</div>
            <div className="text-xs text-stone-400 mt-1 font-mono">{totalOrderCount} บิล</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500">กำไรสุทธิ</span>
              <TrendingUp className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-bold text-stone-900 font-mono tabular-nums">฿{totalProfit.toLocaleString()}</div>
            <div className="text-xs text-stone-500 mt-1 font-semibold">Margin {profitMargin}%</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-rose-500">ยอดคืนเงิน</span>
              <ArrowDownLeft className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">-฿{Math.max(0, (refundStats?.refund_total ?? 0) - mistakeStats.total).toLocaleString()}</div>
            <div className="text-xs text-rose-400 mt-1 font-mono">{Math.max(0, (refundStats?.refund_count ?? 0) - mistakeStats.count)} บิล</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500">ยอดขายสุทธิ</span>
              <Receipt className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-bold text-stone-900 font-mono tabular-nums">฿{(refundStats?.net_sales ?? totalSales).toLocaleString()}</div>
            <div className="text-xs text-stone-400 mt-1">หลังหักยอดคืน</div>
          </div>
        </div>

        {/* AI Executive Summary */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#78350f]" />
              <h4 className="font-semibold text-stone-900 text-sm">AI สรุปยอดขาย</h4>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={aiAnalyzing}
              onClick={handleGenerateSummary}
              icon={<Sparkles className="w-3.5 h-3.5 text-[#78350f]" />}
              className="shrink-0 shadow-2xs rounded-xl border-stone-200 text-stone-800 hover:bg-stone-50 text-xs"
            >
              {executiveSummary ? 'วิเคราะห์ใหม่' : 'สร้างสรุป'}
            </Button>
          </div>

          {executiveSummary ? (
            <div className="p-4 rounded-xl bg-[#faf9f5] border border-stone-200 text-xs text-stone-800 leading-relaxed">
              {executiveSummary}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-400">
              กดปุ่ม &ldquo;สร้างสรุป&rdquo; เพื่อให้ระบบประมวลผลไฮไลต์ยอดขาย
            </div>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-stone-600" />
                ยอดขาย & กำไร ({period === '7days' ? '7 วัน' : period === '30days' ? 'รายสัปดาห์' : 'รายเดือน'})
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-stone-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-900 inline-block"></span> ยอดขาย
                </span>
                <span className="flex items-center gap-1.5 text-stone-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#78350f] inline-block"></span> กำไร
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesDataset}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="day" stroke="#78716c" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#78716c"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v) => `฿${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `฿${Number(val).toLocaleString()}`,
                      name === 'sales' ? 'ยอดขาย' : name === 'profit' ? 'กำไร' : 'ต้นทุน',
                    ]}
                    contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', color: '#fff' }}
                    wrapperClassName="text-xs"
                  />
                  <Bar dataKey="sales" fill="#1c1917" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="profit" fill="#78350f" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue & Cost Breakdown Donut Card (4 Cols) */}
          <div className="lg:col-span-4">
            <SalesDonutCard
              sales7days={dashboard.sales_7days}
              totalSales={totalSales}
              totalCost={totalCost}
              totalProfit={totalProfit}
            />
          </div>
        </div>

        {/* Hourly Order Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-600" />
              การขายรายชั่วโมง
            </h3>
            {totalOrderCount > 0 && (
              <span className="text-xs text-stone-500 font-mono">{totalOrderCount} บิล</span>
            )}
          </div>

          <div className="h-60 w-full pt-2">
            {totalOrderCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 text-xs space-y-1">
                <Clock className="w-8 h-8 opacity-30 text-stone-400 mb-1" />
                <p className="font-medium text-stone-600">ยังไม่มีสถิติคำสั่งซื้อรายชั่วโมง</p>
                <p className="text-stone-400">เมื่อเริ่มเปิดบิลขาย ระบบจะประมวลผลช่วงเวลาที่มีการสั่งซื้อให้อัตโนมัติ</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="hour" stroke="#78716c" fontSize={12} tickLine={false} />
                  <YAxis stroke="#78716c" fontSize={12} tickLine={false} />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#1c1917"
                    strokeWidth={2}
                    fillOpacity={0.2}
                    fill="#1c1917"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Refunded Orders Table */}
        {refundStats && refundStats.refund_count > 0 && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 text-sm">รายการบิลที่ถูกคืนเงิน / ยกเลิก</h3>
                  <p className="text-xs text-stone-400 font-normal mt-0.5">
                    {refundStats.refund_count} บิล — รวม -฿{refundStats.refund_total.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Loss / Refund summary pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {mistakeStats.count > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>ชงผิด/สูญเสีย {mistakeStats.count} รายการ (-฿{mistakeStats.total.toLocaleString()})</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200/80 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                  <span>คืนเงินลูกค้า {Math.max(0, refundStats.refund_count - mistakeStats.count)} รายการ</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left pb-2 text-xs text-stone-500 font-normal">เลขที่บิล</th>
                    <th className="text-left pb-2 text-xs text-stone-500 font-normal">เวลา</th>
                    <th className="text-right pb-2 text-xs text-stone-500 font-normal">มูลค่าบิล</th>
                    <th className="text-left pb-2 text-xs text-stone-500 font-normal pl-3">เหตุผล / ประเภท</th>
                    <th className="text-left pb-2 text-xs text-stone-500 font-normal">ผู้ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {refundStats.refunded_orders.map((order) => {
                    const reason = order.refund_reason || '';
                    const isMistake =
                      reason.includes('ชงผิด') ||
                      reason.includes('หก') ||
                      reason.includes('สูญเสีย') ||
                      reason.includes('เสีย');

                    return (
                      <tr key={order.id} className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
                        <td className="py-2.5 font-mono text-xs text-stone-700 font-medium">{order.order_number}</td>
                        <td className="py-2.5 text-xs text-stone-500 font-normal">
                          {new Date(order.refunded_at || order.created_at).toLocaleString('th-TH', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 text-right font-mono text-xs text-rose-600 font-semibold tabular-nums">
                          -฿{Number(order.total).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-xs pl-3">
                          <div className="flex items-center gap-2">
                            {isMistake ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                ชงผิด (ยอดสูญเสีย)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                                คืนเงินลูกค้า
                              </span>
                            )}
                            <span className="text-stone-600">{reason || '—'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-xs text-stone-400 font-normal">
                          {order.refunded_by || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
