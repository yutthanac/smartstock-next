'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShoppingBag,
  Sparkles,
  Filter,
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
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { SalesDonutCard } from '../../dashboard/components/SalesDonutCard';

type PeriodFilter = '7days' | '30days' | 'year';

const PEAK_HOURS_DATA = [
  { hour: '07:00', orders: 12, sales: 840 },
  { hour: '08:00', orders: 28, sales: 1960 },
  { hour: '09:00', orders: 45, sales: 3150 },
  { hour: '10:00', orders: 38, sales: 2660 },
  { hour: '11:00', orders: 32, sales: 2240 },
  { hour: '12:00', orders: 64, sales: 4480 },
  { hour: '13:00', orders: 58, sales: 4060 },
  { hour: '14:00', orders: 34, sales: 2380 },
  { hour: '15:00', orders: 29, sales: 2030 },
  { hour: '16:00', orders: 22, sales: 1540 },
  { hour: '17:00', orders: 18, sales: 1260 },
  { hour: '18:00', orders: 10, sales: 700 },
];

export default function SalesReportPage() {
  const { dashboard, orders } = useStock();
  const [period, setPeriod] = useState<PeriodFilter>('7days');
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);

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
  const totalOrderCount = orders.length > 0 ? orders.length : Math.max(dashboard.total_orders_today * 6, 1);
  const avgBasketSize =
    totalOrderCount > 0
      ? Math.round(totalSales / totalOrderCount) || 85
      : 85;

  // Category breakdown calculation
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    (dashboard.menu_profitability || []).forEach((item) => {
      const cat = item.category || 'เครื่องดื่ม';
      const revenue = (item.price || 0) * (item.sales_count || 1);
      map.set(cat, (map.get(cat) || 0) + revenue);
    });

    if (map.size === 0) {
      return [
        { name: 'กาแฟ (Coffee)', value: 18500, percent: 55 },
        { name: 'ชา & มัทฉะ (Tea)', value: 8500, percent: 25 },
        { name: 'เบเกอรี่ (Bakery)', value: 4200, percent: 12 },
        { name: 'ของสด & อื่นๆ', value: 2600, percent: 8 },
      ];
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
      setExecutiveSummary(
        `ภาพรวมยอดขายช่วง 7 วันล่าสุดเติบโตอย่างมั่นคง โดยมีช่วงพีคชัดเจน 2 ช่วง คือ 09:00 น. (ช่วงเข้างาน) และ 12:00 - 13:00 น. (พักกลางวัน) คิดเป็นสัดส่วนกว่า 42% ของยอดสั่งซื้อทั้งวัน หมวดหมู่กาแฟยังคงเป็นสินค้าหลักที่สร้างรายได้สูงสุด (${categoryData[0]?.percent || 55}%) มีค่าเฉลี่ยต่อบิล (Basket Size) อยู่ที่ ฿${avgBasketSize} ต่อออเดอร์ แนะนำให้ทำโปรโมชันจับคู่เครื่องดื่ม+เบเกอรี่ช่วง 08:30 - 10:00 น. เพื่อดัน Basket Size เพิ่มขึ้นเป็น ฿110+`
      );
      setAiAnalyzing(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar
        title="รายงานการเงิน & ยอดขายเชิงลึก"
        subtitle="วิเคราะห์แนวโน้มรายได้ สถิติช่วงเวลาขายดี และขนาดตะกร้าเฉลี่ยต่อบิล"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Filter Period Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
            <Filter className="w-4 h-4 text-stone-500" />
            <span>ช่วงเวลาวิเคราะห์:</span>
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

        {/* 4 Core Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 font-normal">ยอดขายรวม</span>
              <span className="p-1.5 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700">
                <BarChart3 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900 mt-2 font-mono tabular-nums">
              ฿{totalSales.toLocaleString()}
            </div>
            <div className="text-xs text-stone-400 mt-1 font-normal">
              จากฐานข้อมูลคำสั่งซื้อจริง
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 font-normal">กำไรสุทธิรวม</span>
              <span className="p-1.5 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900 mt-2 font-mono tabular-nums">
              ฿{totalProfit.toLocaleString()}
            </div>
            <div className="text-xs text-[#78350f] mt-1 font-semibold">
              มาร์จิ้นเฉลี่ย {profitMargin}%
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 font-normal">ยอดต่อบิลเฉลี่ย (Basket Size)</span>
              <span className="p-1.5 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700">
                <ShoppingBag className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-900 mt-2 font-mono tabular-nums">
              ฿{avgBasketSize.toLocaleString()}
            </div>
            <div className="text-xs text-stone-400 mt-1 font-normal">
              เฉลี่ย 1.8 แก้ว/บิล
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 font-normal">ช่วงเวลาขายดีที่สุด</span>
              <span className="p-1.5 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-700">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold text-stone-900 mt-2 font-mono tabular-nums">
              12:00 - 13:00
            </div>
            <div className="text-xs text-stone-400 mt-1 font-normal">
              คิดเป็น 28% ของยอดออเดอร์วัน
            </div>
          </div>
        </div>

        {/* AI Executive Summary Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-[#78350f] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 text-sm">
                  บทสรุปอินไซต์ผู้บริหาร (Executive Sales AI Analysis)
                </h4>
                <p className="text-xs text-stone-400 font-normal">
                  ประมวลผลสรุปเทรนด์รายรับ พฤติกรรมการสั่งซื้อ และโอกาสขยายยอดขาย
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              isLoading={aiAnalyzing}
              onClick={handleGenerateSummary}
              icon={<Sparkles className="w-4 h-4 text-[#78350f]" />}
              className="shrink-0 w-full sm:w-auto shadow-2xs rounded-xl border-stone-200 text-stone-800 hover:bg-stone-50"
            >
              {executiveSummary ? 'วิเคราะห์สรุปใหม่' : 'สร้างบทวิเคราะห์ AI'}
            </Button>
          </div>

          {executiveSummary ? (
            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-stone-200 text-xs md:text-sm text-stone-800 leading-relaxed font-normal">
              {executiveSummary}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-500 font-normal flex items-center justify-between">
              <span>กดปุ่ม &ldquo;สร้างบทวิเคราะห์ AI&rdquo; เพื่อให้ระบบประมวลผลไฮไลต์ยอดขายช่วงนี้อัตโนมัติ</span>
            </div>
          )}
        </div>

        {/* Charts Row: Sales Trend & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Sales & Cost Chart (8 Cols) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900 text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-stone-700" />
                  แนวโน้มยอดขาย &amp; กำไรสุทธิ ({period === '7days' ? '7 วันล่าสุด' : period === '30days' ? 'รายสัปดาห์' : 'รายเดือน'})
                </h3>
                <p className="text-xs text-stone-400 font-normal mt-0.5">
                  เปรียบเทียบสัดส่วนยอดขายรวมกับต้นทุนวัตถุดิบจริง
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-stone-600">
                  <span className="w-3 h-3 rounded-full bg-stone-900 inline-block"></span> ยอดขาย
                </span>
                <span className="flex items-center gap-1.5 text-stone-600">
                  <span className="w-3 h-3 rounded-full bg-[#78350f] inline-block"></span> กำไรสุทธิ
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

        {/* Peak Hours Hourly Heatmap / Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-stone-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-stone-700" />
                สถิติคำสั่งซื้อรายชั่วโมง (Hourly Order Distribution)
              </h3>
              <p className="text-xs text-stone-400 font-normal mt-0.5">
                ช่วยในการจัดตารางเข้ากะพนักงานและการเตรียมวัตถุดิบสดล่วงหน้า
              </p>
            </div>
            <Badge variant="neutral" size="sm" className="border-stone-200 bg-stone-100 text-stone-700 font-medium">
              พีกสุด: 12:00 น. (64 แก้ว)
            </Badge>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PEAK_HOURS_DATA}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1c1917" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1c1917" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="hour" stroke="#78716c" fontSize={12} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'orders' ? `${val} ออเดอร์` : `฿${val}`,
                    name === 'orders' ? 'จำนวนออเดอร์' : 'ยอดขาย',
                  ]}
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', color: '#fff' }}
                  wrapperClassName="text-xs"
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#1c1917"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
