'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Eye,
  CreditCard,
  QrCode,
  Banknote,
  Coffee,
  Layers,
  LayoutGrid,
  List as ListIcon,
  SlidersHorizontal,
  X,
  ChevronUp,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { MenuItem } from '@/types';
import { CartItemOption } from './hooks/useItemOptions';
import { ItemOptionPanel } from './components/ItemOptionPanel';
import { Button } from '@/components/Button';
import { checkIsCoffee, checkIsSweetener, getSweetnessMultiplier } from './hooks/useItemOptions';

/* ─────────────────────────── Types ─────────────────────────── */

interface CartEntry {
  cartId: string;
  item: MenuItem;
  quantity: number;
  options: CartItemOption;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function formatOptionNote(options: CartItemOption): string {
  const parts: string[] = [];
  if (options.temperature) parts.push(options.temperature);
  if (options.sweetness && options.sweetness !== 'หวาน 100%') parts.push(options.sweetness);
  const shots = options.extraShots ?? (options.isSpecial ? 1 : 0);
  if (shots > 0) parts.push(`เพิ่ม ${shots} ช็อต (+฿${shots * 15})`);
  options.selectedModifiers?.forEach((m) => {
    parts.push(`+${m.name}${m.price > 0 ? ` (+฿${m.price})` : ''}`);
  });
  if (options.diningOption && options.diningOption !== 'ทานที่ร้าน') parts.push('🥤 กลับบ้าน');
  if (options.spiciness && options.spiciness !== 'ไม่เผ็ด') parts.push(options.spiciness);
  if (options.customNote) parts.push(options.customNote);
  return parts.join(' • ');
}

function getItemEffectivePrice(entry: CartEntry): number {
  const shots = entry.options.extraShots ?? (entry.options.isSpecial ? 1 : 0);
  const blendExtra = entry.options.temperature === 'ปั่น (+10฿)' ? 10 : 0;
  const modExtra = (entry.options.selectedModifiers || []).reduce(
    (sum: number, m: any) => sum + (Number(m.price) || 0), 0
  );
  return entry.item.price + shots * 15 + blendExtra + modExtra;
}

/* ─────────────────────── Sub-components ─────────────────────── */

/** Floating Action Button for cart on mobile */
function CartFAB({ count, total, onClick }: { count: number; total: number; onClick: () => void }) {
  if (count === 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-4 z-40 md:hidden flex items-center gap-2.5 pl-4 pr-5 h-14 bg-stone-900 text-white rounded-2xl shadow-2xl active:scale-95 transition-transform"
    >
      <div className="relative">
        <ShoppingCart className="w-5 h-5" />
        <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {count}
        </span>
      </div>
      <div className="text-left">
        <div className="text-[10px] text-stone-300 leading-none">รายการ {count} รายการ</div>
        <div className="text-sm font-bold font-mono tabular-nums leading-tight">฿{total.toFixed(0)}</div>
      </div>
      <ChevronUp className="w-4 h-4 ml-1 text-stone-300" />
    </button>
  );
}

/** Bottom Sheet wrapper for mobile */
function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  fullHeight = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullHeight?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`relative bg-white rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-200 ${
          fullHeight ? 'max-h-[94dvh]' : 'max-h-[82dvh]'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-stone-100 shrink-0">
            <h2 className="font-bold text-stone-900 text-base">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Cart item row (shared between desktop panel and mobile sheet) */
function CartItemRow({
  entry,
  onUpdate,
  onDelete,
  onEdit,
}: {
  entry: CartEntry;
  onUpdate: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
  onEdit: (item: MenuItem, cartId: string) => void;
}) {
  const effectivePrice = getItemEffectivePrice(entry);
  const note = formatOptionNote(entry.options);

  return (
    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-sm space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-stone-900 text-sm flex items-center gap-1.5 flex-wrap">
            <span>{entry.item.name}</span>
            {entry.options.temperature && (
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                entry.options.temperature === 'ร้อน'
                  ? 'bg-[#f5efe6] text-[#78350f] border border-[#e8ded0]'
                  : entry.options.temperature === 'ปั่น (+10฿)'
                  ? 'bg-stone-200 text-stone-800 border border-stone-300'
                  : 'bg-stone-100 text-stone-700 border border-stone-200'
              }`}>
                {entry.options.temperature}
              </span>
            )}
          </div>
          <div className="text-xs text-stone-500 font-mono tabular-nums">
            ฿{effectivePrice} × {entry.quantity} = <strong className="text-stone-900">฿{effectivePrice * entry.quantity}</strong>
          </div>
        </div>
        {/* Qty stepper */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center bg-white border border-stone-200 px-1 py-0.5 rounded-lg shadow-2xs">
            <button
              onClick={() => onUpdate(entry.cartId, -1)}
              className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-5 text-center font-bold text-stone-900 font-mono tabular-nums">{entry.quantity}</span>
            <button
              onClick={() => onUpdate(entry.cartId, 1)}
              className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => onDelete(entry.cartId)}
            className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Note & edit */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-xs">
        <span className="text-stone-500 truncate max-w-[190px]">
          {note || 'ทานที่ร้าน • หวาน 100%'}
        </span>
        <button
          onClick={() => onEdit(entry.item, entry.cartId)}
          className="text-stone-600 hover:text-stone-900 font-medium text-xs shrink-0 cursor-pointer ml-2"
        >
          แก้ไข
        </button>
      </div>
    </div>
  );
}

