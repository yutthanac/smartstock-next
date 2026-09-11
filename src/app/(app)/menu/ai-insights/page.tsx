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
  MapPin,
  Star,
  MessageSquare,
  Compass,
  Store,
  ExternalLink,
  Target,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const InteractiveMapPicker = dynamic(
  () => import('@/components/InteractiveMapPicker').then((mod) => mod.InteractiveMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-sm animate-pulse">
        กำลังโหลดแผนที่...
      </div>
    ),
  }
);

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

interface CompetitorShop {
  name: string;
  location: string;
  rating: number;
  reviews_count: string;
  price_level: string;
  signature_menus: string[];
  review_summary?: string;
  strengths: string[];
  weaknesses: string[];
  opportunity_for_us: string;
}

interface RecommendedMenuItem {
  name: string;
  category: string;
  estimated_price: string;
  why_sell: string;
  market_gap_filled: string;
  target_customer: string;
}

interface CompetitorAnalysisResult {
  location_name: string;
  lat: number;
  lng: number;
  source?: 'gemini' | 'rule_engine';
  neighborhood_summary: {
    market_density: string;
    target_audience: string;
    customer_demands: string;
    gap_in_market: string;
  };
  competitors: CompetitorShop[];
  suggested_positioning: string[];
  recommended_menus?: RecommendedMenuItem[];
}

