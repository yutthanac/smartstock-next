'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  Clock,
  ChevronDown,
  Edit,
  XCircle,
  AlertTriangle,
  Save,
  X,
  Check
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';
import { Topbar } from '@/components/Topbar';
import { TableSkeleton } from '@/components/Skeleton';
import { Order } from '@/types';

const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const monthNamesTh = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

type FilterMode = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';

export default function OrdersHistoryPage() {
  const { token, activeStore } = useAuth();
  const { orders: contextOrders, isLoading: contextLoading, cancelOrder, updateOrder } = useStock();

  // Selected date / mode state
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  // Status Tab Filter: 'all' | 'completed' | 'cancelled'
  const [statusTab, setStatusTab] = useState<'all' | 'completed' | 'cancelled'>('all');

  // Calendar popover / modal toggle
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'qr_promptpay' | 'credit_card'>('all');

  // Backend fetched orders for specific date
  const [fetchedOrders, setFetchedOrders] = useState<Order[] | null>(null);
  const [isFetchingDate, setIsFetchingDate] = useState(false);

  // Modal states for Cancel & Edit
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'qr_promptpay' | 'credit_card'>('cash');
  const [editItemNotes, setEditItemNotes] = useState<Record<string | number, string>>({});
  const [activeEditItemIndex, setActiveEditItemIndex] = useState<number>(0);

  // Parsed item options for the POS-style editor
  interface ParsedItemOption {
    temperature: string;
    sweetness: string;
    diningOption: string;
    extraShots: number;
    customNote: string;
  }
  const [itemParsedOptions, setItemParsedOptions] = useState<Record<string | number, ParsedItemOption>>({});

  const parseOptionNote = (rawNote: string = ''): ParsedItemOption => {
    const note = rawNote || '';
    let temperature = 'เย็น';
    if (note.includes('ร้อน')) temperature = 'ร้อน';
    else if (note.includes('ปั่น')) temperature = 'ปั่น (+10฿)';

    let sweetness = 'หวาน (100%)';
    if (note.includes('ไม่หวาน') || note.includes('0%')) sweetness = 'ไม่หวาน';
    else if (note.includes('หวานน้อย') || note.includes('50%')) sweetness = 'หวานน้อย';
    else if (note.includes('หวานมาก') || note.includes('125%')) sweetness = 'หวานมาก';

    let diningOption = 'ทานที่ร้าน';
    if (note.includes('กลับบ้าน') || note.includes('Takeaway') || note.includes('Take away')) {
      diningOption = 'กลับบ้าน';
    }

    let extraShots = 0;
    const shotMatch = note.match(/(?:เพิ่ม\s*|\+)(\d+)\s*ช็อต/);
    if (shotMatch && shotMatch[1]) {
      extraShots = parseInt(shotMatch[1], 10) || 0;
    }

    // Extract remaining custom tags
    const cleanTokens = note
      .split(/[,/]/)
      .map((t) => t.trim())
      .filter((t) => {
        if (!t) return false;
        if (['เย็น', 'ร้อน', 'ปั่น (+10฿)', 'ปั่น'].includes(t)) return false;
        if (['ไม่หวาน', 'หวานน้อย', 'หวาน', 'หวานมาก', 'หวาน (100%)', 'หวาน 100%'].includes(t)) return false;
        if (['ทานที่ร้าน', 'กลับบ้าน', '🥤 กลับบ้าน'].includes(t)) return false;
        if (t.includes('ช็อต')) return false;
        return true;
      });

    return {
      temperature,
      sweetness,
      diningOption,
      extraShots,
      customNote: cleanTokens.join(', '),
    };
  };

  const serializeOptionNote = (opts: ParsedItemOption): string => {
    const parts: string[] = [];
    if (opts.temperature) parts.push(opts.temperature);
    if (opts.sweetness && opts.sweetness !== 'หวาน (100%)') parts.push(opts.sweetness);
    if (opts.extraShots > 0) parts.push(`เพิ่ม ${opts.extraShots} ช็อต`);
    if (opts.diningOption === 'กลับบ้าน') parts.push('🥤 กลับบ้าน');
    if (opts.customNote.trim()) parts.push(opts.customNote.trim());
    return parts.join(', ');
  };

  const fetchOrdersByFilter = async () => {
    setIsFetchingDate(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      let url = `${apiBaseUrl}/pos/orders`;
      const queryParams: string[] = [];

      if (filterMode === 'today' || filterMode === 'yesterday' || filterMode === 'custom') {
        queryParams.push(`date=${selectedDate}`);
      } else if (filterMode === 'week') {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        queryParams.push(`start_date=${startStr}&end_date=${endStr}&limit=500`);
      } else if (filterMode === 'month') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        queryParams.push(`start_date=${startStr}&end_date=${endStr}&limit=500`);
      } else if (filterMode === 'all') {
        queryParams.push(`all=true`);
      }

      if (activeStore) {
        queryParams.push(`store_id=${activeStore.id}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (activeStore) headers['X-Store-ID'] = String(activeStore.id);

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setFetchedOrders(data);
      } else {
        setFetchedOrders(null);
      }
    } catch (err) {
      console.warn('Could not fetch date-specific orders, falling back to context orders', err);
      setFetchedOrders(null);
    } finally {
      setIsFetchingDate(false);
    }
  };

  // Fetch orders from backend when date, filter, or activeStore changes
  useEffect(() => {
    fetchOrdersByFilter();
  }, [filterMode, selectedDate, activeStore?.id]);

  // Open Edit Modal
  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setEditPaymentMethod(order.payment_method || 'cash');
    setActiveEditItemIndex(0);

    const initialNotes: Record<string | number, string> = {};
    const initialParsed: Record<string | number, ParsedItemOption> = {};

    order.items?.forEach((item, idx) => {
      const key = item.id ?? idx;
      const noteStr = item.note || '';
      initialNotes[key] = noteStr;
      initialParsed[key] = parseOptionNote(noteStr);
    });

    setEditItemNotes(initialNotes);
    setItemParsedOptions(initialParsed);
  };

  // Update item options in real time
  const handleUpdateItemOption = (
    key: string | number,
    updater: (prev: ParsedItemOption) => ParsedItemOption
  ) => {
    setItemParsedOptions((prevMap) => {
      const current = prevMap[key] || parseOptionNote('');
      const updated = updater(current);
      const newSerialized = serializeOptionNote(updated);

      setEditItemNotes((prevNotes) => ({
        ...prevNotes,
        [key]: newSerialized,
      }));

      return {
        ...prevMap,
        [key]: updated,
      };
    });
  };

  // Toggle quick tag in edit modal
  const handleToggleEditTag = (key: string | number, tag: string) => {
    handleUpdateItemOption(key, (curr) => {
      const currentTags = curr.customNote
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      let newTags: string[];
      if (currentTags.includes(tag)) {
        newTags = currentTags.filter((t) => t !== tag);
      } else {
        newTags = [...currentTags, tag];
      }

      return {
        ...curr,
        customNote: newTags.join(', '),
      };
    });
  };

  // Save Edit Order
  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    setIsSubmitting(true);
    try {
      const itemsPayload = Object.entries(editItemNotes).map(([id, note]) => ({
        id: Number(id),
        note: note,
      }));

      const success = await updateOrder(editingOrder.id, {
        payment_method: editPaymentMethod,
        items: itemsPayload,
      });

      if (success) {
        await fetchOrdersByFilter();
        setEditingOrder(null);
      } else {
        alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกการแก้ไขได้');
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Cancel / Refund Order
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setIsSubmitting(true);
    try {
      const success = await cancelOrder(cancellingOrder.id, refundReason.trim() || undefined);
      if (success) {
        await fetchOrdersByFilter();
        setCancellingOrder(null);
        setRefundReason('');
      } else {
        alert('เกิดข้อผิดพลาด ไม่สามารถยกเลิกคำสั่งซื้อได้');
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Base list of orders to filter
  const activeOrdersList = useMemo(() => {
    let rawList = fetchedOrders !== null ? fetchedOrders : contextOrders;

    // Filter by activeStore to prevent any data leak
    if (activeStore) {
      rawList = rawList.filter((order) => !order.store_id || order.store_id === activeStore.id);
    }

    if (fetchedOrders !== null) {
      return rawList;
    }
    // Context orders fallback client filter
    if (filterMode === 'all') return rawList;

    return rawList.filter((order) => {
      const orderDate = (order.created_at || '').substring(0, 10);
      if (filterMode === 'today' || filterMode === 'yesterday' || filterMode === 'custom') {
        return orderDate === selectedDate;
      }
      return true;
    });
  }, [fetchedOrders, contextOrders, filterMode, selectedDate, activeStore]);

  // Apply search, payment method filter, and status tab filter
  const filteredOrders = useMemo(() => {
    return activeOrdersList.filter((order) => {
      // Status tab filter: 'all' | 'completed' | 'cancelled'
      if (statusTab === 'completed' && order.status === 'cancelled') {
        return false;
      }
      if (statusTab === 'cancelled' && order.status !== 'cancelled') {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'all' && order.payment_method !== paymentFilter) {
        return false;
      }

      // Search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();

      const matchNumber = order.order_number.toLowerCase().includes(query);
      const matchTable = (order.table_no || '').toLowerCase().includes(query);
      const matchItems = order.items.some((item) => item.name.toLowerCase().includes(query));

      return matchNumber || matchTable || matchItems;
    });
  }, [activeOrdersList, searchQuery, paymentFilter, statusTab]);

  // Overall counts for tabs
  const tabCounts = useMemo(() => {
    const totalCount = activeOrdersList.length;
    const completedCount = activeOrdersList.filter((o) => o.status !== 'cancelled').length;
    const cancelledCount = activeOrdersList.filter((o) => o.status === 'cancelled').length;
    const cancelledAmount = activeOrdersList
      .filter((o) => o.status === 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return {
      totalCount,
      completedCount,
      cancelledCount,
      cancelledAmount,
    };
  }, [activeOrdersList]);

  // Calculate statistics for the selected view
  const stats = useMemo(() => {
    // Only calculate active revenue from non-cancelled orders unless viewing cancelled tab
    const completedOrders = filteredOrders.filter((o) => o.status !== 'cancelled');
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled');

    const totalRevenue = completedOrders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
    const refundedRevenue = cancelledOrders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);

    const completedBills = completedOrders.length;
    const cancelledBills = cancelledOrders.length;
    const totalBills = filteredOrders.length;
    const avgTicket = completedBills > 0 ? totalRevenue / completedBills : 0;

    let cashCount = 0;
    let qrCount = 0;
    let cardCount = 0;

    completedOrders.forEach((o) => {
      if (o.payment_method === 'cash') cashCount++;
      else if (o.payment_method === 'qr_promptpay') qrCount++;
      else if (o.payment_method === 'credit_card') cardCount++;
    });

    return {
      totalRevenue,
      refundedRevenue,
      completedBills,
      cancelledBills,
      totalBills,
      avgTicket,
      cashCount,
      qrCount,
      cardCount,
    };
  }, [filteredOrders]);

  // Helper date buttons
  const handleSelectQuick = (mode: FilterMode) => {
    setFilterMode(mode);
    const now = new Date();
    if (mode === 'today') {
      setSelectedDate(now.toISOString().split('T')[0]);
      setCurrentCalendarMonth(new Date());
    } else if (mode === 'yesterday') {
      const yest = new Date();
      yest.setDate(now.getDate() - 1);
      setSelectedDate(yest.toISOString().split('T')[0]);
      setCurrentCalendarMonth(yest);
    }
  };

  // Calendar rendering logic
  const calYear = currentCalendarMonth.getFullYear();
  const calMonth = currentCalendarMonth.getMonth();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(new Date(calYear, calMonth + 1, 1));
  };

  const handleDaySelect = (dayNum: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setFilterMode('custom');
    setIsCalendarOpen(false);
  };

  const formattedDateTitle = useMemo(() => {
    if (filterMode === 'all') return 'ประวัติออเดอร์ทั้งหมดในระบบ';
    if (filterMode === 'week') return 'ประวัติออเดอร์ 7 วันย้อนหลัง';
    if (filterMode === 'month') return `ประวัติออเดอร์ประจำเดือน ${monthNamesTh[calMonth]} ${calYear + 543}`;

    // Specific date
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const isToday = new Date().toISOString().split('T')[0] === selectedDate;
      const isYest = (() => {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        return yest.toISOString().split('T')[0] === selectedDate;
      })();

      let prefix = '';
      if (isToday) prefix = 'วันนี้ - ';
      else if (isYest) prefix = 'เมื่อวาน - ';

      return `${prefix}วันที่ ${d} ${monthNamesTh[m - 1]} ${y + 543}`;
    } catch {
      return selectedDate;
    }
  }, [filterMode, selectedDate, calMonth, calYear]);

  const isLoading = contextLoading || isFetchingDate;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar
        title="ประวัติคำสั่งซื้อ (Order History)"
        subtitle="ตรวจสอบบิลย้อนหลัง สรุปยอดขายรายวัน และประวัติการชำระเงิน"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Filter Bar & Calendar Selector */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Quick Pills */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectQuick('today')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'today'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuick('yesterday')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'yesterday'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                เมื่อวาน
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('week')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'week'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'month'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                เดือนนี้
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                ทั้งหมด
              </button>
            </div>

            {/* Interactive Calendar Trigger & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  filterMode === 'custom' || isCalendarOpen
                    ? 'bg-[#f5efe6] border-[#e8ded0] text-[#78350f] ring-2 ring-[#78350f]/15'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <CalendarIcon className="w-4 h-4 text-[#78350f]" />
                <span>{formattedDateTitle}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Calendar Picker Modal */}
              {isCalendarOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsCalendarOpen(false)}
                  />
                  <div className="absolute right-0 md:left-auto mt-2 z-40 w-[310px] bg-white rounded-2xl border border-stone-200/90 shadow-xl p-3.5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header Month / Year controls */}
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
                        title="เดือนก่อนหน้า"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="text-xs font-bold text-stone-800">
                        {monthNamesTh[calMonth]} {calYear + 543}
                      </div>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
                        title="เดือนถัดไป"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Day Names Grid */}
                    <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
                      {dayNames.map((d, i) => (
                        <div key={i} className="text-[10px] font-semibold text-stone-400 py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {Array(firstDayOfWeek)
                        .fill(null)
                        .map((_, i) => (
                          <div key={`empty-${i}`} className="h-8 w-8" />
                        ))}
                      {Array(daysInMonth)
                        .fill(null)
                        .map((_, i) => {
                          const dayNum = i + 1;
                          const thisDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const isToday = new Date().toISOString().split('T')[0] === thisDateStr;
                          const isSelected = selectedDate === thisDateStr && (filterMode === 'custom' || filterMode === 'today' || filterMode === 'yesterday');

                          return (
                            <button
                              key={`d-${dayNum}`}
                              type="button"
                              onClick={() => handleDaySelect(dayNum)}
                              className={`h-8 w-8 rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-stone-900 text-white font-bold shadow-xs scale-105'
                                  : isToday
                                  ? 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] font-bold hover:bg-[#ebdcc8]'
                                  : 'text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              {dayNum}
                            </button>
                          );
                        })}
                    </div>

                    <div className="pt-3 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          setSelectedDate(today.toISOString().split('T')[0]);
                          setCurrentCalendarMonth(today);
                          setFilterMode('today');
                          setIsCalendarOpen(false);
                        }}
                        className="text-[#78350f] font-semibold hover:underline cursor-pointer"
                      >
                        กลับไปดูวันนี้
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCalendarOpen(false)}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        ปิด
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* KPI Summary Cards for the selected period */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#faf9f5] rounded-xl p-3.5 border border-stone-200/70 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>ยอดขายสุทธิ</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">สำเร็จ</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-extrabold text-stone-900 font-mono tabular-nums">
                  ฿{stats.totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="bg-[#faf9f5] rounded-xl p-3.5 border border-stone-200/70 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>ยอดคืนเงิน (Refunds)</span>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">ยกเลิกแล้ว</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-extrabold text-rose-600 font-mono tabular-nums">
                  ฿{stats.refundedRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-stone-400 font-normal">({stats.cancelledBills} บิล)</span>
              </div>
            </div>

            <div className="bg-[#faf9f5] rounded-xl p-3.5 border border-stone-200/70 flex flex-col justify-between">
              <span className="text-xs text-stone-500 font-medium">เฉลี่ยต่อบิลสำเร็จ</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-extrabold text-[#78350f] font-mono tabular-nums">
                  ฿{stats.avgTicket.toFixed(2)}
                </span>
                <span className="text-xs text-stone-400 font-normal">({stats.completedBills} บิล)</span>
              </div>
            </div>

            <div className="bg-[#faf9f5] rounded-xl p-3.5 border border-stone-200/70 flex flex-col justify-between">
              <span className="text-xs text-stone-500 font-medium">ช่องทางชำระเงิน (บิลสำเร็จ)</span>
              <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-stone-700">
                <span className="inline-flex items-center gap-1" title="เงินสด">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" /> {stats.cashCount}
                </span>
                <span className="inline-flex items-center gap-1" title="QR Code PromptPay">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" /> {stats.qrCount}
                </span>
                <span className="inline-flex items-center gap-1" title="บัตรเครดิต">
                  <CreditCard className="w-3.5 h-3.5 text-purple-600" /> {stats.cardCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusTab === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>บิลทั้งหมด</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono bg-stone-200/70 text-stone-700">
                  {tabCounts.totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusTab === 'completed'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ชำระสำเร็จ</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-100/70 text-emerald-800">
                  {tabCounts.completedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusTab('cancelled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusTab === 'cancelled'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-stone-600 hover:text-rose-700'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>รายการที่ยกเลิก & คืนเงิน</span>
                {tabCounts.cancelledCount > 0 && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono bg-rose-100 text-rose-700 font-bold">
                    {tabCounts.cancelledCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search & Payment Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาเลขบิล, ชื่อสินค้า..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                />
              </div>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="py-1.5 px-3 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 cursor-pointer"
              >
                <option value="all">วิธีชำระทั้งหมด</option>
                <option value="cash">เงินสด (Cash)</option>
                <option value="qr_promptpay">QR PromptPay</option>
                <option value="credit_card">บัตรเครดิต</option>
              </select>
            </div>
          </div>

          {/* Table Header Details */}
          <div className="flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-stone-500" />
              <span>
                {statusTab === 'all' && 'รายการคำสั่งซื้อทั้งหมด'}
                {statusTab === 'completed' && 'รายการคำสั่งซื้อที่ชำระสำเร็จ'}
                {statusTab === 'cancelled' && 'รายการคำสั่งซื้อที่ยกเลิก & คืนเงินแล้ว'}
                {' '}({formattedDateTitle}){' '}
                <span className="text-stone-300">|</span>{' '}
                <span className="font-mono tabular-nums font-bold text-stone-900">{filteredOrders.length}</span> บิล
              </span>
            </div>
            {statusTab === 'cancelled' && tabCounts.cancelledAmount > 0 && (
              <span className="text-rose-700 font-semibold text-xs">
                ยอดเงินที่คืนลูกค้าทั้งหมด: ฿{tabCounts.cancelledAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="bg-transparent border-b border-stone-200 text-stone-900 text-xs font-semibold">
                  <th className="py-3 px-4 whitespace-nowrap min-w-[150px]">เลขที่บิล</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[130px]">วัน & เวลา</th>
                  <th className="py-3 px-4 min-w-[240px]">รายการสินค้า / เครื่องดื่ม</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap min-w-[90px]">ยอดรวม</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">วิธีชำระ</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[140px]">สถานะ</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[90px]">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <TableSkeleton rows={6} cols={6} />
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-stone-400 space-y-2">
                      <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 stroke-1" />
                      <div className="text-sm font-medium text-stone-600">ไม่มีรายการคำสั่งซื้อในช่วงเวลานี้</div>
                      <p className="text-xs text-stone-400 max-w-sm mx-auto">
                        ลองเปลี่ยนวันที่จากปฏิทินด้านบน หรือเลือกตัวกรอง &quot;ทั้งหมด&quot; เพื่อดูประวัติย้อนหลัง
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    // Extract readable time
                    const formattedTime = (() => {
                      try {
                        const date = new Date(order.created_at);
                        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                      } catch {
                        return order.created_at;
                      }
                    })();

                    const isCancelled = order.status === 'cancelled';

                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors ${
                          isCancelled ? 'bg-rose-50/40 text-stone-400' : 'hover:bg-stone-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold font-mono tabular-nums whitespace-nowrap">
                          <span className={isCancelled ? 'line-through text-stone-400' : 'text-stone-900'}>
                            {order.order_number}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 font-mono tabular-nums text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{order.created_at?.substring(0, 10)}</span>
                            <span className="text-stone-400 font-medium">({formattedTime})</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-800">
                          <div className="space-y-1.5">
                            {order.items.map((i, idx) => (
                              <div key={idx} className="flex flex-wrap items-center gap-1.5">
                                <span className={`font-semibold ${isCancelled ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                                  {i.name}
                                </span>
                                <span className="text-stone-500 font-bold font-mono tabular-nums text-xs">x{i.quantity}</span>
                                {i.note && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] font-medium whitespace-nowrap">
                                    {i.note}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold font-mono tabular-nums text-sm whitespace-nowrap">
                          <span className={isCancelled ? 'line-through text-stone-400' : 'text-stone-900'}>
                            ฿{(Number(order.total) || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200/60 font-medium text-stone-700 text-xs">
                            {order.payment_method === 'cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                            {order.payment_method === 'qr_promptpay' && <QrCode className="w-3.5 h-3.5 text-blue-600" />}
                            {order.payment_method === 'credit_card' && <CreditCard className="w-3.5 h-3.5 text-purple-600" />}
                            <span>
                              {order.payment_method === 'cash'
                                ? 'เงินสด'
                                : order.payment_method === 'qr_promptpay'
                                ? 'QR PromptPay'
                                : order.payment_method === 'credit_card'
                                ? 'บัตรเครดิต'
                                : order.payment_method}
                            </span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" /> ยกเลิกแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ชำระ & ตัดสต็อกแล้ว
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(order)}
                              title="แก้ไขบิล / วิธีชำระเงิน / หมายเหตุ"
                              className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => setCancellingOrder(order)}
                                title="ขอยกเลิกบิล (คืนสต็อกวัตถุดิบ)"
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer shadow-2xs"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit Order Modal with POS-style options panel */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-100 bg-[#faf9f5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <span>แก้ไขคำสั่งซื้อ #{editingOrder.order_number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] font-mono">
                      ฿{(Number(editingOrder.total) || 0).toFixed(2)}
                    </span>
                  </h4>
                  <p className="text-xs text-stone-500">
                    ปรับวิธีชำระเงิน หรือปรับระดับความหวาน/อุณหภูมิ/ท็อปปิ้งของแต่ละรายการ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  วิธีชำระเงินของบิล
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'cash', label: 'เงินสด (Cash)', icon: Banknote },
                    { key: 'qr_promptpay', label: 'QR PromptPay', icon: QrCode },
                    { key: 'credit_card', label: 'บัตรเครดิต', icon: CreditCard },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditPaymentMethod(key as any)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        editPaymentMethod === key
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Customizer Selector (POS Style) */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <span>รายการที่สั่ง</span>
                    <span className="text-xs font-normal text-stone-400">
                      ({editingOrder.items?.length || 0} รายการ)
                    </span>
                  </h3>
                  <span className="text-[11px] text-stone-500">แตะเพื่อเลือกปรับแต่งแต่ละรายการ</span>
                </div>

                {/* Items Pill Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                  {editingOrder.items?.map((item, idx) => {
                    const itemKey = item.id ?? idx;
                    const isActive = activeEditItemIndex === idx;
                    return (
                      <button
                        key={itemKey}
                        type="button"
                        onClick={() => setActiveEditItemIndex(idx)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#f5efe6] text-[#78350f] border-[#e8ded0] ring-2 ring-[#78350f]/20 font-bold shadow-2xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span className="font-medium">{idx + 1}.</span>
                        <span className="truncate max-w-[130px]">{item.name}</span>
                        <span className="text-[10px] font-mono opacity-80">x{item.quantity}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Item Options Panel (Pill controls similar to POS ItemOptionPanel) */}
                {(() => {
                  const currentItem = editingOrder.items?.[activeEditItemIndex];
                  if (!currentItem) return null;

                  const itemKey = currentItem.id ?? activeEditItemIndex;
                  const opts = itemParsedOptions[itemKey] || parseOptionNote(editItemNotes[itemKey] || '');

                  return (
                    <div className="p-3.5 rounded-2xl border border-stone-200/90 bg-[#faf9f5] space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                        <div>
                          <span className="font-bold text-stone-900 text-xs sm:text-sm">
                            {currentItem.name}
                          </span>
                          <span className="ml-2 text-xs text-stone-500 font-mono">
                            x{currentItem.quantity} = ฿{(currentItem.price * currentItem.quantity).toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-600">
                          {serializeOptionNote(opts) || 'ค่าเริ่มต้น'}
                        </span>
                      </div>

                      {/* Temperature */}
                      <div>
                        <label className="font-semibold text-stone-700 text-xs block mb-1.5">อุณหภูมิ</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'เย็น', value: 'เย็น' },
                            { label: 'ร้อน', value: 'ร้อน' },
                            { label: 'ปั่น (+10฿)', value: 'ปั่น (+10฿)' },
                          ].map(({ label, value }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                handleUpdateItemOption(itemKey, (prev) => ({
                                  ...prev,
                                  temperature: value,
                                }))
                              }
                              className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
                                opts.temperature === value
                                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sweetness */}
                      <div>
                        <label className="font-semibold text-stone-700 text-xs block mb-1.5">ระดับความหวาน</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['ไม่หวาน', 'หวานน้อย', 'หวาน', 'หวานมาก'].map((sw) => {
                            const isMatch =
                              opts.sweetness === sw ||
                              (sw === 'หวาน' && opts.sweetness === 'หวาน (100%)');
                            return (
                              <button
                                key={sw}
                                type="button"
                                onClick={() =>
                                  handleUpdateItemOption(itemKey, (prev) => ({
                                    ...prev,
                                    sweetness: sw === 'หวาน' ? 'หวาน (100%)' : sw,
                                  }))
                                }
                                className={`py-1.5 px-1 rounded-xl font-medium text-xs transition-all border text-center cursor-pointer ${
                                  isMatch
                                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs font-bold'
                                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                                }`}
                              >
                                {sw}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Extra Shots & Serving Style */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Extra Shots */}
                        <div>
                          <label className="font-semibold text-stone-700 text-xs block mb-1">
                            ช็อตเอสเพรสโซ่
                          </label>
                          <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-stone-200 shadow-xs w-full justify-between">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemOption(itemKey, (prev) => ({
                                  ...prev,
                                  extraShots: Math.max(0, prev.extraShots - 1),
                                }))
                              }
                              disabled={opts.extraShots === 0}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 border border-stone-200 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-stone-200"
                            >
                              -
                            </button>
                            <span className="font-bold text-stone-900 text-sm font-mono tabular-nums">
                              {opts.extraShots === 0 ? 'ปกติ' : `+${opts.extraShots} ช็อต`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemOption(itemKey, (prev) => ({
                                  ...prev,
                                  extraShots: Math.min(3, prev.extraShots + 1),
                                }))
                              }
                              disabled={opts.extraShots === 3}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 border border-stone-200 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-stone-200"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Dine-in vs Takeaway */}
                        <div>
                          <label className="font-semibold text-stone-700 text-xs block mb-1">
                            รูปแบบการเสิร์ฟ
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {['ทานที่ร้าน', 'กลับบ้าน'].map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() =>
                                  handleUpdateItemOption(itemKey, (prev) => ({
                                    ...prev,
                                    diningOption: mode,
                                  }))
                                }
                                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
                                  opts.diningOption === mode
                                    ? mode === 'กลับบ้าน'
                                      ? 'bg-[#f5efe6] text-[#78350f] border-[#e8ded0] shadow-2xs font-bold'
                                      : 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick Tags */}
                      <div>
                        <label className="font-semibold text-stone-700 text-xs block mb-1">
                          ตัวเลือกเพิ่มเติม
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {['แยกน้ำแข็ง', 'วิปครีม', 'ไม่ใส่ไซรัป'].map((tag) => {
                            const isSelected = opts.customNote.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleEditTag(itemKey, tag)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#f5efe6] text-[#78350f] border-[#e8ded0] font-bold shadow-2xs'
                                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                }`}
                              >
                                {isSelected ? '✓ ' : '+ '}
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Note input for this item */}
                      <div>
                        <label className="font-semibold text-stone-700 text-xs block mb-1">
                          ข้อความหมายเหตุสรุปของรายการนี้
                        </label>
                        <input
                          type="text"
                          value={editItemNotes[itemKey] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditItemNotes((prev) => ({ ...prev, [itemKey]: val }));
                            setItemParsedOptions((prev) => ({ ...prev, [itemKey]: parseOptionNote(val) }));
                          }}
                          placeholder="เช่น เย็น, หวานน้อย, กลับบ้าน..."
                          className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 bg-[#faf9f5] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขคำสั่งซื้อ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal with Refund and Stock Return Notice */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200/90 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">
                  ยืนยันการยกเลิกคำสั่งซื้อ & คืนเงิน?
                </h4>
                <p className="text-xs text-stone-500">
                  บิล #{cancellingOrder.order_number}
                </p>
              </div>
            </div>

            {/* Refund Box */}
            <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-900">ยอดเงินที่ต้องคืนลูกค้า:</span>
                <span className="font-mono font-extrabold text-base text-rose-600">
                  ฿{(Number(cancellingOrder.total) || 0).toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-rose-700">
                ช่องทางชำระเดิม:{' '}
                <strong className="underline">
                  {cancellingOrder.payment_method === 'cash'
                    ? 'เงินสด (คืนเป็นเงินสด)'
                    : cancellingOrder.payment_method === 'qr_promptpay'
                    ? 'QR PromptPay (โอนคืนลูกค้า)'
                    : 'บัตรเครดิต (ทำรายการ Void/Refund)'}
                </strong>
              </p>
            </div>

            {/* Stock Return Box */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">ระบบจะทำการคืนสต็อกวัตถุดิบอัตโนมัติ:</span>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-amber-800">
                {cancellingOrder.items?.map((it, idx) => (
                  <li key={idx}>
                    {it.name} (x{it.quantity}) - เมล็ดกาแฟ, นมสด, ไซรัป, แก้ว จะถูกคืนเข้าคลัง
                  </li>
                ))}
              </ul>
            </div>

            {/* Refund Reason Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">\u0e40\u0e2b\u0e15\u0e38\u0e1c\u0e25\u0e01\u0e32\u0e23\u0e04\u0e37\u0e19\u0e40\u0e07\u0e34\u0e19 <span className="font-normal text-stone-400">(\u0e44\u0e21\u0e48\u0e1a\u0e31\u0e07\u0e04\u0e31\u0e1a)</span></label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="\u0e40\u0e0a\u0e48\u0e19 \u0e25\u0e39\u0e01\u0e04\u0e49\u0e32\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e1c\u0e34\u0e14, \u0e40\u0e2b\u0e15\u0e38\u0e1c\u0e25\u0e2d\u0e37\u0e48\u0e19..."
                rows={2}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors font-normal resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setCancellingOrder(null); setRefundReason(''); }}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmCancel}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก & คืนเงิน'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