/** Bill summary + payment section */
function BillSummary({
  cartItems,
  grandTotal,
  paymentMethod,
  setPaymentMethod,
  onCheckout,
  onClear,
  compact = false,
}: {
  cartItems: CartEntry[];
  grandTotal: number;
  paymentMethod: 'cash' | 'qr_promptpay' | 'credit_card';
  setPaymentMethod: (m: 'cash' | 'qr_promptpay' | 'credit_card') => void;
  onCheckout: () => void;
  onClear: () => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Subtotal */}
      <div className="flex justify-between font-bold text-stone-900 text-sm pt-1">
        <span>ยอดรวม</span>
        <span className="font-mono tabular-nums text-base">฿{grandTotal.toFixed(2)}</span>
      </div>

      {/* Payment methods */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-stone-500 block">วิธีชำระเงิน</span>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'qr_promptpay', icon: <QrCode className="w-4 h-4" />, label: 'พร้อมเพย์' },
            { key: 'cash', icon: <Banknote className="w-4 h-4" />, label: 'เงินสด' },
            { key: 'credit_card', icon: <CreditCard className="w-4 h-4" />, label: 'บัตรเครดิต' },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPaymentMethod(key)}
              className={`h-14 px-2 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                paymentMethod === key
                  ? 'bg-stone-900 text-white shadow-xs font-semibold'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Checkout button */}
      <button
        type="button"
        disabled={cartItems.length === 0}
        onClick={onCheckout}
        className={`w-full px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] cursor-pointer ${compact ? 'h-14 text-base' : 'h-11'}`}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>ยืนยันชำระเงิน</span>
        {cartItems.length > 0 && (
          <span className="font-mono tabular-nums text-xs opacity-90 pl-1">฿{grandTotal.toFixed(2)}</span>
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function POSPage() {
  const { menuItems, ingredients, createOrder } = useStock();

  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [cartItems, setCartItems] = useState<CartEntry[]>([]);
  const [tableNo] = useState('T-01');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr_promptpay' | 'credit_card'>('qr_promptpay');
  const [previewMenu, setPreviewMenu] = useState<MenuItem | null>(null);
  const [optionTargetMenu, setOptionTargetMenu] = useState<MenuItem | null>(null);
  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [lastOrderSuccess, setLastOrderSuccess] = useState<any | null>(null);
  // Mobile-only sheet states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileOptionOpen, setIsMobileOptionOpen] = useState(false);

  const dynamicCategories = ['ทั้งหมด', ...Array.from(new Set(menuItems.map((m) => m.category)))];
  const filteredMenu = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchCat && matchSearch;
  });

  /* ── Cart Operations ── */
  const addToCart = useCallback((menu: MenuItem, options?: CartItemOption) => {
    const defaultOptions: CartItemOption = options || {
      temperature: 'เย็น',
      sweetness: 'หวาน 100%',
      diningOption: 'ทานที่ร้าน',
      extraShots: 0,
      customNote: '',
    };
    const optString = JSON.stringify(defaultOptions);
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (c) => c.item.id === menu.id && JSON.stringify(c.options) === optString
      );
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          cartId: `${menu.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          item: menu,
          quantity: 1,
          options: defaultOptions,
        },
      ];
    });
  }, []);

  const updateQuantity = (cartId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((c) => (c.cartId === cartId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0) as CartEntry[]
    );
  };

  const deleteCartItem = (cartId: string) =>
    setCartItems((prev) => prev.filter((c) => c.cartId !== cartId));

  const clearCart = () => setCartItems([]);

  /* ── Option Panel Handlers ── */
  const handleOpenOptionModal = (menu: MenuItem, cartId?: string) => {
    setOptionTargetMenu(menu);
    setEditingCartId(cartId ?? null);
    setIsMobileOptionOpen(true);
  };

  const handleConfirmOptions = (options: CartItemOption) => {
    if (!optionTargetMenu) return;
    if (editingCartId) {
      setCartItems((prev) =>
        prev.map((c) => (c.cartId === editingCartId ? { ...c, options } : c))
      );
    } else {
      addToCart(optionTargetMenu, options);
    }
    setOptionTargetMenu(null);
    setEditingCartId(null);
    setIsMobileOptionOpen(false);
  };

  const handleCancelOption = () => {
    setOptionTargetMenu(null);
    setEditingCartId(null);
    setIsMobileOptionOpen(false);
  };

  /* ── Totals ── */
  const subtotal = cartItems.reduce((sum, c) => sum + getItemEffectivePrice(c) * c.quantity, 0);
  const grandTotal = subtotal;

  /* ── Real-time BOM preview (for desktop panel) ── */
  const cartBOMImpact: {
    [ingId: number]: { name: string; unit: string; current: number; used: number; remaining: number };
  } = {};

  cartItems.forEach(({ item, quantity, options }) => {
    const shots = options.extraShots ?? (options.isSpecial ? 1 : 0);
    const customNote = options.customNote || '';
    const sweetness = options.sweetness || 'หวาน';
    const sweetnessMultiplier = getSweetnessMultiplier(sweetness, customNote);

    item.recipes?.forEach((r) => {
      const ing = ingredients.find((i) => i.id === r.ingredient_id);
      if (!ing) return;
      const isCoffee = checkIsCoffee(ing.name, ing.category);
      const isSweetener = checkIsSweetener(ing.name, ing.category);
      let mult = 1.0;
      if (isCoffee) mult = 1.0 + shots;
      else if (isSweetener) mult = sweetnessMultiplier;

      const usedQty = (r.quantity_used || 0) * quantity * mult;
      if (usedQty > 0) {
        if (!cartBOMImpact[ing.id]) {
          cartBOMImpact[ing.id] = { name: ing.name, unit: ing.unit, current: ing.quantity, used: 0, remaining: ing.quantity };
        }
        cartBOMImpact[ing.id].used = Number((cartBOMImpact[ing.id].used + usedQty).toFixed(3));
        cartBOMImpact[ing.id].remaining = Math.max(0, Number((cartBOMImpact[ing.id].current - cartBOMImpact[ing.id].used).toFixed(3)));
      }
    });

    // Takeaway cup deduction
    if (options.diningOption === 'กลับบ้าน' || customNote.includes('กลับบ้าน')) {
      const cupIng = ingredients.find((i) =>
        i.name.toLowerCase().includes('แก้ว') && (
          i.name.toLowerCase().includes('takeaway') ||
          i.name.toLowerCase().includes('กลับบ้าน') ||
          i.category?.toLowerCase().includes('แก้ว') ||
          i.category?.toLowerCase().includes('บรรจุภัณฑ์')
        )
      ) ?? ingredients.find((i) => i.name.toLowerCase().includes('แก้ว'));
      if (cupIng) {
        if (!cartBOMImpact[cupIng.id]) {
          cartBOMImpact[cupIng.id] = { name: cupIng.name, unit: cupIng.unit, current: cupIng.quantity, used: 0, remaining: cupIng.quantity };
        }
        cartBOMImpact[cupIng.id].used += quantity;
        cartBOMImpact[cupIng.id].remaining = Math.max(0, cartBOMImpact[cupIng.id].current - cartBOMImpact[cupIng.id].used);
      }
    }

    options.selectedModifiers?.forEach((mod: any) => {
      const ing = ingredients.find((i) => i.id === mod.ingredient_id);
      if (ing) {
        if (!cartBOMImpact[ing.id]) {
          cartBOMImpact[ing.id] = { name: `${ing.name} (+${mod.name})`, unit: ing.unit, current: ing.quantity, used: 0, remaining: ing.quantity };
        }
        cartBOMImpact[ing.id].used += (Number(mod.quantity) || 1) * quantity;
        cartBOMImpact[ing.id].remaining = Math.max(0, cartBOMImpact[ing.id].current - cartBOMImpact[ing.id].used);
      }
    });
  });

  /* ── Checkout ── */
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    const orderData = cartItems.map((c) => ({
      menu_item_id: c.item.id,
      quantity: c.quantity,
      note: formatOptionNote(c.options),
      options: c.options,
    }));
    const result = await createOrder(tableNo, orderData, paymentMethod);
    if (result) {
      setLastOrderSuccess(result);
      clearCart();
      setIsCartOpen(false);
    } else {
      alert('บันทึกออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  /* ── Derived ── */
  const showDesktopOptionPanel = !!optionTargetMenu;

  /* ─────────── RENDER ─────────── */
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="ขายหน้าร้าน" />

      <main className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col lg:flex-row gap-4 lg:gap-5 w-full items-start pb-24 md:pb-6">

        {/* ═══════════════════ LEFT: Menu Area ═══════════════════ */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">

          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col gap-2.5">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-8 px-3 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white shadow-xs font-semibold'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search + View Mode */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาเมนู..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full pl-8 pr-3 text-sm rounded-xl border border-stone-200/90 bg-stone-50 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
                />
              </div>
              {/* View toggle */}
              <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 shrink-0 border border-stone-200/60">
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'card' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="การ์ด"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'list' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="รายการ"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Menu Grid / List */}
          {filteredMenu.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/90 text-stone-400 text-sm shadow-xs">
              <Coffee className="w-8 h-8 mx-auto mb-2 opacity-40" />
              ไม่พบรายการในหมวดหมู่นี้
            </div>
          ) : viewMode === 'card' ? (
            // ─── Card View ───
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredMenu.map((menu) => {
                const totalInCart = cartItems.filter((c) => c.item.id === menu.id).reduce((s, c) => s + c.quantity, 0);
                const isAvailable = menu.status !== 'sold_out';
                return (
                  <div
                    key={menu.id}
                    className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between ${!isAvailable ? 'opacity-60' : ''}`}
                  >
                    {/* Image */}
                    <div className="relative h-28 sm:h-36 bg-stone-100 overflow-hidden group">
                      <img
                        src={menu.image || '/images/logo_ss.png'}
                        alt={menu.name}
                        className={`w-full h-full ${menu.image ? 'object-cover group-hover:scale-105 transition-transform duration-300' : 'object-contain p-4 opacity-30 grayscale'}`}
                      />
                      {/* Top-right buttons */}
                      <div className="absolute top-1.5 right-1.5 flex gap-1">
                        <button
                          onClick={() => handleOpenOptionModal(menu)}
                          className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-stone-700 shadow-2xs transition-colors cursor-pointer"
                          title="ตัวเลือก"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setPreviewMenu(menu)}
                          className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-stone-700 shadow-2xs transition-colors cursor-pointer"
                          title="ดูสูตร"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Category badge */}
                      <div className="absolute top-1.5 left-1.5">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-900/75 backdrop-blur-md text-white">
                          {menu.category}
                        </span>
                      </div>
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                          <span className="text-white font-semibold text-xs bg-rose-600 px-2 py-1 rounded-lg">Sold Out</span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h3 className="font-bold text-stone-900 text-xs leading-tight line-clamp-2">{menu.name}</h3>
                        <span className="font-bold text-xs text-stone-900 shrink-0 font-mono tabular-nums">฿{menu.price.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Add button */}
                    <div className="px-3 pb-3">
                      <button
                        disabled={!isAvailable}
                        onClick={() => handleOpenOptionModal(menu)}
                        className="w-full h-9 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>สั่ง {totalInCart > 0 && `(${totalInCart})`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // ─── List View ───
            <div className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs">
              <div className="divide-y divide-stone-100">
                {filteredMenu.map((menu) => {
                  const totalInCart = cartItems.filter((c) => c.item.id === menu.id).reduce((s, c) => s + c.quantity, 0);
                  const isAvailable = menu.status !== 'sold_out';
                  return (
                    <div key={menu.id} className={`flex items-center gap-3 p-3 hover:bg-stone-50/80 transition-colors ${!isAvailable ? 'opacity-60' : ''}`}>
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200/80 overflow-hidden shrink-0">
                        <img
                          src={menu.image || '/images/logo_ss.png'}
                          alt={menu.name}
                          className={`w-full h-full ${menu.image ? 'object-cover' : 'object-contain opacity-30 grayscale p-1'}`}
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-stone-900 text-sm truncate">{menu.name}</div>
                        <div className="text-xs text-stone-500">{menu.category}</div>
                      </div>
                      {/* Price */}
                      <span className="font-bold text-sm text-stone-900 font-mono tabular-nums shrink-0">฿{menu.price.toFixed(0)}</span>
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setPreviewMenu(menu)}
                          className="p-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={!isAvailable}
                          onClick={() => handleOpenOptionModal(menu)}
                          className="h-8 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          สั่ง {totalInCart > 0 && `(${totalInCart})`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════ RIGHT: Desktop Cart ═══════════════════ */}
        <div className="hidden md:flex w-72 lg:w-96 flex-col gap-4 shrink-0">
          {/* Cart / Option Panel (desktop) */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 flex flex-col min-h-[560px]">
            {showDesktopOptionPanel ? (
              <ItemOptionPanel
                item={optionTargetMenu!}
                initialOptions={
                  editingCartId
                    ? cartItems.find((c) => c.cartId === editingCartId)?.options
                    : undefined
                }
                onCancel={handleCancelOption}
                onConfirm={handleConfirmOptions}
                compact={false}
              />
            ) : (
              <>
                {/* Cart Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-stone-900 text-sm">รายการที่สั่ง</h3>
                    {cartItems.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-full">
                        {cartItems.reduce((s, c) => s + c.quantity, 0)}
                      </span>
                    )}
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      ล้างตะกร้า
                    </button>
                  )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 no-scrollbar">
                  {cartItems.length === 0 ? (
                    <div className="h-full py-12 flex flex-col items-center justify-center text-stone-400 text-xs">
                      <Coffee className="w-10 h-10 mb-2 opacity-30" />
                      <p className="font-medium">ยังไม่มีรายการ</p>
                    </div>
                  ) : (
                    cartItems.map((entry) => (
                      <CartItemRow
                        key={entry.cartId}
                        entry={entry}
                        onUpdate={updateQuantity}
                        onDelete={deleteCartItem}
                        onEdit={handleOpenOptionModal}
                      />
                    ))
                  )}
                </div>

                {/* Bill Summary */}
                <div className="pt-3 border-t border-stone-100 mt-auto">
                  <BillSummary
                    cartItems={cartItems}
                    grandTotal={grandTotal}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    onCheckout={handleCheckout}
                    onClear={clearCart}
                  />
                </div>
              </>
            )}
          </div>

          {/* BOM Preview — desktop only */}
          {!showDesktopOptionPanel && (
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-800 font-semibold">
                  <Layers className="w-4 h-4 text-stone-700" />
                  <span>ตัดสต็อกวัตถุดิบ</span>
                </div>
                {Object.keys(cartBOMImpact).length > 0 && (
                  <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                    {Object.keys(cartBOMImpact).length} รายการ
                  </span>
                )}
              </div>
              {Object.keys(cartBOMImpact).length === 0 ? (
                <p className="text-xs text-stone-400 py-1">รายการตัดสต็อกจะแสดงเมื่อมีออเดอร์</p>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {Object.values(cartBOMImpact).map((impact, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-200/60"
                    >
                      <div>
                        <span className="font-semibold text-stone-900">{impact.name}</span>
                        <div className="text-xs text-stone-400">เดิม {impact.current} {impact.unit}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-stone-900 font-mono tabular-nums">-{impact.used} {impact.unit}</span>
                        <div className="text-xs text-stone-500 font-mono tabular-nums">เหลือ {impact.remaining} {impact.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════ MOBILE: Cart FAB ═══════════════════ */}
      <CartFAB
        count={cartItems.reduce((s, c) => s + c.quantity, 0)}
        total={grandTotal}
        onClick={() => setIsCartOpen(true)}
      />

      {/* ═══════════════════ MOBILE: Cart Bottom Sheet ═══════════════════ */}
      <BottomSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title={`รายการที่สั่ง${cartItems.length > 0 ? ` (${cartItems.reduce((s, c) => s + c.quantity, 0)})` : ''}`}
        fullHeight
      >
        <div className="px-4 pt-3 pb-safe space-y-3">
          {cartItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-400 text-sm">
              <Coffee className="w-10 h-10 mb-2 opacity-30" />
              <p className="font-medium">ยังไม่มีรายการ</p>
            </div>
          ) : (
            <>
              {/* Cart items */}
              <div className="space-y-2.5">
                {cartItems.map((entry) => (
                  <CartItemRow
                    key={entry.cartId}
                    entry={entry}
                    onUpdate={updateQuantity}
                    onDelete={deleteCartItem}
                    onEdit={(item, cartId) => {
                      handleOpenOptionModal(item, cartId);
                    }}
                  />
                ))}
              </div>
              {/* Clear */}
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                >
                  ล้างตะกร้า
                </button>
              )}
              {/* Divider */}
              <div className="border-t border-stone-100 pt-3">
                <BillSummary
                  cartItems={cartItems}
                  grandTotal={grandTotal}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  onCheckout={handleCheckout}
                  onClear={clearCart}
                  compact
                />
              </div>
            </>
          )}
          {/* Safe area spacer */}
          <div className="h-4" />
        </div>
      </BottomSheet>

      {/* ═══════════════════ MOBILE: Option Bottom Sheet ═══════════════════ */}
      <BottomSheet
        isOpen={isMobileOptionOpen && !!optionTargetMenu}
        onClose={handleCancelOption}
        fullHeight
      >
        {optionTargetMenu && (
          <div className="px-4 pt-2 pb-4 h-full flex flex-col">
            <ItemOptionPanel
              item={optionTargetMenu}
              initialOptions={
                editingCartId
                  ? cartItems.find((c) => c.cartId === editingCartId)?.options
                  : undefined
              }
              onCancel={handleCancelOption}
              onConfirm={handleConfirmOptions}
              compact
            />
          </div>
        )}
      </BottomSheet>

      {/* ═══════════════════ Recipe Preview Modal ═══════════════════ */}
      {previewMenu && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-stone-200 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-base">{previewMenu.name}</h3>
                <p className="text-stone-500">หมวดหมู่: {previewMenu.category} • ฿{previewMenu.price}</p>
              </div>
              <button
                onClick={() => setPreviewMenu(null)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {previewMenu.recipes?.map((r, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 px-3 rounded-xl bg-stone-50 border border-stone-100"
                >
                  <span className="font-medium text-stone-700">{r.ingredient_name || `วัตถุดิบ #${r.ingredient_id}`}</span>
                  <span className="font-semibold text-stone-800 bg-white px-2 py-0.5 rounded-lg border border-stone-200 font-mono tabular-nums">
                    {r.quantity_used} {r.ingredient_unit}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-stone-50 text-stone-800 rounded-xl border border-stone-200 flex justify-between items-center font-medium">
              <span>ต้นทุนวัตถุดิบรวม:</span>
              <span className="font-mono tabular-nums font-bold text-stone-900">฿{previewMenu.recipe_cost}</span>
            </div>
            <div className="pt-1 flex justify-end">
              <Button variant="primary" onClick={() => setPreviewMenu(null)} className="rounded-xl bg-stone-900 text-white hover:bg-stone-800">
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ Order Success Modal ═══════════════════ */}
      {lastOrderSuccess && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 border border-stone-200 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-stone-100 text-stone-900 rounded-2xl mx-auto flex items-center justify-center shadow-xs border border-stone-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">บันทึกออเดอร์สำเร็จ!</h3>
              <p className="text-xs text-stone-500 mt-1">
                เลขที่บิล: <strong className="text-stone-800">{lastOrderSuccess.order_number}</strong>
              </p>
              <p className="text-xs text-stone-600 mt-1">ตัดสต็อกวัตถุดิบตามสูตรเรียบร้อย</p>
            </div>
            <Button
              className="w-full rounded-xl bg-stone-900 text-white hover:bg-stone-800 h-12 text-base"
              onClick={() => setLastOrderSuccess(null)}
            >
              รับออเดอร์ถัดไป
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
