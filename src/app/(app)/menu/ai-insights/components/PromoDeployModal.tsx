'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag, Check, Sparkles, Layers } from 'lucide-react';
import { Ingredient } from '@/types';
import { Button } from '@/components/Button';

interface PromoDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle?: string;
  defaultPrice?: number;
  defaultDescription?: string;
  targetIngredient?: Ingredient | null;
  allIngredients: Ingredient[];
  onConfirm: (promo: {
    name: string;
    category: string;
    price: number;
    description: string;
    recipes: { ingredient_id: number; quantity_used: number }[];
  }) => Promise<boolean>;
}

export function PromoDeployModal({
  isOpen,
  onClose,
  defaultTitle = '',
  defaultPrice = 65,
  defaultDescription = '',
  targetIngredient = null,
  allIngredients = [],
  onConfirm,
}: PromoDeployModalProps) {
  const [name, setName] = useState(defaultTitle);
  const [price, setPrice] = useState<string>(String(defaultPrice));
  const [description, setDescription] = useState(defaultDescription);
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | ''>(
    targetIngredient ? targetIngredient.id : (allIngredients[0]?.id ?? '')
  );
  const [ingredientQty, setIngredientQty] = useState<string>('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultTitle);
      setPrice(String(defaultPrice));
      setDescription(defaultDescription);
      if (targetIngredient) {
        setSelectedIngredientId(targetIngredient.id);
      }
      setError(null);
    }
  }, [isOpen, defaultTitle, defaultPrice, defaultDescription, targetIngredient]);

  if (!isOpen) return null;

  const currentIngredient = allIngredients.find((i) => i.id === Number(selectedIngredientId));
  const numPrice = parseFloat(price) || 0;
  const numQty = parseFloat(ingredientQty) || 0;
  const estCost = currentIngredient ? (currentIngredient.cost_per_unit || 0) * numQty : 0;
  const estMargin = numPrice > 0 ? ((numPrice - estCost) / numPrice) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อเมนูโปรโมชั่น');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('กรุณาระบุราคาขายที่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const recipes = selectedIngredientId
        ? [{ ingredient_id: Number(selectedIngredientId), quantity_used: numQty > 0 ? numQty : 1 }]
        : [];

      const success = await onConfirm({
        name: name.trim(),
        category: 'โปรโมชั่นพิเศษ',
        price: numPrice,
        description: description.trim(),
        recipes,
      });

      if (success) {
        onClose();
      } else {
        setError('ไม่สามารถสร้างเมนูโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-800">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">สร้างเมนูโปรโมชั่นระบายสต็อกลง POS</h3>
              <p className="text-xs text-stone-500">พร้อมจำหน่ายบนหน้าจอขายหน้าร้านทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Menu Name */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              ชื่อเมนูโปรโมชั่น <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Honey Lemon Cold Brew (โปรโมชั่น)"
              className="w-full px-3.5 py-2 text-sm text-stone-900 bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              required
            />
          </div>

          {/* Price & Target Ingredient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                ราคาโปรโมชั่น (บาท) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">฿</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm font-bold text-stone-900 font-mono bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                หมวดหมู่อัตโนมัติ
              </label>
              <div className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 rounded-xl border border-stone-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>โปรโมชั่นพิเศษ</span>
              </div>
            </div>
          </div>

          {/* Target Ingredient Selection */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              วัตถุดิบล้นสต็อกที่ใช้ระบาย (Recipe BOM)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(Number(e.target.value))}
                className="col-span-2 px-3 py-2 text-xs text-stone-800 bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:border-stone-900"
              >
                <option value="">-- ไม่ระบุสูตร (ขายตรง) --</option>
                {allIngredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} (คงเหลือ {ing.quantity} {ing.unit})
                  </option>
                ))}
              </select>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={ingredientQty}
                  onChange={(e) => setIngredientQty(e.target.value)}
                  placeholder="ปริมาณ"
                  className="w-full px-2.5 py-2 text-xs font-mono text-stone-900 bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:border-stone-900"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">
                  {currentIngredient?.unit || 'หน่วย'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              รายละเอียดและจุดขาย (Description)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น เมนูแนะนำพิเศษสำหรับลูกค้าช่วงบ่าย ระบายน้ำผึ้งแท้คุณภาพสูง"
              className="w-full px-3 py-2 text-xs text-stone-800 bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:border-stone-900 resize-none"
            />
          </div>

          {/* Margin Projection Preview */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-500 block">ต้นทุนวัตถุดิบโดยประมาณ:</span>
              <span className="font-mono font-bold text-stone-800">฿{estCost.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block">อัตรากำไร (Margin):</span>
              <span className="font-mono font-bold text-emerald-700">
                {estMargin > 0 ? `${estMargin.toFixed(1)}%` : '-'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              icon={<Check className="w-3.5 h-3.5" />}
              className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs"
            >
              เปิดขายบนหน้า POS ทันที
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
