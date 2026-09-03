'use client';

import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Eye,
  CreditCard,
  QrCode,
  Banknote,
  UtensilsCrossed,
  Layers,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  SlidersHorizontal,
  Flame,
  FileText,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { MenuItem } from '@/types';
import { ItemOptionModal, CartItemOption } from './components/ItemOptionModal';
import { ItemOptionPanel } from './components/ItemOptionPanel';
import { Dropdown } from '@/components/Dropdown';

interface CartEntry {
  cartId: string; // Unique ID to support same menu with different notes/options
  item: MenuItem;
  quantity: number;
  options: CartItemOption;
}

export default function POSPage() {
  const { menuItems, ingredients, createOrder } = useStock();
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [cartItems, setCartItems] = useState<CartEntry[]>([]);
  const [tableNo, setTableNo] = useState<string>('T-01');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr_promptpay' | 'credit_card'>('qr_promptpay');
  const [previewMenu, setPreviewMenu] = useState<MenuItem | null>(null);
  const [optionTargetMenu, setOptionTargetMenu] = useState<MenuItem | null>(null);
  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [lastOrderSuccess, setLastOrderSuccess] = useState<any | null>(null);

  // Dynamic categories from real menu items
  const dynamicCategories = ['ทั้งหมด', ...Array.from(new Set(menuItems.map((m) => m.category)))];

  // Filtered menu items
  const filteredMenu = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Helper to construct readable note string
  const formatOptionNote = (options: CartItemOption) => {
    const parts: string[] = [];
    if (options.isSpecial) parts.push('พิเศษ (+10฿)');
    if (options.diningOption && options.diningOption !== 'ทานที่ร้าน') parts.push(options.diningOption);
    if (options.spiciness && options.spiciness !== 'เผ็ดปกติ') parts.push(`เผ็ด: ${options.spiciness}`);
    if (options.customNote) parts.push(options.customNote);
    return parts.join(' • ');
  };

  // Quick Add or Open Option Modal
  const addToCart = (menu: MenuItem, options?: CartItemOption) => {
    const defaultOptions: CartItemOption = options || {
      spiciness: 'เผ็ดปกติ',
      diningOption: 'ทานที่ร้าน',
      isSpecial: false,
      customNote: '',
    };

    const optString = JSON.stringify(defaultOptions);
    const existingIndex = cartItems.findIndex(
      (c) => c.item.id === menu.id && JSON.stringify(c.options) === optString
    );

    if (existingIndex > -1) {
      setCartItems((prev) => {
        const next = [...prev];
        next[existingIndex].quantity += 1;
        return next;
      });
    } else {
      const newCartEntry: CartEntry = {
        cartId: `${menu.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        item: menu,
        quantity: 1,
        options: defaultOptions,
      };
      setCartItems((prev) => [...prev, newCartEntry]);
    }
  };

  const handleOpenOptionModal = (menu: MenuItem, cartId?: string) => {
    setOptionTargetMenu(menu);
    setEditingCartId(cartId || null);
  };

  const handleConfirmOptions = (options: CartItemOption) => {
    if (!optionTargetMenu) return;

    if (editingCartId) {
      // Update existing item in cart
      setCartItems((prev) =>
        prev.map((c) => (c.cartId === editingCartId ? { ...c, options } : c))
      );
    } else {
      // Add new item with customized options
      addToCart(optionTargetMenu, options);
    }
    setOptionTargetMenu(null);
    setEditingCartId(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((c) => {
          if (c.cartId === cartId) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartEntry[]
    );
  };

  const deleteCartItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((c) => c.cartId !== cartId));
  };

  const clearCart = () => setCartItems([]);

  // Calculate totals (including special +10฿ per plate if selected)
  const getItemEffectivePrice = (entry: CartEntry) => {
    return entry.item.price + (entry.options.isSpecial ? 10 : 0);
  };

  const subtotal = cartItems.reduce((sum, c) => sum + getItemEffectivePrice(c) * c.quantity, 0);
  const vat = Number((subtotal * 0.07).toFixed(2));
  const grandTotal = Number((subtotal + vat).toFixed(2));

  // Compute Total BOM stock impact in current cart
  const cartBOMImpact: {
    [ingId: number]: { name: string; unit: string; current: number; used: number; remaining: number };
  } = {};
  cartItems.forEach(({ item, quantity, options }) => {
    const qtyMultiplier = options.isSpecial ? 1.3 : 1.0; // Special uses ~30% more ingredients
    item.recipes?.forEach((r) => {
      const ing = ingredients.find((i) => i.id === r.ingredient_id);
      if (!ing) return;
      if (!cartBOMImpact[ing.id]) {
        cartBOMImpact[ing.id] = {
          name: ing.name,
          unit: ing.unit,
          current: ing.quantity,
          used: 0,
          remaining: ing.quantity,
        };
      }
      cartBOMImpact[ing.id].used += Number(((r.quantity_used || 0) * quantity * qtyMultiplier).toFixed(3));
      cartBOMImpact[ing.id].remaining = Math.max(
        0,
        Number((cartBOMImpact[ing.id].current - cartBOMImpact[ing.id].used).toFixed(3))
      );
    });
  });

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    const orderData = cartItems.map((c) => ({
      menu_item_id: c.item.id,
      quantity: c.quantity,
      note: formatOptionNote(c.options),
    }));

    const result = await createOrder(tableNo, orderData, paymentMethod);
    if (result) {
      setLastOrderSuccess(result);
      clearCart();
    } else {
      alert('บันทึกออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar
        title="ขายหน้าร้าน (POS System)"
        subtitle="ระบบสั่งอาหารพร้อมตัดสต็อกตามสูตรวัตถุดิบ (BOM Auto-Deduction) & ปรับแต่งรายละเอียดเมนู"
      />

      <main className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Area: Menu Selector & Category Filters */}
        <div className="flex-1 flex flex-col gap-5 min-w-0 w-full">
          {/* Filter Bar & Search */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category pills with flex-wrap and smooth badges */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#12312d] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* View switcher & Search */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'card'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="มุมมองการ์ด (Card View)"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">การ์ด</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="มุมมองรายการ (List View)"
                >
                  <ListIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">รายการ</span>
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเมนู..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30 focus:border-[#4fb0a5]"
                />
              </div>
            </div>
          </div>

          {/* Menu Items Render */}
          {filteredMenu.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
              <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              ไม่พบรายการอาหารในหมวดหมู่นี้
            </div>
          ) : viewMode === 'card' ? (
            /* Card View */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMenu.map((menu) => {
                const totalInCartForMenu = cartItems
                  .filter((c) => c.item.id === menu.id)
                  .reduce((sum, c) => sum + c.quantity, 0);
                const isAvailable = menu.status !== 'sold_out';

                return (
                  <div
                    key={menu.id}
                    className={`bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                      !isAvailable ? 'opacity-60 bg-slate-50' : ''
                    }`}
                  >
                    <div>
                      <div className="relative h-40 bg-slate-100 overflow-hidden group">
                        <img
                          src={menu.image || '/images/logo_ss.png'}
                          alt={menu.name}
                          className={`w-full h-full ${
                            menu.image
                              ? 'object-cover group-hover:scale-105 transition-transform duration-300'
                              : 'object-contain p-5 bg-white opacity-85'
                          }`}
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white">
                            {menu.category}
                          </span>
                        </div>
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <button
                            onClick={() => handleOpenOptionModal(menu)}
                            className="p-1.5 rounded-xl bg-white/90 text-slate-700 hover:text-[#12312d] hover:bg-white shadow-sm transition-all"
                            title="เลือกตัวเลือกพิเศษ (ความเผ็ด, พิเศษ, หมายเหตุ)"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPreviewMenu(menu)}
                            className="p-1.5 rounded-xl bg-white/90 text-slate-700 hover:text-[#4fb0a5] hover:bg-white shadow-sm transition-all"
                            title="ดูสูตรวัตถุดิบ (BOM Preview)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <span className="text-white font-bold text-xs bg-rose-600 px-3 py-1 rounded-lg">
                              วัตถุดิบหมด (Sold Out)
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-800 text-sm">{menu.name}</h3>
                          <span className="font-extrabold text-base text-[#12312d] shrink-0">฿{menu.price.toFixed(2)}</span>
                        </div>
                        {menu.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">{menu.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        ต้นทุน: <span className="font-bold text-amber-700">฿{menu.recipe_cost}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={!isAvailable}
                          onClick={() => handleOpenOptionModal(menu)}
                          className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
                          title="ปรับแต่งตัวเลือกก่อนสั่ง"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={!isAvailable}
                          onClick={() => addToCart(menu)}
                          className="px-3 py-1.5 rounded-2xl bg-[#12312d] hover:bg-[#1a423d] text-white text-xs font-bold flex items-center gap-1 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> สั่งทันที {totalInCartForMenu > 0 && `(${totalInCartForMenu})`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">เมนู</th>
                      <th className="py-3.5 px-4">หมวดหมู่</th>
                      <th className="py-3.5 px-4 text-right">ราคา</th>
                      <th className="py-3.5 px-4 text-right">ต้นทุน BOM</th>
                      <th className="py-3.5 px-4 text-center">สูตร BOM</th>
                      <th className="py-3.5 px-4 text-center">สั่งซื้อ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMenu.map((menu) => {
                      const totalInCartForMenu = cartItems
                        .filter((c) => c.item.id === menu.id)
                        .reduce((sum, c) => sum + c.quantity, 0);
                      const isAvailable = menu.status !== 'sold_out';

                      return (
                        <tr key={menu.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                                <img
                                  src={menu.image || '/images/logo_ss.png'}
                                  alt={menu.name}
                                  className={`w-full h-full ${menu.image ? 'object-cover rounded-lg' : 'object-contain'}`}
                                />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{menu.name}</div>
                                {menu.description && (
                                  <div className="text-[11px] text-slate-400 line-clamp-1">{menu.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#e6f7f5] text-[#12312d] border border-[#4fb0a5]/30 inline-block whitespace-nowrap">
                              {menu.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                            ฿{menu.price.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-700">
                            ฿{menu.recipe_cost.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setPreviewMenu(menu)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="ดูสูตรวัตถุดิบ"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                disabled={!isAvailable}
                                onClick={() => handleOpenOptionModal(menu)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                                title="ปรับแต่งตัวเลือกพิเศษ"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={!isAvailable}
                                onClick={() => addToCart(menu)}
                                className="px-3 py-1.5 rounded-xl bg-[#12312d] hover:bg-[#1a423d] text-white text-xs font-bold inline-flex items-center gap-1 disabled:bg-slate-300"
                              >
                                <Plus className="w-3.5 h-3.5" /> สั่ง {totalInCartForMenu > 0 && `(${totalInCartForMenu})`}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Area: Order Cart & Real-time BOM Stock Deduction Preview */}
        <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0">
          {/* Order Bill Card OR Item Option Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex flex-col min-h-[560px]">
            {optionTargetMenu ? (
              <ItemOptionPanel
                item={optionTargetMenu}
                initialOptions={
                  editingCartId
                    ? cartItems.find((c) => c.cartId === editingCartId)?.options
                    : undefined
                }
                onCancel={() => {
                  setOptionTargetMenu(null);
                  setEditingCartId(null);
                }}
                onConfirm={handleConfirmOptions}
              />
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#4fb0a5]" />
                    <h3 className="font-bold text-slate-800 text-base">รายการสั่งอาหาร</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500">โต๊ะ:</span>
                    <Dropdown
                      value={tableNo}
                      onChange={setTableNo}
                      options={[
                        { value: 'T-01', label: 'T-01' },
                        { value: 'T-02', label: 'T-02' },
                        { value: 'T-03', label: 'T-03' },
                        { value: 'T-04', label: 'T-04' },
                        { value: 'VIP-1', label: 'VIP-1' },
                        { value: 'TakeAway', label: 'กลับบ้าน (TakeAway)' },
                      ]}
                      size="sm"
                      className="w-32"
                      buttonClassName="py-1 px-2.5 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 max-h-72">
                  {cartItems.length === 0 ? (
                    <div className="h-full py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <UtensilsCrossed className="w-10 h-10 mb-2 opacity-30" />
                      <p>ยังไม่มีรายการในบิล</p>
                      <p className="text-[11px] text-slate-400">เลือกเมนูจากแถบด้านซ้ายเพื่อสั่ง</p>
                    </div>
                  ) : (
                    cartItems.map((entry) => {
                      const effectivePrice = getItemEffectivePrice(entry);
                      const formattedNote = formatOptionNote(entry.options);

                      return (
                        <div
                          key={entry.cartId}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span>{entry.item.name}</span>
                                {entry.options.isSpecial && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md font-bold">
                                    พิเศษ
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                ฿{effectivePrice} x {entry.quantity} = <strong className="text-slate-700">฿{effectivePrice * entry.quantity}</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs">
                                <button
                                  onClick={() => updateQuantity(entry.cartId, -1)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-[#12312d]"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-bold text-slate-800">{entry.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(entry.cartId, 1)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-[#12312d]"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => deleteCartItem(entry.cartId)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Display Selected Note/Options */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                            <span className="text-slate-500 truncate max-w-[200px]" title={formattedNote || 'ไม่มีหมายเหตุ'}>
                              {formattedNote ? `📝 ${formattedNote}` : '🍽️ ทานที่ร้าน • เผ็ดปกติ'}
                            </span>
                            <button
                              onClick={() => handleOpenOptionModal(entry.item, entry.cartId)}
                              className="text-[#4fb0a5] hover:text-[#12312d] font-bold text-[10px] shrink-0"
                            >
                              แก้ไขตัวเลือก
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bill Summary & Payment Form */}
                <div className="pt-3 border-t border-slate-100 space-y-3 mt-auto">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>ยอดรวมค่าอาหาร (Subtotal)</span>
                      <span>฿{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                      <span>฿{vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-100">
                      <span>ยอดชำระสุทธิ (Net Total)</span>
                      <span className="text-base text-[#12312d]">฿{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qr_promptpay')}
                      className={`py-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all border ${
                        paymentMethod === 'qr_promptpay'
                          ? 'bg-[#12312d] text-white border-[#12312d] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>พร้อมเพย์</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all border ${
                        paymentMethod === 'cash'
                          ? 'bg-[#12312d] text-white border-[#12312d] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>เงินสด</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`py-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all border ${
                        paymentMethod === 'credit_card'
                          ? 'bg-[#12312d] text-white border-[#12312d] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>บัตรเครดิต</span>
                    </button>
                  </div>

                  <button
                    disabled={cartItems.length === 0}
                    onClick={handleCheckout}
                    className="w-full py-3 rounded-2xl bg-[#4fb0a5] hover:bg-[#3d9b90] text-slate-950 font-bold text-xs shadow-lg shadow-[#4fb0a5]/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ยืนยันออเดอร์ & ตัดสต็อกอัตโนมัติ
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Real-time BOM Stock Deduction Preview */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
              <Layers className="w-4 h-4 text-[#4fb0a5]" />
              <span>Preview วัตถุดิบที่จะถูกตัดสต็อก</span>
            </div>
            {Object.keys(cartBOMImpact).length === 0 ? (
              <p className="text-[11px] text-slate-400 py-1">
                เมื่อเพิ่มเมนูลงในบิล รายการตัดสต็อกวัตถุดิบแบบ Real-time จะแสดงที่นี่
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {Object.values(cartBOMImpact).map((impact, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{impact.name}</span>
                      <div className="text-[10px] text-slate-400">
                        เดิม: {impact.current} {impact.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600">
                        -{impact.used} {impact.unit}
                      </span>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        คงเหลือ: {impact.remaining} {impact.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>



      {/* Recipe Preview Modal */}
      {previewMenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{previewMenu.name}</h3>
                <p className="text-slate-500">หมวดหมู่: {previewMenu.category} • ราคา: ฿{previewMenu.price}</p>
              </div>
              <button
                onClick={() => setPreviewMenu(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#4fb0a5]" />
                <span>สูตรวัตถุดิบที่ใช้ตัดสต็อกต่อ 1 จาน:</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {previewMenu.recipes?.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="font-medium text-slate-700">{r.ingredient_name || `วัตถุดิบ #${r.ingredient_id}`}</span>
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                      {r.quantity_used} {r.ingredient_unit}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex justify-between items-center font-bold">
                <span>ต้นทุนวัตถุดิบรวม (BOM):</span>
                <span>฿{previewMenu.recipe_cost}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewMenu(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Toast Modal */}
      {lastOrderSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 border border-slate-200 animate-scale-in">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">บันทึกออเดอร์สำเร็จ!</h3>
              <p className="text-xs text-slate-500 mt-1">
                เลขที่บิล: <strong className="text-slate-800">{lastOrderSuccess.order_number}</strong> (โต๊ะ {lastOrderSuccess.table_no})
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                ระบบได้ตัดสต็อกวัตถุดิบตามสูตร (BOM) ลงฐานข้อมูลเรียบร้อยแล้ว
              </p>
            </div>
            <button
              onClick={() => setLastOrderSuccess(null)}
              className="w-full py-2.5 rounded-2xl bg-[#12312d] text-white hover:bg-[#1a423d] text-xs font-bold shadow-md shadow-[#12312d]/20"
            >
              รับออเดอร์ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
