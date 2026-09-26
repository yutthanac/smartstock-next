'use client';

import React, { useState } from 'react';
import {
  Zap,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { MenuItem, Ingredient, DashboardKPI } from '@/types';
import { Button } from '@/components/Button';
import { PriceAdjustModal } from './PriceAdjustModal';
import { PromoDeployModal } from './PromoDeployModal';

interface ExecutiveActionCardsProps {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  dashboard: DashboardKPI;
  onUpdatePrice: (menuId: number, newPrice: number) => Promise<boolean>;
  onDeployPromotion: (promo: {
    name: string;
    category: string;
    price: number;
    description: string;
    recipes: { ingredient_id: number; quantity_used: number }[];
  }) => Promise<boolean>;
  onAddToPO: (item: {
    ingredient_id?: number;
    name: string;
    quantity: number;
    unit: string;
    cost_per_unit?: number;
    total_price?: number;
  }) => void;
  onShowToast: (msg: string) => void;
}

export function ExecutiveActionCards({
  menuItems,
  ingredients,
  dashboard,
  onUpdatePrice,
  onDeployPromotion,
  onAddToPO,
  onShowToast,
}: ExecutiveActionCardsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Modal states
  const [editingPriceItem, setEditingPriceItem] = useState<MenuItem | null>(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Action status states
  const [priceActionLoading, setPriceActionLoading] = useState(false);
  const [priceActionDone, setPriceActionDone] = useState(false);

  const [promoActionLoading, setPromoActionLoading] = useState(false);
  const [promoActionDone, setPromoActionDone] = useState(false);

  const [poActionDone, setPoActionDone] = useState(false);

  /* ─────────────────────────────────────────────────────────────
     1. CARD 1: Price Optimization Candidate (ปรับราคาด่วน)
     ───────────────────────────────────────────────────────────── */
  // Find a candidate: low margin or price under market average (e.g. price between 40-70 and margin < 60)
  const priceCandidate: MenuItem | null = React.useMemo(() => {
    if (!menuItems || menuItems.length === 0) return null;
    // Prefer items that have orders but low margin
    const sorted = [...menuItems].sort((a, b) => {
      const marginA = a.margin_percent ?? 50;
      const marginB = b.margin_percent ?? 50;
      return marginA - marginB;
    });
    return sorted[0] || menuItems[0];
  }, [menuItems]);

  const currentPrice = priceCandidate?.price || 55;
  const priceLift = currentPrice < 60 ? 10 : 15;
  const recommendedPrice = currentPrice + priceLift;
  const currentMargin = priceCandidate?.margin_percent ?? 45;
  const estRecipeCost = priceCandidate?.recipe_cost ?? (currentPrice * (1 - currentMargin / 100));
  const newMargin = recommendedPrice > 0 ? ((recommendedPrice - estRecipeCost) / recommendedPrice) * 100 : 0;
  const estMonthlyGain = priceLift * (priceCandidate?.order_count && priceCandidate.order_count > 0 ? priceCandidate.order_count : 18) * 3;

  const handleQuickPriceUpdate = async () => {
    if (!priceCandidate) return;
    setPriceActionLoading(true);
    try {
      const ok = await onUpdatePrice(priceCandidate.id, recommendedPrice);
      if (ok) {
        setPriceActionDone(true);
        onShowToast(`ปรับราคา "${priceCandidate.name}" เป็น ฿${recommendedPrice} ลงระบบ POS สำเร็จ`);
      } else {
        onShowToast('ไม่สามารถปรับราคาได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setPriceActionLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     2. CARD 2: Excess Stock Promotion (โปรโมชั่นระบายของ)
     ───────────────────────────────────────────────────────────── */
  const excessIngredient = React.useMemo(() => {
    if (!ingredients || ingredients.length === 0) return null;
    // Sort by largest quantity or quantity significantly above reorder_point
    const sorted = [...ingredients].sort((a, b) => {
      const reorderA = a.reorder_point || 1;
      const reorderB = b.reorder_point || 1;
      const ratioA = a.quantity / reorderA;
      const ratioB = b.quantity / reorderB;
      return ratioB - ratioA;
    });
    return sorted[0] || ingredients[0];
  }, [ingredients]);

  const promoTitle = excessIngredient
    ? `${excessIngredient.name} สดชื่นพิเศษ (โปรโมชั่น)`
    : 'Honey Lemon Cold Brew (โปรโมชั่นพิเศษ)';
  const promoPrice = 69;
  const promoCost = excessIngredient ? (excessIngredient.cost_per_unit || 0.4) * 30 : 22;
  const promoMargin = Math.round(((promoPrice - promoCost) / promoPrice) * 100);

  const handleQuickPromoDeploy = async () => {
    setPromoActionLoading(true);
    try {
      const ok = await onDeployPromotion({
        name: promoTitle,
        category: 'โปรโมชั่นพิเศษ',
        price: promoPrice,
        description: `เมนูโปรโมชั่นเร่งด่วน ระบายสต็อก ${excessIngredient?.name || 'วัตถุดิบค้างสต็อก'} สำหรับลูกค้าหน้าร้าน`,
        recipes: excessIngredient
          ? [{ ingredient_id: excessIngredient.id, quantity_used: 30 }]
          : [],
      });
      if (ok) {
        setPromoActionDone(true);
        onShowToast(`นำเมนู "${promoTitle}" ขึ้นแสดงบนหน้าจอขาย POS สำเร็จ`);
      } else {
        onShowToast('ไม่สามารถเพิ่มโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setPromoActionLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     3. CARD 3: Depletion Alert & Auto PO (เตือนของหมด)
     ───────────────────────────────────────────────────────────── */
  const lowIngredient = React.useMemo(() => {
    if (!ingredients || ingredients.length === 0) return null;
    const low = ingredients.filter((i) => i.quantity <= (i.reorder_point || 0));
    if (low.length > 0) {
      return low.sort((a, b) => a.quantity - b.quantity)[0];
    }
    // If none strictly low, pick the one with lowest ratio
    return [...ingredients].sort((a, b) => (a.quantity / (a.reorder_point || 1)) - (b.quantity / (b.reorder_point || 1)))[0];
  }, [ingredients]);

  const recommendedOrderQty = lowIngredient
    ? Math.max(5, Math.ceil(((lowIngredient.reorder_point || 5) * 2) - lowIngredient.quantity))
    : 10;
  const estOrderCost = lowIngredient
    ? Math.round(recommendedOrderQty * (lowIngredient.cost_per_unit || 250))
    : 2500;

  const handleQuickAddToPO = () => {
    if (!lowIngredient) return;
    onAddToPO({
      ingredient_id: lowIngredient.id,
      name: lowIngredient.name,
      quantity: recommendedOrderQty,
      unit: lowIngredient.unit || 'ชิ้น',
      cost_per_unit: lowIngredient.cost_per_unit || 0,
      total_price: estOrderCost,
    });
    setPoActionDone(true);
    onShowToast(`เพิ่ม "${lowIngredient.name}" (${recommendedOrderQty} ${lowIngredient.unit}) เข้าใบจ่ายตลาดเรียบร้อยแล้ว`);
  };

  return (
    <section className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="px-5 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-stone-900">
                Executive Action Cards
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                3 แอ็กชันสำคัญวันนี้
              </span>
            </div>
            <p className="text-xs text-stone-500 font-normal">
              3 คำแนะนำสำคัญประจำวัน เพื่อช่วยเพิ่มกำไรและป้องกันของขาด
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <span>{isCollapsed ? 'แสดงการ์ด' : 'ย่อเก็บ'}</span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Cards Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ─────────────────────────────────────────────────────────────
              CARD 1: QUICK PRICE ADJUSTMENT
              ───────────────────────────────────────────────────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 font-bold text-[11px] border border-amber-200">
                  <Zap className="w-3 h-3 text-amber-600" /> ปรับราคาด่วน
                </span>
                <span className="text-[11px] font-medium text-amber-800">
                  กำไร {currentMargin.toFixed(0)}% → {newMargin.toFixed(0)}%
                </span>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  {priceCandidate?.name || 'เมนูกาแฟสเปเชียลตี้'}
                </h3>
                <span className="text-xs text-stone-500 font-medium">
                  หมวด: {priceCandidate?.category || 'เครื่องดื่ม'}
                </span>
              </div>

              {/* Price Lift Comparison Box */}
              <div className="p-3 bg-white/90 rounded-xl border border-amber-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block">ราคาปัจจุบัน</span>
                  <span className="text-base font-bold font-mono text-stone-600 line-through">
                    ฿{currentPrice.toFixed(0)}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600" />
                <div className="text-right">
                  <span className="text-[11px] text-amber-800 font-semibold block">ราคาแนะนำ (+฿{priceLift})</span>
                  <span className="text-lg font-bold font-mono text-emerald-700">
                    ฿{recommendedPrice.toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-100/60 text-amber-950 text-xs leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                  <span>กำไรคาดการณ์: +฿{Math.round(estMonthlyGain).toLocaleString()} / เดือน</span>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  ราคาขายต่ำกว่าร้านใกล้เคียง ปรับขึ้นเล็กน้อยเพื่อเพิ่มกำไรต่อแก้วโดยไม่กระทบยอดสั่ง
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                isLoading={priceActionLoading}
                disabled={priceActionDone}
                onClick={handleQuickPriceUpdate}
                icon={priceActionDone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                className={`flex-1 rounded-xl text-xs font-semibold ${
                  priceActionDone
                    ? 'bg-emerald-800 text-white cursor-default'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                {priceActionDone ? 'อัปเดตราคาแล้ว' : `ปรับเป็น ฿${recommendedPrice} ทันที`}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setEditingPriceItem(priceCandidate);
                  setIsPriceModalOpen(true);
                }}
                title="ปรับแต่งราคาเอง"
                className="p-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-100/60 text-amber-900 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              CARD 2: STOCK-CLEARING PROMOTION
              ───────────────────────────────────────────────────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/40 border border-sky-200/80 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-100/80 text-sky-900 font-bold text-[11px] border border-sky-200">
                  <Package className="w-3 h-3 text-sky-600" /> โปรโมชั่นระบายของ
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  มาร์จิ้น ~{promoMargin}%
                </span>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  {promoTitle}
                </h3>
                <span className="text-xs text-sky-800 font-medium flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  ระบายสต็อก: {excessIngredient ? `${excessIngredient.name} (คงเหลือ ${excessIngredient.quantity} ${excessIngredient.unit})` : 'วัตถุดิบค้างสต็อก'}
                </span>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-sky-200/60 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between items-center">
                  <span>ราคาขายโปรโมชั่น:</span>
                  <span className="font-mono font-bold text-stone-900">฿{promoPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ต้นทุนวัตถุดิบ (BOM):</span>
                  <span className="font-mono text-stone-500">~฿{promoCost.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                  <span className="font-semibold text-stone-800">กำไรสุทธิต่อแก้ว:</span>
                  <span className="font-mono font-bold text-emerald-700">฿{(promoPrice - promoCost).toFixed(1)}</span>
                </div>
              </div>

              <p className="text-[11px] text-sky-900/80 leading-relaxed">
                นำวัตถุดิบที่มีเยอะมาทำเมนูพิเศษ ช่วยเพิ่มยอดขายและลดของเหลือค้างสต็อก
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-4 pt-3 border-t border-sky-200/60 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                isLoading={promoActionLoading}
                disabled={promoActionDone}
                onClick={handleQuickPromoDeploy}
                icon={promoActionDone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Package className="w-3.5 h-3.5 text-sky-300" />}
                className={`flex-1 rounded-xl text-xs font-semibold ${
                  promoActionDone
                    ? 'bg-emerald-800 text-white cursor-default'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                {promoActionDone ? 'วางขายบน POS แล้ว' : 'นำขึ้นขายบน POS ทันที'}
              </Button>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(true)}
                title="ปรับแต่งโปรโมชั่น"
                className="p-2 rounded-xl border border-sky-200 bg-white hover:bg-sky-100/60 text-sky-900 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              CARD 3: STOCK DEPLETION & AUTO PO
              ───────────────────────────────────────────────────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/40 border border-rose-200/80 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100/80 text-rose-900 font-bold text-[11px] border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" /> สต็อกเสี่ยงขาด
                </span>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md">
                  เหลือน้อย &lt; 24 ชม.
                </span>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  {lowIngredient?.name || 'เมล็ดกาแฟ House Blend'}
                </h3>
                <span className="text-xs text-rose-800 font-medium block mt-0.5">
                  คงเหลือ: <strong className="font-bold text-rose-900">{lowIngredient?.quantity || 1.5} {lowIngredient?.unit || 'กก.'}</strong> (เกณฑ์เตือน: {lowIngredient?.reorder_point || 5} {lowIngredient?.unit || 'กก.'})
                </span>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-rose-200/60 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-stone-600">
                  <span>ปริมาณที่ควรสั่งเพิ่ม:</span>
                  <span className="font-bold font-mono text-stone-900">+{recommendedOrderQty} {lowIngredient?.unit || 'กก.'}</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>งบประมาณประมาณการ:</span>
                  <span className="font-bold font-mono text-stone-800">฿{estOrderCost.toLocaleString()}</span>
                </div>
                <div className="pt-1 border-t border-stone-100 text-[11px] text-stone-500">
                  กระทบเมนูหลัก: เอสเพรสโซ่, อเมริกาโน่, คาปูชิโน่
                </div>
              </div>

              <p className="text-[11px] text-rose-900/80 leading-relaxed">
                วัตถุดิบใกล้หมด กดเพิ่มรายการลงในใบจ่ายตลาดได้ทันที เพื่อไม่ให้ของขาดตอนเปิดร้าน
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={poActionDone}
                onClick={handleQuickAddToPO}
                icon={poActionDone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />}
                className={`flex-1 rounded-xl text-xs font-semibold ${
                  poActionDone
                    ? 'bg-emerald-800 text-white cursor-default'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                {poActionDone ? 'เพิ่มเข้าใบจ่ายตลาดแล้ว' : `สั่งซื้อ +${recommendedOrderQty} ${lowIngredient?.unit || 'หน่วย'}`}
              </Button>
              <a
                href="/stock/purchase-orders"
                target="_blank"
                rel="noreferrer"
                title="เปิดหน้าใบจ่ายตลาด"
                className="p-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-100/60 text-rose-900 transition-colors inline-flex items-center justify-center"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modals for fine-tuning */}
      <PriceAdjustModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        menuItem={editingPriceItem || priceCandidate}
        recommendedPrice={recommendedPrice}
        reason="ปรับราคาขึ้นเล็กน้อยให้ใกล้เคียงกับร้านรอบข้าง ช่วยเพิ่มกำไรต่อแก้ว"
        onConfirm={async (id, p) => {
          const ok = await onUpdatePrice(id, p);
          if (ok) {
            setPriceActionDone(true);
            onShowToast(`ปรับราคาเมนูเป็น ฿${p} เรียบร้อยแล้ว`);
          }
          return ok;
        }}
      />

      <PromoDeployModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        defaultTitle={promoTitle}
        defaultPrice={promoPrice}
        defaultDescription={`โปรโมชั่นระบายสต็อก ${excessIngredient?.name || 'วัตถุดิบค้างสต็อก'}`}
        targetIngredient={excessIngredient}
        allIngredients={ingredients}
        onConfirm={async (promo) => {
          const ok = await onDeployPromotion(promo);
          if (ok) {
            setPromoActionDone(true);
            onShowToast(`นำเมนูโปรโมชั่น "${promo.name}" ขึ้นระบบ POS เรียบร้อยแล้ว`);
          }
          return ok;
        }}
      />
    </section>
  );
}
