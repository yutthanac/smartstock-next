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
  Coffee,
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
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

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
    if (options.temperature) parts.push(options.temperature);
    if (options.sweetness && options.sweetness !== 'หวาน 100%') parts.push(options.sweetness);
    if (options.isSpecial) parts.push('เพิ่มช็อต (+15฿)');
    if (options.diningOption && options.diningOption !== 'ทานที่ร้าน') parts.push(options.diningOption);
    if (options.spiciness && options.spiciness !== 'ไม่เผ็ด') parts.push(options.spiciness);
    if (options.customNote) parts.push(options.customNote);
    return parts.join(' • ');
  };

  // Quick Add or Open Option Modal
  const addToCart = (menu: MenuItem, options?: CartItemOption) => {
    const defaultOptions: CartItemOption = options || {
      temperature: 'เย็น',
      sweetness: 'หวาน 100%',
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
    <div className="flex-1 flex flex-col min-h-screen bg-[#ebecf0]">
      <Topbar
        title="ขายหน้าร้าน"
        subtitle="ขายหน้าร้าน พร้อมตัดสต็อกอัตโนมัติตามสูตร"
      />

      <main className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Area: Menu Selector & Category Filters */}
        <div className="flex-1 flex flex-col gap-5 min-w-0 w-full">
          {/* Filter Bar & Search */}
          <div className="skeuo-card p-4 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category pills with flex-wrap and smooth badges */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {dynamicCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'neu-pressed text-emerald-800 font-semibold border border-emerald-500/30'
                        : 'neu-raised text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* View switcher & Search */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="skeuo-inset p-1 rounded-2xl flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'card'
                      ? 'neu-raised text-emerald-800'
                      : 'text-slate-500 hover:text-slate-800'
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
                      ? 'neu-raised text-emerald-800'
                      : 'text-slate-500 hover:text-slate-800'
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
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl skeuo-input text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Menu Items Render */}
          {filteredMenu.length === 0 ? (
            <div className="p-12 text-center skeuo-card rounded-3xl text-slate-400 text-sm">
              <Coffee className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              ไม่พบรายการเครื่องดื่มหรือสินค้าในหมวดหมู่นี้
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
                    className={`skeuo-card-interactive rounded-3xl overflow-hidden flex flex-col justify-between transition-all ${
                      !isAvailable ? 'opacity-60' : ''
                    }`}
                  >
                    <div>
                      <div className="relative h-40 bg-slate-200/60 overflow-hidden group">
                        <img
                          src={menu.image || '/images/logo_ss.png'}
                          alt={menu.name}
                          className={`w-full h-full ${
                            menu.image
                              ? 'object-cover group-hover:scale-105 transition-transform duration-300'
                              : 'object-contain p-5 opacity-85'
                          }`}
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white">
                            {menu.category}
                          </span>
                        </div>
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <button
                            onClick={() => handleOpenOptionModal(menu)}
                            className="p-1.5 rounded-xl skeuo-btn-secondary shadow-sm"
                            title="เลือกตัวเลือกพิเศษ (ความเผ็ด, พิเศษ, หมายเหตุ)"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPreviewMenu(menu)}
                            className="p-1.5 rounded-xl skeuo-btn-secondary shadow-sm text-emerald-700"
                            title="ดูสูตรวัตถุดิบ (BOM Preview)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm bg-red-600 px-3 py-1 rounded-lg">
                              Sold Out!
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-slate-900 text-sm">{menu.name}</h3>
                          <span className="font-semibold text-sm text-emerald-800 shrink-0 font-mono">฿{menu.price.toFixed(2)}</span>
                        </div>
                        {menu.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{menu.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-slate-300/60 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500 font-medium">
                        ต้นทุน: <span className="font-bold text-amber-700">฿{menu.recipe_cost}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={!isAvailable}
                          onClick={() => handleOpenOptionModal(menu)}
                          className="px-3.5 py-2 rounded-2xl skeuo-btn-primary text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="เลือกรายละเอียดเพื่อสั่ง"
                        >
                          <Plus className="w-4 h-4" />
                          <span>สั่ง {totalInCartForMenu > 0 && `(${totalInCartForMenu})`}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="skeuo-card rounded-3xl overflow-hidden border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-900 text-sm font-semibold">
                      <th className="py-3.5 px-4 font-semibold text-slate-900">เมนู</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-900">หมวดหมู่</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-900 text-right">ราคา</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-900 text-right">ต้นทุน BOM</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-900 text-center">สูตร BOM</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-900 text-center">สั่งซื้อ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMenu.map((menu) => {
                      const totalInCartForMenu = cartItems
                        .filter((c) => c.item.id === menu.id)
                        .reduce((sum, c) => sum + c.quantity, 0);
                      const isAvailable = menu.status !== 'sold_out';

                      return (
                        <tr key={menu.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl neu-raised overflow-hidden shrink-0 flex items-center justify-center p-1">
                                <img
                                  src={menu.image || '/images/logo_ss.png'}
                                  alt={menu.name}
                                  className={`w-full h-full ${menu.image ? 'object-cover rounded-lg' : 'object-contain'}`}
                                />
                              </div>
                              <div>
                                <div className="font-normal text-slate-900 text-sm">{menu.name}</div>
                                {menu.description && (
                                  <div className="text-[11px] text-slate-500 line-clamp-1">{menu.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="neutral">
                              {menu.category}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right font-normal text-slate-800 text-sm font-mono">
                            ฿{menu.price.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-normal text-slate-500">
                            ฿{menu.recipe_cost.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setPreviewMenu(menu)}
                              title="ดูสูตรวัตถุดิบ"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={!isAvailable}
                              onClick={() => handleOpenOptionModal(menu)}
                            >
                              <Plus className="w-3.5 h-3.5" /> สั่ง {totalInCartForMenu > 0 && `(${totalInCartForMenu})`}
                            </Button>
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
          <div className="skeuo-card rounded-3xl p-5 flex flex-col min-h-[560px]">
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
                <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl skeuo-inset flex items-center justify-center text-slate-700">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">รายการที่สั่ง</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500">โต๊ะ:</span>
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
                      buttonClassName="py-1.5 px-2.5 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 max-h-72 no-scrollbar">
                  {cartItems.length === 0 ? (
                    <div className="h-full py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Coffee className="w-10 h-10 mb-2 opacity-30" />
                      <p className="font-medium">ยังไม่มีรายการ</p>
                    </div>
                  ) : (
                    cartItems.map((entry) => {
                      const effectivePrice = getItemEffectivePrice(entry);
                      const formattedNote = formatOptionNote(entry.options);

                      return (
                        <div
                          key={entry.cartId}
                          className="p-3 rounded-2xl skeuo-inset text-xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 flex items-center gap-1.5">
                                <span>{entry.item.name}</span>
                                {entry.options.isSpecial && (
                                  <span className="text-[10px] skeuo-badge-amber px-1.5 py-0.2 rounded-md font-medium">
                                    พิเศษ
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                ฿{effectivePrice} x {entry.quantity} = <strong className="text-slate-900 font-medium">฿{effectivePrice * entry.quantity}</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center neu-raised px-1 py-0.5 rounded-xl">
                                <button
                                  onClick={() => updateQuantity(entry.cartId, -1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-5 text-center font-semibold text-slate-900 font-mono">{entry.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(entry.cartId, 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900"
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
                          <div className="flex items-center justify-between pt-1 border-t border-slate-300/60 text-[11px]">
                            <span className="text-slate-500 truncate max-w-[200px]" title={formattedNote || 'ไม่มีหมายเหตุ'}>
                              {formattedNote ? `📝 ${formattedNote}` : '🍽️ ทานที่ร้าน • เผ็ดปกติ'}
                            </span>
                            <button
                              onClick={() => handleOpenOptionModal(entry.item, entry.cartId)}
                              className="text-slate-600 hover:text-slate-900 font-medium text-[10px] shrink-0"
                            >
                              แก้ไข
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bill Summary & Payment Form */}
                <div className="pt-3 border-t border-slate-300/60 space-y-3 mt-auto">
                  <div className="space-y-1 text-xs font-medium">
                    <div className="flex justify-between text-slate-500 font-normal">
                      <span>รวม</span>
                      <span className="font-mono">฿{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-normal">
                      <span>VAT 7%</span>
                      <span className="font-mono">฿{vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-sm text-slate-900 pt-1 border-t border-slate-300/60">
                      <span>สุทธิ</span>
                      <span className="text-base text-slate-900 font-semibold font-mono">฿{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-medium text-slate-500 block">วิธีชำระเงิน</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('qr_promptpay')}
                        className={`py-2.5 px-2 rounded-2xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'qr_promptpay'
                            ? 'neu-pressed text-slate-900 border border-slate-400/50 bg-slate-100/90 shadow-inner'
                            : 'neu-raised text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-slate-700" />
                        <span>พร้อมเพย์</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`py-2.5 px-2 rounded-2xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'cash'
                            ? 'neu-pressed text-slate-900 border border-slate-400/50 bg-slate-100/90 shadow-inner'
                            : 'neu-raised text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-slate-700" />
                        <span>เงินสด</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`py-2.5 px-2 rounded-2xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'credit_card'
                            ? 'neu-pressed text-slate-900 border border-slate-400/50 bg-slate-100/90 shadow-inner'
                            : 'neu-raised text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-slate-700" />
                        <span>บัตรเครดิต</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={handleCheckout}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ยืนยันชำระเงิน</span>
                    {cartItems.length > 0 && (
                      <span className="font-mono text-xs opacity-90 pl-1">
                        (฿{grandTotal.toFixed(2)})
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Real-time BOM Stock Deduction Preview */}
          <div className="skeuo-card rounded-3xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <Layers className="w-4 h-4 text-slate-700" />
              <span>ตัดสต็อกวัตถุดิบ (BOM)</span>
            </div>
            {Object.keys(cartBOMImpact).length === 0 ? (
              <p className="text-[11px] text-slate-400 py-1 font-medium">
                รายการตัดสต็อกจะแสดงเมื่อมีออเดอร์
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                {Object.values(cartBOMImpact).map((impact, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] p-2.5 rounded-xl skeuo-inset"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{impact.name}</span>
                      <div className="text-[10px] text-slate-400">
                        เดิม {impact.current} {impact.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600">
                        -{impact.used} {impact.unit}
                      </span>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        เหลือ {impact.remaining} {impact.unit}
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

              <div className="p-3 bg-slate-50 text-slate-800 rounded-2xl border border-slate-200 flex justify-between items-center font-medium">
                <span>ต้นทุนวัตถุดิบรวม (BOM):</span>
                <span className="font-mono font-normal text-slate-900">฿{previewMenu.recipe_cost}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setPreviewMenu(null)}
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Toast Modal */}
      {lastOrderSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 border border-slate-200 animate-scale-in">
            <div className="w-14 h-14 bg-slate-100 text-slate-800 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">บันทึกออเดอร์สำเร็จ!</h3>
              <p className="text-xs text-slate-500 mt-1">
                เลขที่บิล: <strong className="text-slate-800">{lastOrderSuccess.order_number}</strong> (โต๊ะ {lastOrderSuccess.table_no})
              </p>
              <p className="text-xs text-slate-600 font-normal mt-1">
                ระบบได้ตัดสต็อกวัตถุดิบตามสูตร (BOM) ลงฐานข้อมูลเรียบร้อยแล้ว
              </p>
            </div>
            <Button
              className="w-full"
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