export default function AIInsightsPage() {
  const { dashboard, menuItems, ingredients } = useStock();
  const [loading, setLoading] = useState<boolean>(false);
  const [competitorLoading, setCompetitorLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'map_competitors' | 'existing' | 'new_ideas' | 'cost_saving'>('map_competitors');
  
  // Menu AI analysis state
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<string>('');

  // Map & Competitor state (Default to Siam Square)
  const [mapLat, setMapLat] = useState<number>(13.7445);
  const [mapLng, setMapLng] = useState<number>(100.5332);
  const [searchRadius, setSearchRadius] = useState<number>(1.5); // km
  const [locationName, setLocationName] = useState<string>('สยามสแควร์ กรุงเทพฯ');
  const [competitorData, setCompetitorData] = useState<CompetitorAnalysisResult | null>(null);
  const [competitorAnalyzedTime, setCompetitorAnalyzedTime] = useState<string>('');
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState<boolean>(false);
  const [placeFilter, setPlaceFilter] = useState<'coffee' | 'all'>('coffee');

  // Details Questionnaire state
  const [businessDetails, setBusinessDetails] = useState<string>('อยากเปิดร้านกาแฟสเปเชียลตี้ มีขนมเบเกอรี่โฮมเมด และมีมุมนั่งทำงานเงียบๆ สบายๆ');
  const [targetBudget, setTargetBudget] = useState<string>('ปานกลาง (แก้วละ 70-120 บาท)');
  const [sellingFocus, setSellingFocus] = useState<string>('กาแฟสด Specialty & เบเกอรี่โฮมเมด');
  const [storeVibe, setStoreVibe] = useState<string>('Cozy / นั่งทำงานได้ (Work & Chill)');

  // Quick nearby cafe search (fetches real shop names without full review analysis)
  const fetchNearbyPlaces = async (lat: number, lng: number, radius: number, locName?: string) => {
    setIsNearbyLoading(true);
    try {
      const res = await fetch(
        `/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&locationName=${encodeURIComponent(locName || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.places) {
          setNearbyPlaces(data.places);
        }
      }
    } catch (err) {
      console.error('Failed to fetch quick nearby places:', err);
    } finally {
      setIsNearbyLoading(false);
    }
  };

  // Load cached AI insights if available
  useEffect(() => {
    if (menuItems.length === 0) {
      localStorage.removeItem('smartstock_ai_menu_insights');
      setAnalysis(null);
      setLastAnalyzedTime('');
    } else {
      const cached = localStorage.getItem('smartstock_ai_menu_insights');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.data?.summary?.headline?.trim()) {
            setAnalysis(parsed.data);
            setLastAnalyzedTime(parsed.timestamp);
          }
        } catch {
          // fallback
        }
      }
    }

    // Load cached competitor data only if from real analysis and not previous mock cache
    const cachedCompetitors = localStorage.getItem('smartstock_ai_competitor_insights_v2');
    if (cachedCompetitors) {
      try {
        const parsed = JSON.parse(cachedCompetitors);
        if (parsed.data?.competitors?.length > 0) {
          setCompetitorData(parsed.data);
          setCompetitorAnalyzedTime(parsed.timestamp);
          if (parsed.data.lat && parsed.data.lng) {
            setMapLat(parsed.data.lat);
            setMapLng(parsed.data.lng);
          }
          if (parsed.data.location_name) {
            setLocationName(parsed.data.location_name);
          }
          return;
        }
      } catch {
        // fallback
      }
    }

    // Initial quick fetch of nearby places on Siam Square
    fetchNearbyPlaces(13.7445, 100.5332, 1.5, 'สยามสแควร์ กรุงเทพฯ');
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

  const handleAnalyzeCompetitors = async (
    latToUse = mapLat,
    lngToUse = mapLng,
    nameToUse = locationName,
    customDetails?: string
  ) => {
    setCompetitorLoading(true);
    const combinedDetails =
      customDetails !== undefined
        ? customDetails
        : `จุดเน้นสินค้า: ${sellingFocus}, ระดับราคา: ${targetBudget}, สไตล์/บรรยากาศ: ${storeVibe}, รายละเอียดเพิ่มเติม: ${businessDetails}`;

    try {
      const res = await fetch('/api/ai/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: latToUse,
          lng: lngToUse,
          radius: Math.round(searchRadius * 1000),
          locationName: nameToUse,
          storeType: 'ร้านกาแฟ / คาเฟ่ (Cafe & Coffee Shop)',
          businessDetails: combinedDetails,
        }),
      });

      if (res.ok) {
        const data: CompetitorAnalysisResult = await res.json();
        setCompetitorData(data);
        const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        setCompetitorAnalyzedTime(now);
        localStorage.setItem(
          'smartstock_ai_competitor_insights_v2',
          JSON.stringify({ data, timestamp: now })
        );
      } else {
        console.error('Failed to fetch competitor data');
      }
    } catch (err) {
      console.error('Error analyzing competitors:', err);
    } finally {
      setCompetitorLoading(false);
    }
  };

  const handleLocationChange = (newLat: number, newLng: number, newName?: string) => {
    const latChanged = Math.abs(newLat - mapLat) > 0.0001;
    const lngChanged = Math.abs(newLng - mapLng) > 0.0001;
    if (!latChanged && !lngChanged && !newName) return; // ignore no-op calls

    setMapLat(newLat);
    setMapLng(newLng);
    if (newName) setLocationName(newName);
    // Reset full AI analysis when location truly changes; fetch quick nearby cafes
    setCompetitorData(null);
    fetchNearbyPlaces(newLat, newLng, searchRadius, newName);
  };

  // Called by the "ค้นหาร้านในบริเวณนี้" floating button — fetches nearby at map center WITHOUT moving the pin
  const handleNearbySearch = (searchLat: number, searchLng: number) => {
    fetchNearbyPlaces(searchLat, searchLng, searchRadius, locationName);
  };

  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    // When radius changes: re-fetch quick nearby cafes for the new radius
    setCompetitorData(null);
    fetchNearbyPlaces(mapLat, mapLng, newRadius, locationName);
  };

  const displayRecommendations =
    analysis?.menu_recommendations && analysis.menu_recommendations.length > 0
      ? analysis.menu_recommendations
      : [];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar
        title="AI วิเคราะห์ตลาด & คู่แข่งรอบข้าง (Market Intelligence)"
        subtitle="ปักหมุดแผนที่ ดึงข้อมูลร้านและสรุปรีวิวลูกค้าจาก Google Maps ด้วย AI เพื่อวิเคราะห์กลยุทธ์ร้าน"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Executive Header Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-stone-900 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 border border-stone-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 text-stone-100 text-xs font-medium border border-stone-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {competitorData?.source === 'gemini' || analysis?.source === 'gemini'
                  ? 'ขับเคลื่อนด้วย Google Gemini & Google Maps Intelligence'
                  : 'ประมวลผลด้วยโมเดลวิเคราะห์ธุรกิจ'}
              </span>
              {(competitorAnalyzedTime || lastAnalyzedTime) && (
                <span className="text-stone-300">
                  • อัปเดตล่าสุด {competitorAnalyzedTime || lastAnalyzedTime} น.
                </span>
              )}
            </div>
            <div className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              {activeTab === 'map_competitors'
                ? `วิเคราะห์ทำเล & รีวิวร้านคู่แข่งรอบ ${locationName.split(',')[0]}`
                : (analysis?.summary?.headline && analysis.summary.headline.trim()) || 'วิเคราะห์ความคุ้มค่าและกลยุทธ์พอร์ตโฟลิโอเมนู'}
            </div>
            <p className="text-xs md:text     -sm text-stone-200 max-w-2xl font-normal leading-relaxed">
              {activeTab === 'map_competitors'
                ? 'ระบบดึงข้อมูลร้านกาแฟคู่แข่งในรัศมีรอบข้าง คะแนนดาว Google Maps ข้อดี-ข้อเสียจากรีวิวจริง เพื่อค้นหาช่องว่างในตลาด'
                : 'นำข้อมูลการตัดสต็อกจริง อัตรากำไรขั้นต้น และยอดขายมาประมวลผลเพื่อเพิ่มยอดขาย'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {activeTab === 'map_competitors' ? (
              <Button
                variant="outline"
                size="md"
                isLoading={competitorLoading}
                onClick={() => handleAnalyzeCompetitors(mapLat, mapLng, locationName)}
                icon={<RefreshCw className={`w-3.5 h-3.5 text-stone-900 ${competitorLoading ? 'animate-spin' : ''}`} />}
                className="!bg-white !text-stone-900 hover:!bg-stone-100 shadow-sm border-white font-semibold rounded-xl"
              >
                {competitorLoading ? 'กำลังดึงข้อมูลรีวิว...' : 'ดึงรีวิวรอบหมุดใหม่'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                isLoading={loading}
                onClick={handleRunAnalysis}
                icon={<RefreshCw className={`w-3.5 h-3.5 text-stone-900 ${loading ? 'animate-spin' : ''}`} />}
                className="!bg-white !text-stone-900 hover:!bg-stone-100 shadow-sm border-white font-semibold rounded-xl"
              >
                {loading ? 'กำลังวิเคราะห์...' : 'ประมวลผลเมนูใหม่'}
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('map_competitors')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'map_competitors'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            ปักหมุด Map & วิเคราะห์คู่แข่ง Google ({competitorData?.competitors?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'existing'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            เมนูปัจจุบัน & แนวทางดันยอดขาย ({displayRecommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('new_ideas')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'new_ideas'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            ไอเดียเมนูใหม่จากสต็อก ({analysis?.new_recipe_ideas?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('cost_saving')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'cost_saving'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            แนวทางลดต้นทุนคลัง ({analysis?.cost_saving_tips?.length || 0})
          </button>
        </div>

        {/* TAB: MAP & COMPETITOR INTELLIGENCE */}
        {activeTab === 'map_competitors' && (
          <div className="space-y-6">
            {/* Map Section */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-stone-500" />
                  <h3 className="text-sm font-semibold text-stone-800">
                    เลือกทำเลที่อยากเปิดร้าน
                  </h3>
                  <span className="text-xs text-stone-400 font-normal">
                    — ลากหมุดแดงวางในแผนที่ ระบบจะดึงร้านในรัศมีมาโชว์ทันที
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                    <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>ตำแหน่งปักหมุด:</span>
                    <span className="text-stone-900 font-bold">{locationName || 'พิกัดที่เลือก'}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 font-medium">
                    รัศมี: <span className="font-bold text-stone-900">{searchRadius} กม.</span>
                  </div>
                </div>
              </div>

              <InteractiveMapPicker
                lat={mapLat}
                lng={mapLng}
                locationName={locationName}
                radiusKm={searchRadius}
                onRadiusChange={handleRadiusChange}
                competitors={competitorData?.competitors || []}
                nearbyPlaces={nearbyPlaces}
                isNearbyLoading={isNearbyLoading}
                placeFilter={placeFilter}
                onPlaceFilterChange={setPlaceFilter}
                onLocationChange={handleLocationChange}
                onNearbySearch={handleNearbySearch}
                disabled={competitorLoading}
              />

              {competitorLoading && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                  <span className="font-medium">AI กำลังดึงรีวิวจริงจาก Google Maps และสรุปกลยุทธ์ร้าน...</span>
                </div>
              )}
            </div>

            {/* Direct Google Maps & AI Review Intelligence Trigger */}
            <div className="p-4 md:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-stone-800 shrink-0" />
                  <h4 className="text-sm font-bold text-stone-900">
                    วิเคราะห์และสรุปรีวิวร้านคู่แข่งด้วย AI
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                    Google Maps Real Data
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  ดึงรีวิวจริงของร้านในรัศมี {searchRadius} กม. และให้ AI สรุปจุดชม ข้อติชม และโอกาสทางธุรกิจของแต่ละร้าน
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                isLoading={competitorLoading}
                onClick={() => handleAnalyzeCompetitors(mapLat, mapLng, locationName)}
                icon={<Sparkles className={`w-3.5 h-3.5 text-amber-300 ${competitorLoading ? 'animate-spin' : ''}`} />}
                className="bg-stone-900 text-white hover:bg-stone-800 shrink-0 font-semibold rounded-xl text-xs shadow-xs px-5 py-2.5 whitespace-nowrap"
              >
                {competitorLoading ? 'AI กำลังประมวลผลรีวิว...' : 'สรุปรีวิวทุกร้านด้วย AI'}
              </Button>
            </div>

            {/* AI Recommended Menus Based on Gap in Market */}
            {competitorData?.recommended_menus && competitorData.recommended_menus.length > 0 && (
              <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border border-amber-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-amber-200/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      เมนูแนะนำที่ควรขายในทำเลนี้ (อิงจากรีวิวและช่องว่างของตลาด)
                    </h4>
                    <p className="text-xs text-stone-500">
                      สรุปจากจุดที่ลูกค้าชอบและบ่นของร้านคู่แข่งรอบข้าง เพื่อวางตำแหน่งเมนูที่ไม่มีใครทำได้ดีในย่านนี้
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {competitorData.recommended_menus.map((recMenu, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-2.5 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold text-[11px]">
                            {recMenu.category}
                          </span>
                          <span className="font-bold text-stone-900 text-xs font-mono">
                            {recMenu.estimated_price}
                          </span>
                        </div>
                        <h5 className="font-bold text-stone-900 text-sm">{recMenu.name}</h5>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {recMenu.why_sell}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-2.5 border-t border-stone-100 text-[11px]">
                        <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-950 space-y-0.5">
                          <strong className="block font-semibold text-emerald-800">อุดช่องโหว่คู่แข่ง:</strong>
                          <span className="leading-snug">{recMenu.market_gap_filled}</span>
                        </div>
                        <div className="text-stone-500 text-[10px] flex items-center gap-1 pt-0.5">
                          <span>กลุ่มเป้าหมาย:</span>
                          <span className="font-medium text-stone-700">{recMenu.target_customer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Neighborhood Analysis Summary */}
            {competitorData?.neighborhood_summary && (
              <div className="p-5 md:p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      สรุปภาพรวมตลาดย่าน {competitorData.location_name.split(',')[0]}
                    </h4>
                    <p className="text-xs text-stone-500">
                      วิเคราะห์ความหนาแน่นและพฤติกรรมลูกค้าจากฐานข้อมูล Google Maps
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                    <span className="text-stone-500 font-medium">ระดับการแข่งขันในย่าน</span>
                    <p className="font-bold text-stone-900 text-sm">
                      {competitorData.neighborhood_summary.market_density}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                    <span className="text-stone-500 font-medium">กลุ่มผู้บริโภคเป้าหมาย</span>
                    <p className="font-semibold text-stone-800">
                      {competitorData.neighborhood_summary.target_audience}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                    <span className="text-emerald-800 font-semibold">
                      ช่องว่างในตลาด (Market Gap)
                    </span>
                    <p className="text-emerald-950 font-medium leading-relaxed">
                      {competitorData.neighborhood_summary.gap_in_market}
                    </p>
                  </div>
                </div>

                {/* Suggested Positioning for Our Store */}
                {competitorData.suggested_positioning?.length > 0 && (
                  <div className="pt-3 border-t border-stone-100 space-y-2">
                    <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      กลยุทธ์ชิงความได้เปรียบที่ร้านเราควรปรับใช้ (Strategic Positioning):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {competitorData.suggested_positioning.map((pos, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-800 font-medium flex items-start gap-2"
                        >
                          <span className="w-4 h-4 rounded-full bg-stone-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{pos}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Competitor Cards Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-stone-700" />
                  ร้านคู่แข่งและสรุปรีวิวจริงจาก Google Maps ({competitorData?.competitors?.length || 0} ร้าน)
                </h4>
                {competitorLoading && (
                  <span className="text-xs text-stone-500 animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> กำลังประมวลผลข้อมูลรีวิว...
                  </span>
                )}
              </div>

              {(!competitorData || competitorData.competitors.length === 0) ? (
                nearbyPlaces.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-stone-900 text-sm">
                            พบสถานที่ในรัศมี {searchRadius} กม.
                          </h5>
                          {/* Filter Tabs */}
                          <div className="inline-flex p-0.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => setPlaceFilter('coffee')}
                              className={`px-2.5 py-1 rounded-md transition-all ${
                                placeFilter === 'coffee'
                                  ? 'bg-white text-stone-900 shadow-xs'
                                  : 'text-stone-500 hover:text-stone-800'
                              }`}
                            >
                              เฉพาะร้านกาแฟ/คาเฟ่ ({nearbyPlaces.filter((p) => p.isCafe !== false).length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlaceFilter('all')}
                              className={`px-2.5 py-1 rounded-md transition-all ${
                                placeFilter === 'all'
                                  ? 'bg-white text-stone-900 shadow-xs'
                                  : 'text-stone-500 hover:text-stone-800'
                              }`}
                            >
                              ทั้งหมด ({nearbyPlaces.length})
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          {placeFilter === 'coffee'
                            ? 'คัดกรองเฉพาะร้านกาแฟและคาเฟ่เพื่อความแม่นยำ (สามารถเลือกสลับดู "ทั้งหมด" เพื่อดูร้านอาหาร/สถานที่อื่นได้)'
                            : 'แสดงร้านค้าและสถานที่ทั้งหมดรอบข้างเพื่อดูภาพรวมย่าน'}
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={competitorLoading}
                        onClick={() => handleAnalyzeCompetitors(mapLat, mapLng, locationName)}
                        icon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                        className="bg-stone-900 text-white hover:bg-stone-800 shrink-0 font-semibold rounded-xl text-xs shadow-xs"
                      >
                        วิเคราะห์ร้านเหล่านี้
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {nearbyPlaces
                        .filter((p) => (placeFilter === 'all' ? true : p.isCafe !== false))
                        .map((np, idx) => {
                          const isCafe = np.isCafe !== false;
                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-2 hover:border-stone-300 transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center shrink-0 text-xs shadow-xs ${
                                  isCafe ? 'bg-amber-500 text-white' : 'bg-stone-400 text-white'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <span className="font-semibold text-stone-800 text-xs truncate block">
                                    {np.name}
                                  </span>
                                  <span className="text-[10px] text-stone-400 block truncate">
                                    {np.category || (isCafe ? 'ร้านกาแฟ / คาเฟ่' : 'ร้านอาหาร / เครื่องดื่ม')}
                                  </span>
                                </div>
                              </div>
                              {np.distanceKm !== undefined && (
                                <span className="text-[11px] text-stone-500 shrink-0 font-mono">
                                  ~{np.distanceKm} กม.
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm space-y-2">
                    <Store className="w-8 h-8 text-stone-300 mx-auto" />
                    <p className="font-semibold text-stone-700">กำลังค้นหาร้านในย่านนี้ หรือยังไม่พบร้านในรัศมี {searchRadius} กม.</p>
                    <p className="text-xs text-stone-400">
                      ลองขยายรัศมี หรือลากหมุดไปยังตำแหน่งที่มีชุมชน/ร้านค้า แล้วกดวิเคราะห์
                    </p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {competitorData.competitors.map((shop, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4 hover:border-stone-400 transition-all"
                    >
                      {/* Shop Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-400">#{idx + 1}</span>
                            <h5 className="font-bold text-stone-900 text-base">{shop.name}</h5>
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-semibold">
                              {shop.price_level}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            {shop.location}
                          </p>
                        </div>

                        {/* Google Rating Pill */}
                        <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-1.5 shrink-0">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                          <div className="text-right">
                            <span className="font-bold text-stone-900 text-xs">{shop.rating}</span>
                            <span className="text-[10px] text-stone-500 block leading-none">
                              ({shop.reviews_count} รีวิว)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Google Maps Review Summary by AI */}
                      {shop.review_summary && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-300/60 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>สรุปภาพรวมรีวิวจริงจาก Google:</span>
                          </div>
                          <p className="text-stone-800 text-[11px] leading-relaxed font-medium">
                            {shop.review_summary}
                          </p>
                        </div>
                      )}

                      {/* Signature Menus */}
                      {shop.signature_menus?.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                            เมนูยอดนิยมของร้านนี้:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {shop.signature_menus.map((m, mi) => (
                              <span
                                key={mi}
                                className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-xs font-medium"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                        {/* Review Sentiment: Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-stone-100 text-xs">
                          {/* Strengths */}
                          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                            <span className="font-semibold text-emerald-800 flex items-center gap-1.5 text-xs">
                              <ThumbsUp className="w-3.5 h-3.5 text-emerald-700" />
                              สิ่งที่ลูกค้าชื่นชอบ
                            </span>
                            <ul className="space-y-1 text-stone-700 font-medium text-[11px]">
                              {shop.strengths.map((s, si) => (
                                <li key={si} className="flex items-start gap-1.5 leading-snug">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Weaknesses / Pain points */}
                          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5">
                            <span className="font-semibold text-rose-800 flex items-center gap-1.5 text-xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              ข้อติชม / ข้อควรปรับปรุง
                            </span>
                            <ul className="space-y-1 text-stone-700 font-medium text-[11px]">
                              {shop.weaknesses.map((w, wi) => (
                                <li key={wi} className="flex items-start gap-1.5 leading-snug">
                                  <span className="text-rose-600 font-bold">•</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Opportunity For Us */}
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
                          <strong className="text-stone-900 font-bold flex items-center gap-1.5 mb-1 text-xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            โอกาสทางธุรกิจของร้านเรา:
                          </strong>
                          <p className="text-stone-700 font-medium leading-relaxed">
                            {shop.opportunity_for_us}
                          </p>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Existing Menu Recommendations */}
        {activeTab === 'existing' && (
          displayRecommendations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/90 text-stone-400 text-sm shadow-xs space-y-2">
              <p className="font-semibold text-stone-700">ยังไม่มีข้อมูลเมนูในระบบ</p>
              <p className="text-xs text-stone-400">กรุณาเพิ่มเมนูและผูกสูตรวัตถุดิบเพื่อเริ่มวิเคราะห์ความคุ้มค่า</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayRecommendations.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4 hover:border-stone-400 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs text-stone-400 font-medium">{item.category}</span>
                        <h4 className="font-bold text-stone-900 text-lg leading-tight mt-0.5">
                          {item.name}
                        </h4>
                      </div>
                      <Badge variant="neutral" className="text-xs px-2.5 py-1 shrink-0 font-medium">
                        {item.tag}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-2 border-y border-stone-100 text-xs">
                      <div>
                        <span className="text-stone-400 block font-normal">ยอดขายสะสม</span>
                        <span className="font-bold text-stone-900 text-base">{item.order_count} แก้ว/จาน</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block font-normal">อัตรากำไร (Margin)</span>
                        <span className="font-bold text-stone-900 text-base">{item.margin}%</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-700 leading-relaxed font-normal">
                      <strong className="text-stone-900 font-semibold">มุมมอง AI:</strong> {item.insight}
                    </div>

                    <div className="p-3 rounded-xl bg-stone-100/70 border border-stone-200 text-xs text-stone-900 leading-relaxed font-medium">
                      <strong className="text-stone-900 font-bold">สิ่งที่ควรทำ:</strong> {item.action_step}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB: New Ideas */}
        {activeTab === 'new_ideas' && (
          (!analysis?.new_recipe_ideas || analysis.new_recipe_ideas.length === 0) ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm space-y-2">
              <p className="font-semibold text-stone-700">ยังไม่มีข้อมูลไอเดียเมนูใหม่</p>
              <p className="text-xs text-stone-400">เพิ่มเมนูและสต็อกวัตถุดิบ จากนั้นกดประมวลผลใหม่</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {analysis.new_recipe_ideas.map((idea, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs text-stone-500 font-medium">กลุ่มเป้าหมาย: {idea.target_customer}</span>
                        <h4 className="font-bold text-stone-900 text-lg leading-tight mt-0.5">
                          {idea.title}
                        </h4>
                      </div>
                      <Badge variant="neutral" className="text-xs px-2.5 py-1 shrink-0 font-medium">
                        มาร์จิ้น ~{idea.estimated_margin}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-2 border-y border-stone-100 text-xs">
                      <div>
                        <span className="text-stone-500 block font-normal">ต้นทุนประมาณการ</span>
                        <span className="font-bold text-stone-900 text-base">{idea.estimated_cost} ฿</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block font-normal">ราคาขายแนะนำ</span>
                        <span className="font-bold text-stone-900 text-base">{idea.suggested_price} ฿</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <span className="text-stone-500 font-medium">วัตถุดิบที่ใช้:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {idea.ingredients_used.map((ing, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-800 text-xs font-medium"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-700 leading-relaxed mt-3">
                      <strong className="text-stone-900 font-semibold">เหตุผลที่ควรเริ่มขาย:</strong> {idea.why_launch}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
                    <Link href="/menu">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<PlusCircle className="w-3.5 h-3.5" />}
                        className="text-xs rounded-xl border-stone-300 text-stone-800 hover:bg-stone-100 font-medium"
                      >
                        นำไปสร้างเป็นเมนูใหม่
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB: Cost Saving Tips */}
        {activeTab === 'cost_saving' && (
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-stone-800" />
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
                  className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 flex items-start gap-3 text-xs md:text-sm text-stone-800 font-medium leading-relaxed"
                >
                  <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-900 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-stone-800">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
