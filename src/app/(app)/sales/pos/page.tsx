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
    const shots = options.extraShots ?? (options.isSpecial ? 1 : 0);
    if (shots > 0) parts.push(`เพิ่ม ${shots} ช็อต (+฿${shots * 15})`);
    if (options.diningOption && options.diningOption !== 'ทานที่ร้าน') parts.push('🥤 กลับบ้าน');
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
      extraShots: 0,
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

  // Calculate totals: base price + extra shots (+15฿ each) + blend upcharge (+10฿)
  const getItemEffectivePrice = (entry: CartEntry) => {
    const shots = entry.options.extraShots ?? (entry.options.isSpecial ? 1 : 0);
    const blendExtra = entry.options.temperature === 'ปั่น (+10฿)' ? 10 : 0;
    return entry.item.price + shots * 15 + blendExtra;
  };

  const subtotal = cartItems.reduce((sum, c) => sum + getItemEffectivePrice(c) * c.quantity, 0);
  // No VAT — ราคาที่เห็นคือราคาสุทธิ
  const grandTotal = subtotal;

  // Compute Total BOM stock impact in current cart
  const cartBOMImpact: {
    [ingId: number]: { name: string; unit: string; current: number; used: number; remaining: number };
  } = {};

  const addBOMImpact = (ingId: number, ingName: string, ingUnit: string, ingCurrent: number, usedQty: number) => {
    if (!cartBOMImpact[ingId]) {
      cartBOMImpact[ingId] = { name: ingName, unit: ingUnit, current: ingCurrent, used: 0, remaining: ingCurrent };
    }
    cartBOMImpact[ingId].used = Number((cartBOMImpact[ingId].used + usedQty).toFixed(3));
    cartBOMImpact[ingId].remaining = Math.max(0, Number((cartBOMImpact[ingId].current - cartBOMImpact[ingId].used).toFixed(3)));
  };

  cartItems.forEach(({ item, quantity, options }) => {
    const shots = options.extraShots ?? (options.isSpecial ? 1 : 0);
    const customNote = options.customNote || '';
    const sweetness = options.sweetness || 'หวาน 100%';

    // Sweetness multiplier: check 100% before 0%
    let sweetnessMultiplier = 1.0;
    if (customNote.includes('ไม่ใส่ไซรัป')) {
      sweetnessMultiplier = 0.0;
    } else if (sweetness.includes('125%') || sweetness.includes('หวานมาก')) {
      sweetnessMultiplier = 1.25;
    } else if (sweetness.includes('100%')) {
      sweetnessMultiplier = 1.0;
    } else if (sweetness.includes('75%')) {
      sweetnessMultiplier = 0.75;
    } else if (sweetness.includes('50%') || sweetness.includes('หวานน้อย')) {
      sweetnessMultiplier = 0.50;
    } else if (sweetness.includes('25%')) {
      sweetnessMultiplier = 0.25;
    } else if (sweetness.includes('0%') || sweetness.includes('ไม่หวาน')) {
      sweetnessMultiplier = 0.0;
    }

    item.recipes?.forEach((r) => {
      const ing = ingredients.find((i) => i.id === r.ingredient_id);
      if (!ing) return;

      const ingNameLower = ing.name.toLowerCase();
      const ingCatLower = (ing.category || '').toLowerCase();

      const isCoffee =
        (ingNameLower.includes('เมล็ดกาแฟ') ||
          ingNameLower.includes('กาแฟคั่ว') ||
          (ingNameLower.includes('กาแฟ') && !ingNameLower.includes('แก้ว'))) ||
        (ingCatLower.includes('เมล็ดกาแฟ') ||
          (ingCatLower.includes('กาแฟ') && !ingCatLower.includes('แก้ว')));
      const isSweetener =
        ingNameLower.includes('ไซรัป') ||
        ingNameLower.includes('syrup') ||
        ingNameLower.includes('นมข้นหวาน') ||
        ingNameLower.includes('น้ำผึ้ง') ||
        ingNameLower.includes('น้ำเชื่อม') ||
        ingCatLower.includes('ไซรัป');

      let mult = 1.0;
      if (isCoffee) {
        mult = 1.0 + shots;
      } else if (isSweetener) {
        mult = sweetnessMultiplier;
      }

      const usedQty = (r.quantity_used || 0) * quantity * mult;
      if (usedQty > 0) {
        addBOMImpact(ing.id, ing.name, ing.unit, ing.quantity, usedQty);
      }
    });

    // If takeaway, try to find a cup ingredient and deduct 1 per qty
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
        addBOMImpact(cupIng.id, cupIng.name, cupIng.unit, cupIng.quantity, quantity);
      }
    }
  });

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
    } else {
      alert('บันทึกออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar
        title="ขายหน้าร้าน"
        subtitle="ขายหน้าร้าน พร้อมตัดสต็อกอัตโนมัติตามสูตร"
      />

      <main className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Area: Menu Selector & Category Filters */}
        <div className="flex-1 flex flex-col gap-5 min-w-0 w-full">
          {/* Filter Bar & Search */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Category pills with smooth scrolling on mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {dynamicCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-xs font-semibold'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/60'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* View switcher & Search */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 shrink-0 border border-stone-200/60">
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    viewMode === 'card'
                      ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="มุมมองการ์ด (Card View)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">การ์ด</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="มุมมองรายการ (List View)"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">รายการ</span>
                </button>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเมนู..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full pl-9 pr-3 text-xs sm:text-sm rounded-xl border border-stone-200/90 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors font-normal shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Menu Items Render */}
          {filteredMenu.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/90 text-stone-400 text-sm shadow-xs">
              <Coffee className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
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
                    className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between ${
                      !isAvailable ? 'opacity-60' : ''
                    }`}
                  >
                    <div>
                      <div className="relative h-40 bg-stone-100 overflow-hidden group">
                        <img
                          src={menu.image || '/images/logo_ss.png'}
                          alt={menu.name}
                          className={`w-full h-full ${
                            menu.image
                              ? 'object-cover group-hover:scale-105 transition-transform duration-300'
                              : 'object-contain p-6 opacity-30 grayscale contrast-75'
                          }`}
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-md text-white">
                            {menu.category}
                          </span>
                        </div>
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <button
                            onClick={() => handleOpenOptionModal(menu)}
                            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-stone-700 shadow-2xs transition-colors cursor-pointer"
                            title="เลือกตัวเลือกพิเศษ (ความเผ็ด, พิเศษ, หมายเหตุ)"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPreviewMenu(menu)}
                            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-stone-700 shadow-2xs transition-colors cursor-pointer"
                            title="ดูสูตรวัตถุดิบ (BOM Preview)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm bg-rose-600 px-3 py-1 rounded-lg">
                              Sold Out!
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-stone-900 text-sm">{menu.name}</h3>
                          <span className="font-bold text-sm text-stone-900 shrink-0 font-mono tabular-nums">฿{menu.price.toFixed(2)}</span>
                        </div>
                        {menu.description && (
                          <p className="text-xs text-stone-500 line-clamp-1">{menu.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div className="text-xs text-stone-500 font-medium">
                        ต้นทุน: <span className="font-semibold text-stone-800 font-mono tabular-nums">฿{menu.recipe_cost}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={!isAvailable}
                          onClick={() => handleOpenOptionModal(menu)}
                          className="h-9 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
                          title="เลือกรายละเอียดเพื่อสั่ง"
                        >
                          <Plus className="w-3.5 h-3.5" />
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
            <div className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-900 text-sm font-semibold">
                      <th className="py-3.5 px-4 font-semibold text-stone-900 whitespace-nowrap">เมนู</th>
                      <th className="py-3.5 px-4 font-semibold text-stone-900 whitespace-nowrap">หมวดหมู่</th>
                      <th className="py-3.5 px-4 font-semibold text-stone-900 text-right whitespace-nowrap">ราคา</th>
                      <th className="py-3.5 px-4 font-semibold text-stone-900 text-right whitespace-nowrap">ต้นทุน</th>
                      <th className="py-3.5 px-4 font-semibold text-stone-900 text-center whitespace-nowrap w-24">สูตร</th>
                      <th className="py-3.5 px-4 font-semibold text-stone-900 text-center whitespace-nowrap w-28">สั่งซื้อ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredMenu.map((menu) => {
                      const totalInCartForMenu = cartItems
                        .filter((c) => c.item.id === menu.id)
                        .reduce((sum, c) => sum + c.quantity, 0);
                      const isAvailable = menu.status !== 'sold_out';

                      return (
                        <tr key={menu.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/80 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                                <img
                                  src={menu.image || '/images/logo_ss.png'}
                                  alt={menu.name}
                                  className={`w-full h-full ${menu.image ? 'object-cover rounded-lg' : 'object-contain opacity-30 grayscale'}`}
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-stone-900 text-sm">{menu.name}</div>
                                {menu.description && (
                                  <div className="text-xs text-stone-500 line-clamp-1">{menu.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                              {menu.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-stone-900 text-sm font-mono tabular-nums whitespace-nowrap">
                            ฿{menu.price.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-stone-500 whitespace-nowrap font-mono tabular-nums">
                            ฿{menu.recipe_cost.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setPreviewMenu(menu)}
                              title="ดูสูตรวัตถุดิบ"
                              className="w-8 h-8 p-0 rounded-xl inline-flex items-center justify-center bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={!isAvailable}
                              onClick={() => handleOpenOptionModal(menu)}
                              icon={<Plus className="w-3.5 h-3.5" />}
                              className="whitespace-nowrap font-medium bg-stone-900 text-white hover:bg-stone-800 rounded-xl"
                            >
                              สั่ง {totalInCartForMenu > 0 && `(${totalInCartForMenu})`}
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
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 flex flex-col min-h-[560px]">
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
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-stone-900 text-sm">รายการที่สั่ง</h3>
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      onClick={() => setCartItems([])}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors cursor-pointer"
                    >
                      ล้างตะกร้า
                    </button>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 max-h-72 no-scrollbar">
                  {cartItems.length === 0 ? (
                    <div className="h-full py-12 flex flex-col items-center justify-center text-stone-400 text-xs">
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
                          className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-sm space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-stone-900 flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold">{entry.item.name}</span>
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
                                {(() => { const shots = entry.options.extraShots ?? (entry.options.isSpecial ? 1 : 0); return shots > 0 ? (
                                  <span className="text-xs bg-[#f5efe6] text-[#78350f] border border-[#e8ded0] px-1.5 py-0.5 rounded-md font-medium">
                                    +{shots}ช็อต
                                  </span>
                                ) : null; })()}
                                {entry.options.diningOption === 'กลับบ้าน' && (
                                  <span className="text-xs bg-stone-100 text-stone-700 border border-stone-200 px-1.5 py-0.5 rounded-md font-medium">
                                    กลับบ้าน
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-500 font-mono tabular-nums">
                                ฿{effectivePrice} x {entry.quantity} = <strong className="text-stone-900 font-semibold font-mono tabular-nums">฿{effectivePrice * entry.quantity}</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center bg-white border border-stone-200 px-1 py-0.5 rounded-lg shadow-2xs">
                                <button
                                  onClick={() => updateQuantity(entry.cartId, -1)}
                                  className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-5 text-center font-bold text-stone-900 font-mono tabular-nums">{entry.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(entry.cartId, 1)}
                                  className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => deleteCartItem(entry.cartId)}
                                className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Display Selected Note/Options */}
                          <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-xs">
                            <span className="text-stone-500 truncate max-w-[200px]" title={formattedNote || 'ไม่มีหมายเหตุ'}>
                              {formattedNote ? formattedNote : 'ทานที่ร้าน • หวาน 100%'}
                            </span>
                            <button
                              onClick={() => handleOpenOptionModal(entry.item, entry.cartId)}
                              className="text-stone-600 hover:text-stone-900 font-medium text-xs shrink-0 cursor-pointer"
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
                <div className="pt-3 border-t border-stone-100 space-y-3 mt-auto">
                  <div className="space-y-1 text-xs font-medium">
                    <div className="flex justify-between font-bold text-sm text-stone-900 py-1">
                      <span>ยอดรวม</span>
                      <span className="text-base text-stone-900 font-bold font-mono tabular-nums">฿{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-medium text-stone-500 block">วิธีชำระเงิน</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('qr_promptpay')}
                        className={`h-14 px-2 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          paymentMethod === 'qr_promptpay'
                            ? 'bg-stone-900 text-white shadow-xs font-semibold'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>พร้อมเพย์</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`h-14 px-2 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          paymentMethod === 'cash'
                            ? 'bg-stone-900 text-white shadow-xs font-semibold'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>เงินสด</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`h-14 px-2 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          paymentMethod === 'credit_card'
                            ? 'bg-stone-900 text-white shadow-xs font-semibold'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>บัตรเครดิต</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={handleCheckout}
                    className="w-full h-11 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ยืนยันชำระเงิน</span>
                    {cartItems.length > 0 && (
                      <span className="font-mono tabular-nums text-xs opacity-90 pl-1">
                        ฿{grandTotal.toFixed(2)}
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Real-time BOM Stock Deduction Preview (Only show in cart view, not while customizing) */}
          {!optionTargetMenu && (
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-800 font-semibold text-xs">
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
                <p className="text-xs text-stone-400 py-1 font-medium">
                  รายการตัดสต็อกจะแสดงเมื่อมีออเดอร์
                </p>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {Object.values(cartBOMImpact).map((impact, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-200/60"
                    >
                      <div>
                        <span className="font-semibold text-stone-900">{impact.name}</span>
                        <div className="text-xs text-stone-400">
                          เดิม {impact.current} {impact.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-stone-900 font-mono tabular-nums">
                          -{impact.used} {impact.unit}
                        </span>
                        <div className="text-xs text-stone-500 font-medium font-mono tabular-nums">
                          เหลือ {impact.remaining} {impact.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Recipe Preview Modal */}
      {previewMenu && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-stone-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-base">{previewMenu.name}</h3>
                <p className="text-stone-500">หมวดหมู่: {previewMenu.category} • ราคา: ฿{previewMenu.price}</p>
              </div>
              <button
                onClick={() => setPreviewMenu(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="font-bold text-stone-800 flex items-center gap-1.5">
                <span>สูตรวัตถุดิบ:</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
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
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setPreviewMenu(null)}
                className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Toast Modal */}
      {lastOrderSuccess && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 border border-stone-200 animate-scale-in">
            <div className="w-14 h-14 bg-stone-100 text-stone-900 rounded-2xl mx-auto flex items-center justify-center shadow-xs border border-stone-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">บันทึกออเดอร์สำเร็จ!</h3>
              <p className="text-xs text-stone-500 mt-1">
                เลขที่บิล: <strong className="text-stone-800">{lastOrderSuccess.order_number}</strong> (โต๊ะ {lastOrderSuccess.table_no})
              </p>
              <p className="text-xs text-stone-600 font-normal mt-1">
                ตัดสต็อกวัตถุดิบตามสูตรเรียบร้อย
              </p>
            </div>
            <Button
              className="w-full rounded-xl bg-stone-900 text-white hover:bg-stone-800"
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
