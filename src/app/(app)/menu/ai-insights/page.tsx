'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
  BarChart3,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import Link from 'next/link';

interface MenuRec {
  id: number;
  name: string;
  category: string;
  strategy_type: 'star' | 'high_margin' | 'promote' | 'adjust_price';
  order_count: number;
  margin: number;
  tag: string;
  insight: string;
  action_step: string;
}

interface NewRecipeIdea {
  title: string;
  target_customer: string;
  ingredients_used: string[];
  estimated_cost: number;
  suggested_price: number;
  estimated_margin: number;
  why_launch: string;
}

interface AIAnalysisResult {
  source?: 'gemini' | 'rule_engine';
  note?: string;
  summary: {
    headline: string;
    health_score: number;
    key_opportunities: string[];
  };
  menu_recommendations: MenuRec[];
  new_recipe_ideas: NewRecipeIdea[];
  cost_saving_tips: string[];
}

export default function AIInsightsPage() {
  const { dashboard, menuItems, ingredients } = useStock();
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'existing' | 'new_ideas' | 'cost_saving'>('existing');
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<string>('');

  // Load cached AI insights if available
  useEffect(() => {
    const cached = localStorage.getItem('smartstock_ai_menu_insights');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAnalysis(parsed.data);
        setLastAnalyzedTime(parsed.timestamp);
      } catch {
        // fallback to initial
      }
    }
  }, []);

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/menu-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menus: menuItems,
          ingredients,
          dashboardKPI: dashboard,
        }),
      });

      if (res.ok) {
        const data: AIAnalysisResult = await res.json();
        setAnalysis(data);
        const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        setLastAnalyzedTime(now);
        localStorage.setItem(
          'smartstock_ai_menu_insights',
          JSON.stringify({ data, timestamp: now })
        );
      } else {
        console.error('Failed to fetch AI insights');
      }
    } catch (err) {
      console.error('Error running AI analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fallback items from dashboard if no custom analysis yet
  const displayRecommendations =
    analysis?.menu_recommendations && analysis.menu_recommendations.length > 0
      ? analysis.menu_recommendations
      : (dashboard?.ai_recommendations || []).map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          strategy_type: (r.margin >= 60 ? 'high_margin' : 'star') as any,
          order_count: r.order_count,
          margin: r.margin,
          tag: r.tag,
          insight: r.insight,
          action_step: 'พิจารณาทำโปรโมชันคู่กับสินค้าขายดีเพื่อเพิ่มกำไรรวม',
        }));

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Topbar
        title="AI วิเคราะห์เมนู & กลยุทธ์เครื่องดื่ม"
        subtitle="ประมวลผลความคุ้มค่า ต้นทุนต่อสูตร และเมนูแนะนำผ่านระบบ AI วิเคราะห์ธุรกิจ"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Executive Header Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs font-normal border border-slate-700/60">
              <Sparkles className="w-3.5 h-3.5 text-slate-300" />
              <span>
                {analysis?.source === 'gemini'
                  ? 'ขับเคลื่อนด้วย Google Gemini Flash'
                  : 'ประมวลผลด้วยโมเดลวิเคราะห์ธุรกิจภายในร้าน'}
              </span>
              {lastAnalyzedTime && (
                <span className="text-slate-400">• อัปเดตล่าสุด {lastAnalyzedTime} น.</span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {analysis?.summary?.headline || 'วิเคราะห์ความคุ้มค่าและกลยุทธ์พอร์ตโฟลิโอเมนู'}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              นำข้อมูลการตัดสต็อกจริง อัตรากำไรขั้นต้น และพฤติกรรมการสั่งซื้อของลูกค้า
              มาประมวลผลเพื่อสร้างข้อได้เปรียบทางธุรกิจ
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              isLoading={loading}
              onClick={handleRunAnalysis}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-sm border border-white font-medium"
            >
              {loading ? 'กำลังวิเคราะห์...' : 'ประมวลผลใหม่ (Re-generate)'}
            </Button>
          </div>
        </div>

        {/* Highlight Stats / Opportunities */}
        {analysis?.summary?.key_opportunities && analysis.summary.key_opportunities.length > 0 && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>โอกาสสำคัญในการเพิ่มยอดขาย & ลดต้นทุน (Strategic Highlights)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.summary.key_opportunities.map((opp, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-700 font-normal"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{opp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('existing')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'existing'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            เมนูปัจจุบัน & แนวทางดันยอดขาย ({displayRecommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('new_ideas')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'new_ideas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ไอเดียเมนูใหม่จากสต็อกที่มี ({analysis?.new_recipe_ideas?.length || 2})
          </button>
          <button
            onClick={() => setActiveTab('cost_saving')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'cost_saving'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            แนวทางลดของเสีย & ควบคุมต้นทุน ({analysis?.cost_saving_tips?.length || 2})
          </button>
        </div>

        {/* TAB 1: Existing Menu Recommendations */}
        {activeTab === 'existing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayRecommendations.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base">{item.name}</h3>
                      <div className="text-xs text-slate-500 mt-0.5 font-normal">
                        หมวดหมู่: {item.category} • ยอดสั่งซื้อ {item.order_count} แก้ว
                      </div>
                    </div>
                    <Badge
                      variant={item.margin >= 60 ? 'neutral' : 'warning'}
                      size="sm"
                      className="font-normal"
                    >
                      {item.tag}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-500 font-normal">อัตรากำไร (Margin)</div>
                      <div className="text-base font-semibold text-slate-900 mt-0.5">
                        {item.margin}%
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-500 font-normal">ยอดขายสะสม</div>
                      <div className="text-base font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-slate-700" />
                        {item.order_count || 0} แก้ว
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 text-xs font-normal">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 space-y-1.5">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <span>บทวิเคราะห์:</span>
                      </div>
                      <p className="leading-relaxed text-slate-600">{item.insight}</p>
                      {item.action_step && (
                        <div className="pt-2 border-t border-slate-200/60 mt-2 text-slate-800">
                          <strong>แผนปฏิบัติการ:</strong> {item.action_step}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-normal">
                  <span className="text-slate-400">คำนวณจากสูตร BOM ล่าสุด</span>
                  <Link
                    href="/menu"
                    className="text-slate-700 hover:text-slate-900 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    ปรับปรุงสูตรเมนู <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: New Recipe Ideas */}
        {activeTab === 'new_ideas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(analysis?.new_recipe_ideas || [
              {
                title: 'ครีมชีส โฟมมัทฉะลาเต้ (Cream Cheese Foam Matcha)',
                target_customer: 'กลุ่ม Gen-Z และคนทำงานที่ชอบเครื่องดื่มหน้าตาสวยงามถ่ายรูปลงโซเชียล',
                ingredients_used: ['ผงมัทฉะพรีเมียม', 'วิปปิ้งครีม', 'นมสดรสจืด'],
                estimated_cost: 28,
                suggested_price: 85,
                estimated_margin: 67,
                why_launch: 'ใช้วัตถุดิบนมและผงชาที่มีในสต็อกอยู่แล้ว ไม่ต้องสต็อกวัตถุดิบใหม่ แต่เพิ่มมูลค่าราคาขายได้สูง',
              },
              {
                title: 'ฮันนี่ เลมอน โคลด์บรูว์ (Honey Lemon Cold Brew)',
                target_customer: 'ลูกค้าสายสดชื่น ดื่มช่วงบ่ายแทนเครื่องดื่มรสหวานจัด',
                ingredients_used: ['เมล็ดกาแฟคั่วกลาง', 'น้ำผึ้งแท้', 'เลมอนสด'],
                estimated_cost: 22,
                suggested_price: 75,
                estimated_margin: 70,
                why_launch: 'ช่วยระบายเมล็ดกาแฟและน้ำผึ้ง กำไรขั้นต้นสูงกว่า 70% และเสิร์ฟได้รวดเร็ว',
              },
            ]).map((idea, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base">{idea.title}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        เป้าหมาย: {idea.target_customer}
                      </div>
                    </div>
                    <Badge variant="neutral" size="sm">
                      มาร์จิ้น ~{idea.estimated_margin}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 py-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-500">ต้นทุนประมาณ</div>
                      <div className="text-sm font-semibold text-slate-800 mt-0.5">
                        ฿{idea.estimated_cost}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-500">ราคาแนะนำ</div>
                      <div className="text-sm font-semibold text-slate-800 mt-0.5">
                        ฿{idea.suggested_price}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-500">กำไรต่อแก้ว</div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        ฿{idea.suggested_price - idea.estimated_cost}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">วัตถุดิบที่ต้องใช้:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {idea.ingredients_used.map((ing, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px]"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 leading-relaxed mt-3">
                      <strong className="text-slate-800">เหตุผลที่ควรเริ่มขาย:</strong> {idea.why_launch}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <Link href="/menu">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<PlusCircle className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      นำไปสร้างเป็นเมนูใหม่
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Cost Saving Tips */}
        {activeTab === 'cost_saving' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-800" />
              ข้อเสนอแนะควบคุมต้นทุนและลดของเสียวัตถุดิบ (Wastage Reduction)
            </h3>
            <div className="space-y-3">
              {(analysis?.cost_saving_tips || [
                'ตรวจเช็กการละลายและสเกลน้ำแข็งในเครื่องทำน้ำแข็งเพื่อควบคุมอุณหภูมิและลดการละลายเร็วเกินไป',
                'ใช้ช้อนตวงหรือกระบอกตวงมาตรฐานสำหรับไซรัปและนม เพื่อหลีกเลี่ยงการเทเกินมาตรฐานแก้วละ 5-10 มล.',
                'ตรวจนับสต็อกกลุ่มนมสดและวิปปิ้งครีมแบบรายสัปดาห์ (Weekly Stock Count) เพื่อป้องกันการหมดอายุก่อนเปิดใช้',
                'ตั้งเกณฑ์จุดสั่งซื้อวัตถุดิบ (Reorder Point) ตามสถิติยอดขายจริง 7 วันล่าสุด ไม่สั่งตุนเกินความจำเป็น',
              ]).map((tip, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs md:text-sm text-slate-700 font-normal leading-relaxed"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-800 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    {idx + 1}
                  </div>
                  <p>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
