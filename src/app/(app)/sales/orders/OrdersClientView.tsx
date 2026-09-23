'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStock } from '@/lib/StockContext';
import { useAuth } from '@/lib/AuthContext';
import { Topbar } from '@/components/Topbar';
import { Order } from '@/types';

import { OrdersFilterToolbar, FilterMode } from './components/OrdersFilterToolbar';
import { OrdersSummaryCards, OrderViewStats } from './components/OrdersSummaryCards';
import { OrdersTable, StatusTab, PaymentFilter, TabCounts } from './components/OrdersTable';
import { EditOrderModal } from './components/EditOrderModal';
import { CancelOrderModal } from './components/CancelOrderModal';

const MONTH_NAMES_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

interface OrdersClientViewProps {
  initialOrders?: Order[];
}

export function OrdersClientView({ initialOrders }: OrdersClientViewProps) {
  const { token, activeStore } = useAuth();
  const {
    orders: contextOrders,
    isLoading: contextLoading,
    cancelOrder,
    updateOrder,
    hydrateData,
  } = useStock();

  useEffect(() => {
    if (initialOrders) {
      hydrateData({ orders: initialOrders });
    }
  }, [initialOrders, hydrateData]);

  // Filter & date states
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Table controls: tabs, search, payment filter
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  // Backend fetched orders for specific date/range
  const [fetchedOrders, setFetchedOrders] = useState<Order[] | null>(null);
  const [isFetchingDate, setIsFetchingDate] = useState(false);

  // Modals state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch orders from API based on filter
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
        queryParams.push(`start_date=${start.toISOString().split('T')[0]}&end_date=${end.toISOString().split('T')[0]}&limit=500`);
      } else if (filterMode === 'month') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        queryParams.push(`start_date=${start.toISOString().split('T')[0]}&end_date=${end.toISOString().split('T')[0]}&limit=500`);
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

  useEffect(() => {
    fetchOrdersByFilter();
  }, [filterMode, selectedDate, activeStore?.id]);

  // Calendar & quick buttons
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

  const calYear = currentCalendarMonth.getFullYear();
  const calMonth = currentCalendarMonth.getMonth();

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

  // Formatted date label
  const formattedDateTitle = useMemo(() => {
    if (filterMode === 'all') return 'ทั้งหมด';
    if (filterMode === 'week') return '7 วันล่าสุด';
    if (filterMode === 'month') return `${MONTH_NAMES_TH[calMonth]} ${calYear + 543}`;

    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const isToday = new Date().toISOString().split('T')[0] === selectedDate;
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const isYest = yest.toISOString().split('T')[0] === selectedDate;

      let prefix = '';
      if (isToday) prefix = 'วันนี้, ';
      else if (isYest) prefix = 'เมื่อวาน, ';

      return `${prefix}${d} ${MONTH_NAMES_TH[m - 1]} ${y + 543}`;
    } catch {
      return selectedDate;
    }
  }, [filterMode, selectedDate, calMonth, calYear]);

  // Base list of orders
  const activeOrdersList = useMemo(() => {
    let rawList = fetchedOrders !== null ? fetchedOrders : contextOrders;

    if (activeStore) {
      rawList = rawList.filter((order) => !order.store_id || order.store_id === activeStore.id);
    }

    if (fetchedOrders !== null) return rawList;
    if (filterMode === 'all') return rawList;

    return rawList.filter((order) => {
      const orderDate = (order.created_at || '').substring(0, 10);
      if (filterMode === 'today' || filterMode === 'yesterday' || filterMode === 'custom') {
        return orderDate === selectedDate;
      }
      return true;
    });
  }, [fetchedOrders, contextOrders, filterMode, selectedDate, activeStore]);

  // Filtered orders (status, payment, search)
  const filteredOrders = useMemo(() => {
    return activeOrdersList.filter((order) => {
      if (statusTab === 'completed' && order.status === 'cancelled') return false;
      if (statusTab === 'cancelled' && order.status !== 'cancelled') return false;
      if (paymentFilter !== 'all' && order.payment_method !== paymentFilter) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();

      const matchNumber = order.order_number.toLowerCase().includes(query);
      const matchTable = (order.table_no || '').toLowerCase().includes(query);
      const matchItems = order.items.some((item) => item.name.toLowerCase().includes(query));

      return matchNumber || matchTable || matchItems;
    });
  }, [activeOrdersList, searchQuery, paymentFilter, statusTab]);

  // Tab counts
  const tabCounts: TabCounts = useMemo(() => {
    const totalCount = activeOrdersList.length;
    const completedCount = activeOrdersList.filter((o) => o.status !== 'cancelled').length;
    const cancelledCount = activeOrdersList.filter((o) => o.status === 'cancelled').length;
    const cancelledAmount = activeOrdersList
      .filter((o) => o.status === 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return { totalCount, completedCount, cancelledCount, cancelledAmount };
  }, [activeOrdersList]);

  // KPI Stats
  const stats: OrderViewStats = useMemo(() => {
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

  // Handlers for modal actions
  const handleSaveEdit = async (
    paymentMethod: 'cash' | 'qr_promptpay' | 'credit_card',
    items: { id: number; note: string }[]
  ) => {
    if (!editingOrder) return;
    setIsSubmitting(true);
    try {
      const success = await updateOrder(editingOrder.id, {
        payment_method: paymentMethod,
        items,
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

  const handleConfirmCancel = async (reason: string) => {
    if (!cancellingOrder) return;
    setIsSubmitting(true);
    try {
      const success = await cancelOrder(cancellingOrder.id, reason || undefined);
      if (success) {
        await fetchOrdersByFilter();
        setCancellingOrder(null);
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

  const isLoading = contextLoading || isFetchingDate;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="ประวัติคำสั่งซื้อ" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Date Filter Toolbar & KPI Summary Cards */}
        <OrdersFilterToolbar
          filterMode={filterMode}
          onSelectQuick={handleSelectQuick}
          formattedDateTitle={formattedDateTitle}
          isCalendarOpen={isCalendarOpen}
          setIsCalendarOpen={setIsCalendarOpen}
          selectedDate={selectedDate}
          currentCalendarMonth={currentCalendarMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onDaySelect={handleDaySelect}
          onResetToday={() => handleSelectQuick('today')}
        >
          <OrdersSummaryCards stats={stats} />
        </OrdersFilterToolbar>

        {/* Orders Table with Status Tabs & Search */}
        <OrdersTable
          orders={filteredOrders}
          isLoading={isLoading}
          statusTab={statusTab}
          onStatusTabChange={setStatusTab}
          tabCounts={tabCounts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          formattedDateTitle={formattedDateTitle}
          onOpenEdit={setEditingOrder}
          onOpenCancel={setCancellingOrder}
        />
      </main>

      {/* Edit Order Modal */}
      <EditOrderModal
        order={editingOrder}
        isOpen={!!editingOrder}
        isSubmitting={isSubmitting}
        onClose={() => setEditingOrder(null)}
        onSave={handleSaveEdit}
      />

      {/* Cancel Order Modal */}
      <CancelOrderModal
        order={cancellingOrder}
        isOpen={!!cancellingOrder}
        isSubmitting={isSubmitting}
        onClose={() => setCancellingOrder(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
