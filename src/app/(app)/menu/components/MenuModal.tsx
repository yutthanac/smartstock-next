import React from 'react';
import { Coffee, X, DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { Ingredient, MenuItem, RecipeItem } from '@/types';
import { ImageUpload } from './ImageUpload';
import { RecipeBuilder } from './RecipeBuilder';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';

interface MenuModalProps {
  isOpen: boolean;
  editingItem: MenuItem | null;
  name: string;
  category: string;
  price: number | string;
  image: string;
  description: string;
  recipes: RecipeItem[];
  ingredients: Ingredient[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setName: (v: string) => void;
  setCategory: (v: string) => void;
  setPrice: (v: any) => void;
  setImage: (v: string) => void;
  setDescription: (v: string) => void;
  onAddRecipeRow: () => void;
  onRemoveRecipeRow: (index: number) => void;
  onUpdateRecipeRow: (index: number, field: string, value: any) => void;
  optionIngredients?: any[];
  onAddOptionRow?: () => void;
  onRemoveOptionRow?: (index: number) => void;
  onUpdateOptionRow?: (index: number, field: string, value: any) => void;
  // Grab delivery props
  isGrab?: boolean;
  setIsGrab?: (v: boolean) => void;
  grabPrice?: number | string;
  setGrabPrice?: (v: any) => void;
  grabGpPercent?: number | string;
  setGrabGpPercent?: (v: any) => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  editingItem,
  name,
  category,
  price,
  image,
  description,
  recipes,
  ingredients,
  onClose,
  onSubmit,
  setName,
  setCategory,
  setPrice,
  setImage,
  setDescription,
  onAddRecipeRow,
  onRemoveRecipeRow,
  onUpdateRecipeRow,
  optionIngredients,
  onAddOptionRow,
  onRemoveOptionRow,
  onUpdateOptionRow,
  isGrab = false,
  setIsGrab,
  grabPrice,
  setGrabPrice,
  grabGpPercent = 30,
  setGrabGpPercent,
}) => {
  if (!isOpen) return null;

  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;

  // Live BOM Cost calculation with unit normalization
  const calculatedCost = recipes.reduce((sum, r) => {
    const ing = ingredients.find((i) => i.id === Number(r.ingredient_id));
    if (!ing) return sum;
    const qty = typeof r.quantity_used === 'number' ? r.quantity_used : parseFloat(r.quantity_used as any) || 0;
    const unitLower = (ing.unit || '').toLowerCase().trim();
    let unitFactor = 1.0;
    if (['กก.', 'กก', 'kg', 'กิโลกรัม'].includes(unitLower)) {
      unitFactor = 0.001;
    } else if (['ลิตร', 'l', 'liter', 'litre'].includes(unitLower)) {
      unitFactor = 0.001;
    }
    return sum + (ing.cost_per_unit * qty * unitFactor);
  }, 0);

  // Dine-in profit & margin
  const calculatedProfit = numPrice - calculatedCost;
  const calculatedMargin = numPrice > 0 ? ((calculatedProfit / numPrice) * 100).toFixed(1) : '0';

  // Grab calculations
  const activeGrabPrice = grabPrice !== undefined && grabPrice !== '' 
    ? (typeof grabPrice === 'number' ? grabPrice : parseFloat(grabPrice) || 0)
    : numPrice;
  const activeGrabGp = grabGpPercent !== undefined && grabGpPercent !== ''
    ? (typeof grabGpPercent === 'number' ? grabGpPercent : parseFloat(grabGpPercent) || 30)
    : 30;

  // Grab financial breakdown:
  // GP Amount (e.g. 30% of Grab selling price)
  const grabGpAmount = activeGrabPrice * (activeGrabGp / 100);
  // Net payout store actually receives from Grab
  const grabNetRevenue = activeGrabPrice - grabGpAmount;
  // Real Net profit after paying GP fee and ingredient BOM cost
  const grabProfit = grabNetRevenue - calculatedCost;
  // Real Net margin % on Grab
  const grabMargin = activeGrabPrice > 0 ? ((grabProfit / activeGrabPrice) * 100).toFixed(1) : '0';
  // Difference compared to dine-in profit
  const profitDiff = grabProfit - calculatedProfit;
  // Recommended Grab price to retain exact same profit (in Baht) as dine-in:
  // NetRevenueNeeded = calculatedCost + calculatedProfit = numPrice
  // GrabPrice * (1 - GP%) = numPrice => GrabPrice = numPrice / (1 - GP%)
  const recommendedGrabPrice = activeGrabGp < 100 && numPrice > 0
    ? Math.ceil(numPrice / (1 - (activeGrabGp / 100)))
    : numPrice;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[96vh] sm:max-h-[90vh] flex flex-col border border-stone-200 animate-scale-in"
      >
        <div className="flex justify-between items-center pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-base">
              {editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Menu Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">ชื่อเมนู</label>
              <input
                type="text"
                required
                placeholder="เช่น เอสเปรสโซ่เย็น, ลาเต้, มัทฉะ, ครัวซองต์"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-900"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">หมวดหมู่</label>
              <Dropdown
                value={category}
                onChange={setCategory}
                options={[
                  'กาแฟ (Coffee)',
                  'ชา & เครื่องดื่ม (Tea & Drinks)',
                  'เบเกอรี่ & เค้ก (Bakery)',
                  'ของทานเล่น (Snacks)',
                  'อาหารจานเดียว (Food)',
                ]}
                className="w-full"
                buttonClassName="py-2.5 px-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">ราคาขายหน้าร้าน (บาท)</label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="เช่น 65"
                value={price === 0 ? '' : price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setPrice(val === '' ? '' : val);
                  }
                }}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  setPrice(isNaN(val) || val < 0 ? 0 : val);
                }}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none font-medium text-stone-900 focus:ring-2 focus:ring-stone-400 font-mono tabular-nums"
              />
            </div>

            {/* Custom Image Upload */}
            <ImageUpload image={image} onChange={setImage} />

            {/* Description */}
            <div className="flex flex-col h-full">
              <label className="font-semibold text-stone-700 block text-xs mb-1">รายละเอียด</label>
              <textarea
                placeholder="รายละเอียด รสชาติ หรือจุดเด่นของเมนู..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full flex-1 min-h-[72px] p-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none resize-none text-xs leading-relaxed text-stone-800"
              />
            </div>
          </div>

          {/* Grab Delivery Config Section */}
          <div className={`p-3.5 rounded-2xl border transition-all ${isGrab ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs' : 'bg-stone-50 border-stone-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isGrab}
                  onChange={(e) => setIsGrab && setIsGrab(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer accent-emerald-600"
                />
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs">
                    G
                  </span>
                  <div>
                    <span className="font-bold text-stone-800 text-xs sm:text-sm">
                      เมนูนี้ขายใน Grab (Delivery)
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      คำนวณหักค่าธรรมเนียม GP {activeGrabGp}% และสรุปกำไรสุทธิที่แท้จริง
                    </span>
                  </div>
                </div>
              </label>

              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0 ${isGrab ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-stone-200/70 text-stone-600'}`}>
                {isGrab ? `หัก GP ${activeGrabGp}%` : 'ขายเฉพาะหน้าร้าน'}
              </span>
            </div>

            {isGrab && (
              <div className="mt-3 pt-3 border-t border-emerald-200/80 space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1 text-xs">
                      ราคาขายบน Grab (บาท)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={`เช่น ${numPrice}`}
                        value={grabPrice === undefined || grabPrice === '' ? '' : grabPrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setGrabPrice && setGrabPrice(val === '' ? '' : val);
                          }
                        }}
                        className="w-full p-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-stone-900 tabular-nums text-xs"
                      />
                      {(!grabPrice || Number(grabPrice) === numPrice) && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          เท่าหน้าร้าน
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setGrabPrice && setGrabPrice(numPrice)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                      >
                        ใช้ราคาหน้าร้าน (฿{numPrice})
                      </button>
                      {recommendedGrabPrice !== numPrice && (
                        <button
                          type="button"
                          onClick={() => setGrabPrice && setGrabPrice(recommendedGrabPrice)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium transition-colors cursor-pointer"
                        >
                          แนะนำชดเชย GP (฿{recommendedGrabPrice})
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1 text-xs">
                      อัตรา GP Grab (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="30"
                      value={grabGpPercent === undefined || grabGpPercent === '' ? '' : grabGpPercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setGrabGpPercent && setGrabGpPercent(val === '' ? '' : val);
                        }
                      }}
                      className="w-full p-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-stone-900 tabular-nums text-xs"
                    />
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setGrabGpPercent && setGrabGpPercent(30)}
                        className={`text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${Number(activeGrabGp) === 30 ? 'bg-emerald-600 text-white font-semibold' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'}`}
                      >
                        30% (มาตรฐาน)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGrabGpPercent && setGrabGpPercent(32.1)}
                        className={`text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${Number(activeGrabGp) === 32.1 ? 'bg-emerald-600 text-white font-semibold' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'}`}
                      >
                        32.1% (รวม VAT 7%)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modular BOM Recipe Section */}
          <RecipeBuilder
            recipes={recipes}
            ingredients={ingredients}
            onAddRow={onAddRecipeRow}
            onRemoveRow={onRemoveRecipeRow}
            onUpdateRow={onUpdateRecipeRow}
            optionIngredients={optionIngredients}
            onAddOptionRow={onAddOptionRow}
            onRemoveOptionRow={onRemoveOptionRow}
            onUpdateOptionRow={onUpdateOptionRow}
          />

          {/* Live BOM Margin Summary */}
          <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-3 border border-stone-800 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="text-xs font-semibold text-stone-300 flex items-center gap-2">
                <span>สรุปต้นทุนและกำไร</span>
                {isGrab && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    เปรียบเทียบ หน้าร้าน vs Grab (หัก GP {activeGrabGp}%)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                ต้นทุนสูตร BOM: <span className="text-white font-bold">฿{calculatedCost.toFixed(2)}</span>
              </div>
            </div>

            {!isGrab ? (
              /* Standard Dine-in view */
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-stone-800/90 border border-stone-700/60">
                  <div className="text-xs text-stone-400 flex items-center justify-center gap-1">
                    <PieChart className="w-3.5 h-3.5" /> ต้นทุน
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5 font-mono tabular-nums">฿{calculatedCost.toFixed(2)}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-800/90 border border-stone-700/60">
                  <div className="text-xs text-stone-400 flex items-center justify-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> กำไร/แก้ว
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5 font-mono tabular-nums">฿{calculatedProfit.toFixed(2)}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-800/90 border border-stone-700/60">
                  <div className="text-xs text-stone-400 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-300" /> Margin
                  </div>
                  <div className="text-sm font-bold text-amber-200 mt-0.5 font-mono tabular-nums">{calculatedMargin}%</div>
                </div>
              </div>
            ) : (
              /* Grab vs Dine-in Comparison Grid */
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Dine-in Summary Card */}
                  <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                        🏪 ขายหน้าร้าน
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">ราคา ฿{numPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-stone-700/40">
                      <div>
                        <span className="text-[10px] text-stone-400 block">กำไรสุทธิ</span>
                        <span className="text-base font-bold text-white font-mono tabular-nums">฿{calculatedProfit.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block">Margin</span>
                        <span className="text-xs font-semibold text-amber-300 font-mono tabular-nums">{calculatedMargin}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Grab Summary Card */}
                  <div className={`p-3 rounded-xl border space-y-1.5 ${
                    grabProfit < 0
                      ? 'bg-rose-950/40 border-rose-700/60'
                      : grabProfit < calculatedProfit
                      ? 'bg-emerald-950/30 border-emerald-800/60'
                      : 'bg-emerald-900/40 border-emerald-600/70'
                  }`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        🛵 ขายผ่าน Grab (GP {activeGrabGp}%)
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono">ราคา ฿{activeGrabPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="text-[11px] space-y-0.5 text-stone-400 font-mono border-t border-stone-700/40 pt-1">
                      <div className="flex justify-between">
                        <span>หัก GP Grab {activeGrabGp}%:</span>
                        <span className="text-rose-300 font-semibold">-฿{grabGpAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>เงินที่ร้านได้รับจริง:</span>
                        <span className="text-stone-200">฿{grabNetRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>หักต้นทุนสูตร:</span>
                        <span className="text-stone-300">-฿{calculatedCost.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-1 border-t border-stone-700/50">
                      <div>
                        <span className="text-[10px] text-stone-400 block">กำไรสุทธิบน Grab</span>
                        <span className={`text-base font-bold font-mono tabular-nums ${
                          grabProfit < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          ฿{grabProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block">Margin สุทธิ</span>
                        <span className={`text-xs font-semibold font-mono tabular-nums ${
                          grabProfit < 0 ? 'text-rose-400' : 'text-emerald-300'
                        }`}>
                          {grabMargin}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Action Guidance Banner */}
                {grabProfit <= 0 ? (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <span className="text-base leading-none">⚠️</span>
                    <div>
                      <span className="font-bold">ขายราคานี้จะขาดทุน ฿{Math.abs(grabProfit).toFixed(2)} ต่อแก้ว!</span>
                      <div className="text-[11px] text-rose-200/90 mt-0.5">
                        เพราะค่า GP {activeGrabGp}% หักเงินไป ฿{grabGpAmount.toFixed(2)} ซึ่งมากกว่ากำไรขั้นต้น แนะนำตั้งราคาขายบน Grab อย่างน้อย ฿{Math.ceil(calculatedCost / (1 - activeGrabGp/100))} บาท
                      </div>
                    </div>
                  </div>
                ) : profitDiff < -1 ? (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">💡</span>
                      <div>
                        <span>ขาย Grab กำไรลดลง <strong className="text-white font-mono">฿{Math.abs(profitDiff).toFixed(2)}</strong>/แก้ว เทียบกับหน้าร้าน</span>
                        <div className="text-[11px] text-amber-300/80">
                          หากต้องการได้กำไรเท่าหน้าร้าน (฿{calculatedProfit.toFixed(2)}) แนะนำตั้งราคา Grab ที่ <strong className="text-white font-mono">฿{recommendedGrabPrice}</strong>
                        </div>
                      </div>
                    </div>
                    {setGrabPrice && activeGrabPrice !== recommendedGrabPrice && (
                      <button
                        type="button"
                        onClick={() => setGrabPrice(recommendedGrabPrice)}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[11px] shrink-0 transition-colors shadow-2xs cursor-pointer"
                      >
                        ปรับเป็น ฿{recommendedGrabPrice} ทันที
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                    <span>✨</span>
                    <span>ราคานี้ครอบคลุมค่า GP {activeGrabGp}% เรียบร้อย ร้านได้รับกำไรสุทธิ ฿{grabProfit.toFixed(2)}/แก้ว</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto rounded-xl bg-stone-900 text-white hover:bg-stone-800"
          >
            {editingItem ? 'บันทึกการแก้ไข' : 'สร้างเมนูและสูตร'}
          </Button>
        </div>
      </form>
    </div>
  );
};
