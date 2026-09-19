'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  MapPin,
  Star,
  Store,
  Target,
  ThumbsUp,
  AlertTriangle,
  Check,
  Compass,
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
      <div className="w-full h-[380px] rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-sm animate-pulse">
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
  summary: {
    headline: string;
    health_score: number;
    key_opportunities: string[];
  };
  menu_recommendations: MenuRec[];
  new_recipe_ideas: NewRecipeIdea[];
  cost_saving_tips: string[];
  cross_strategy?: {
    pricing_vs_competitors?: string;
    excess_stock_campaign?: string;
    market_positioning?: string;
  } | null;
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

type TabKey = 'market' | 'menu' | 'cost';

const MAIN_TABS: { key: TabKey; label: string }[] = [
  { key: 'market', label: 'คู่แข่ง & ทำเล' },
  { key: 'menu', label: 'เมนู & ไอเดียใหม่' },
  { key: 'cost', label: 'ลดต้นทุน' },
];

export default function AIInsightsPage() {
  const { dashboard, menuItems, ingredients } = useStock();
  const [loading, setLoading] = useState(false);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('market');
  const [menuSubTab, setMenuSubTab] = useState<'existing' | 'new_ideas'>('existing');

  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState('');

  const [mapLat, setMapLat] = useState(13.7445);
  const [mapLng, setMapLng] = useState(100.5332);
  const [searchRadius, setSearchRadius] = useState(1.5);
  const [locationName, setLocationName] = useState('สยามสแควร์ กรุงเทพฯ');
  const [competitorData, setCompetitorData] = useState<CompetitorAnalysisResult | null>(null);
  const [competitorAnalyzedTime, setCompetitorAnalyzedTime] = useState('');
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [selectedShopNames, setSelectedShopNames] = useState<string[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [placeFilter, setPlaceFilter] = useState<'coffee' | 'all'>('coffee');

  const fetchNearbyPlaces = async (
    lat: number,
    lng: number,
    radius: number,
    locName?: string,
    currentFilter: 'coffee' | 'all' = placeFilter
  ) => {
    setIsNearbyLoading(true);
    try {
      const res = await fetch(
        `/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&locationName=${encodeURIComponent(locName || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.places) {
          setNearbyPlaces(data.places);
          const filtered = data.places.filter((p: any) =>
            currentFilter === 'all' ? true : p.isCafe !== false
          );
          setSelectedShopNames(filtered.map((p: any) => p.name));
        }
      }
    } catch (err) {
      console.error('Failed to fetch nearby places:', err);
    } finally {
      setIsNearbyLoading(false);
    }
  };

  const handlePlaceFilterChange = (newFilter: 'coffee' | 'all') => {
    setPlaceFilter(newFilter);
    if (newFilter === 'coffee') {
      const cafeNames = new Set(
        nearbyPlaces.filter((p) => p.isCafe !== false).map((p) => p.name)
      );
      setSelectedShopNames((prev) => prev.filter((name) => cafeNames.has(name)));
    }
  };

  const toggleSelectShop = (shopName: string) => {
    setSelectedShopNames((prev) =>
      prev.includes(shopName) ? prev.filter((n) => n !== shopName) : [...prev, shopName]
    );
  };

  const selectAllFilteredShops = (filteredPlaces: any[]) => {
    const names = filteredPlaces.map((p) => p.name);
    setSelectedShopNames((prev) => Array.from(new Set([...prev, ...names])));
  };

  const deselectAllFilteredShops = (filteredPlaces: any[]) => {
    const namesToRemove = new Set(filteredPlaces.map((p) => p.name));
    setSelectedShopNames((prev) => prev.filter((n) => !namesToRemove.has(n)));
  };

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
          if (parsed.data) {
            setAnalysis(parsed.data);
            setLastAnalyzedTime(parsed.timestamp);
          }
        } catch { /* fallback */ }
      }
    }

    const cachedCompetitors = localStorage.getItem('smartstock_ai_competitor_insights_v2');
    if (cachedCompetitors) {
      try {
        const parsed = JSON.parse(cachedCompetitors);
        if (parsed.data?.competitors?.length > 0) {
          setCompetitorData(parsed.data);
          setCompetitorAnalyzedTime(parsed.timestamp);
          const targetLat = parsed.data.lat || 13.7445;
          const targetLng = parsed.data.lng || 100.5332;
          const targetLoc = parsed.data.location_name || locationName;
          setMapLat(targetLat);
          setMapLng(targetLng);
          if (parsed.data.location_name) setLocationName(parsed.data.location_name);
          setSelectedShopNames(parsed.data.competitors.map((c: any) => c.name));
          fetchNearbyPlaces(targetLat, targetLng, searchRadius, targetLoc);
          return;
        }
      } catch { /* fallback */ }
    }

    fetchNearbyPlaces(13.7445, 100.5332, 1.5, 'สยามสแควร์ กรุงเทพฯ');
  }, []);

  const handleRunMenuAnalysis = async () => {
    setLoading(true);
    try {
      const excessIngredients = ingredients
        .filter((ing) => ing.quantity > (ing.reorder_point * 3))
        .map((ing) => `${ing.name} (${ing.quantity} ${ing.unit})`);

      const topMenuNames = menuItems
        .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
        .slice(0, 3)
        .map((m) => m.name);

      const mapContext = competitorData ? {
        locationName: competitorData.location_name,
        targetAudience: competitorData.neighborhood_summary?.target_audience,
        marketGap: competitorData.neighborhood_summary?.gap_in_market,
        competitorCount: competitorData.competitors?.length || 0,
      } : {
        locationName,
        targetAudience: 'กลุ่มคนทำงานและวัยรุ่นในพื้นที่',
        marketGap: 'เครื่องดื่ม Specialty คุณภาพดีในราคาสมเหตุสมผล',
        competitorCount: nearbyPlaces.length || 3,
      };

      const res = await fetch('/api/ai/menu-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menus: menuItems,
          ingredients,
          dashboardKPI: dashboard,
          mapContext,
          salesContext: {
            netSales: dashboard?.today_sales ?? 0,
            topSellers: topMenuNames,
            excessStock: excessIngredients.slice(0, 5),
          },
        }),
      });

      if (res.ok) {
        const data: AIAnalysisResult = await res.json();
        setAnalysis(data);
        const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        setLastAnalyzedTime(now);
        localStorage.setItem('smartstock_ai_menu_insights', JSON.stringify({ data, timestamp: now }));
      }
    } catch (err) {
      console.error('Error running AI menu analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCompetitors = async (
    latToUse = mapLat,
    lngToUse = mapLng,
    nameToUse = locationName,
  ) => {
    setCompetitorLoading(true);

    const currentFiltered = nearbyPlaces.filter((p) =>
      placeFilter === 'all' ? true : p.isCafe !== false
    );
    let placesToAnalyze = currentFiltered.filter((p) => selectedShopNames.includes(p.name));
    if (placesToAnalyze.length === 0) {
      if (currentFiltered.length === 0) { setCompetitorLoading(false); return; }
      placesToAnalyze = currentFiltered;
      setSelectedShopNames(currentFiltered.map((p) => p.name));
    }

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
          businessDetails: '',
          selectedPlaces: placesToAnalyze,
        }),
      });

      if (res.ok) {
        const data: CompetitorAnalysisResult = await res.json();
        setCompetitorData(data);
        const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        setCompetitorAnalyzedTime(now);
        localStorage.setItem('smartstock_ai_competitor_insights_v2', JSON.stringify({ data, timestamp: now }));
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
    if (!latChanged && !lngChanged && !newName) return;
    setMapLat(newLat);
    setMapLng(newLng);
    if (newName) setLocationName(newName);
    setCompetitorData(null);
    fetchNearbyPlaces(newLat, newLng, searchRadius, newName);
  };

  const handleNearbySearch = (searchLat: number, searchLng: number) => {
    fetchNearbyPlaces(searchLat, searchLng, searchRadius, locationName);
  };

  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    setCompetitorData(null);
    fetchNearbyPlaces(mapLat, mapLng, newRadius, locationName);
  };

  const displayRecommendations = analysis?.menu_recommendations ?? [];
  const displayNewIdeas = analysis?.new_recipe_ideas ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar title="AI วิเคราะห์ตลาด" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">
        {/* Main Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.label}
                {tab.key === 'market' && competitorData?.competitors?.length
                  ? ` (${competitorData.competitors.length})`
                  : ''}
                {tab.key === 'menu' && (displayRecommendations.length + displayNewIdeas.length > 0)
                  ? ` (${displayRecommendations.length + displayNewIdeas.length})`
                  : ''}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            {activeTab === 'market' ? (
              <>
                {competitorAnalyzedTime && (
                  <span className="text-xs text-stone-400 hidden md:block">
                    อัปเดต {competitorAnalyzedTime} น.
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={competitorLoading}
                  onClick={() => handleAnalyzeCompetitors()}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${competitorLoading ? 'animate-spin' : ''}`} />}
                  className="bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-xs"
                >
                  {competitorLoading ? 'กำลังวิเคราะห์...' : 'ดึงรีวิวใหม่'}
                </Button>
              </>
            ) : (
              <>
                {lastAnalyzedTime && (
                  <span className="text-xs text-stone-400 hidden md:block">
                    อัปเดต {lastAnalyzedTime} น.
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={loading}
                  onClick={() => handleRunMenuAnalysis()}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
                  className="bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-xs"
                >
                  {loading ? 'กำลังวิเคราะห์...' : 'ประมวลผลใหม่'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* =========================================================
            TAB 1: MARKET & COMPETITORS (แผนที่ & คู่แข่ง)
            ========================================================= */}
        {activeTab === 'market' && (
          <div className="space-y-5">
            {/* Map Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-stone-400" />
                  <span className="text-sm font-semibold text-stone-800">ทำเลปัจจุบัน</span>
                  <span className="text-xs text-stone-400">— ลากหมุดเพื่อเปลี่ยนจุดค้นหา</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {locationName}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600">
                    รัศมี {searchRadius} กม.
                  </span>
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
                onPlaceFilterChange={handlePlaceFilterChange}
                onLocationChange={handleLocationChange}
                onNearbySearch={handleNearbySearch}
                disabled={competitorLoading}
              />
            </div>

            {/* Strategic Overview & Neighborhood Gap (Shown when analyzed) */}
            {competitorData?.neighborhood_summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1">
                  <span className="text-xs text-stone-500 font-medium">ระดับการแข่งขัน</span>
                  <p className="text-sm font-semibold text-stone-900">{competitorData.neighborhood_summary.market_density}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1">
                  <span className="text-xs text-stone-500 font-medium">กลุ่มผู้บริโภค</span>
                  <p className="text-sm font-semibold text-stone-900">{competitorData.neighborhood_summary.target_audience}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                  <span className="text-xs text-emerald-700 font-medium">ช่องว่างตลาดที่น่าสนใจ</span>
                  <p className="text-sm font-semibold text-emerald-950">{competitorData.neighborhood_summary.gap_in_market}</p>
                </div>
              </div>
            )}

            {/* Recommended menus from gap analysis */}
            {competitorData?.recommended_menus && competitorData.recommended_menus.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-3">
                <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  เมนูแนะนำเจาะตลาดทำเลนี้
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {competitorData.recommended_menus.map((recMenu, idx) => (
                    <div key={idx} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-[11px] font-medium">
                          {recMenu.category}
                        </span>
                        <span className="font-semibold text-stone-900 text-xs">{recMenu.estimated_price}</span>
                      </div>
                      <h5 className="font-semibold text-stone-900 text-sm">{recMenu.name}</h5>
                      <p className="text-xs text-stone-600">{recMenu.why_sell}</p>
                      <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-500">
                        กลุ่มเป้าหมาย: <span className="font-medium text-stone-700">{recMenu.target_customer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitor Selector or Results */}
            {(!competitorData || competitorData.competitors.length === 0) ? (
              nearbyPlaces.length > 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-stone-900 text-sm">
                          พบ {nearbyPlaces.length} ร้านในรัศมี {searchRadius} กม.
                        </h5>
                        <div className="inline-flex p-0.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => handlePlaceFilterChange('coffee')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              placeFilter === 'coffee' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                            }`}
                          >
                            คาเฟ่ ({nearbyPlaces.filter((p) => p.isCafe !== false).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePlaceFilterChange('all')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              placeFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                            }`}
                          >
                            ทั้งหมด ({nearbyPlaces.length})
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const currentFiltered = nearbyPlaces.filter((p) =>
                          placeFilter === 'all' ? true : p.isCafe !== false
                        );
                        const selectedCount = currentFiltered.filter((p) => selectedShopNames.includes(p.name)).length;
                        return (
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span>เลือกแล้ว <strong className="text-stone-900">{selectedCount}</strong> จาก {currentFiltered.length}</span>
                            <button type="button" onClick={() => selectAllFilteredShops(currentFiltered)} className="text-stone-700 hover:text-stone-900 underline font-medium cursor-pointer">เลือกทั้งหมด</button>
                            <span className="text-stone-300">•</span>
                            <button type="button" onClick={() => deselectAllFilteredShops(currentFiltered)} className="text-stone-500 hover:text-rose-600 underline cursor-pointer">ยกเลิก</button>
                          </div>
                        );
                      })()}
                    </div>

                    {(() => {
                      const currentFiltered = nearbyPlaces.filter((p) =>
                        placeFilter === 'all' ? true : p.isCafe !== false
                      );
                      const selectedCount = currentFiltered.filter((p) => selectedShopNames.includes(p.name)).length;
                      return (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={competitorLoading}
                          disabled={selectedCount === 0 || competitorLoading}
                          onClick={() => handleAnalyzeCompetitors(mapLat, mapLng, locationName)}
                          icon={<Sparkles className={`w-3.5 h-3.5 ${competitorLoading ? 'animate-spin' : ''}`} />}
                          className="bg-stone-900 text-white hover:bg-stone-800 shrink-0 rounded-xl text-xs"
                        >
                          {competitorLoading ? 'กำลังประมวลผล...' : `วิเคราะห์ ${selectedCount} ร้าน`}
                        </Button>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {nearbyPlaces
                      .filter((p) => (placeFilter === 'all' ? true : p.isCafe !== false))
                      .map((np, idx) => {
                        const isSelected = selectedShopNames.includes(np.name);
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleSelectShop(np.name)}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'bg-amber-50/50 border-amber-400/50'
                                : 'bg-stone-50 border-stone-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-stone-900 text-white' : 'border border-stone-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                              </div>
                              <div className="min-w-0">
                                <span className={`text-xs block truncate ${isSelected ? 'font-semibold text-stone-900' : 'text-stone-500'}`}>
                                  {np.name}
                                </span>
                                <span className="text-[10px] text-stone-400 truncate block">
                                  {np.category || (np.isCafe !== false ? 'ร้านกาแฟ' : 'ร้านอาหาร')}
                                </span>
                              </div>
                            </div>
                            {np.distanceKm !== undefined && (
                              <span className="text-[11px] text-stone-400 shrink-0 font-mono">~{np.distanceKm} กม.</span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm space-y-1">
                  <Store className="w-7 h-7 text-stone-300 mx-auto" />
                  <p className="font-medium text-stone-600">ไม่พบร้านในรัศมี {searchRadius} กม.</p>
                  <p className="text-xs">ลองขยายรัศมี หรือเลื่อนหมุดในแผนที่</p>
                </div>
              )
            ) : (
              /* Analyzed Competitors Cards */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-stone-500" />
                    ร้านคู่แข่งสำคัญ ({competitorData.competitors.length} ร้าน)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShopNames(competitorData.competitors.map((c) => c.name));
                      setCompetitorData(null);
                      if (nearbyPlaces.length === 0) fetchNearbyPlaces(mapLat, mapLng, searchRadius, locationName, placeFilter);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-all cursor-pointer"
                  >
                    ← เลือกร้านใหม่
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {competitorData.competitors.map((shop, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 space-y-3 hover:border-stone-300 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-stone-400">#{idx + 1}</span>
                            <h5 className="font-semibold text-stone-900">{shop.name}</h5>
                            <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-medium">{shop.price_level}</span>
                          </div>
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            {shop.location}
                          </p>
                        </div>
                        <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-1 shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          <div className="text-right">
                            <span className="font-bold text-stone-900 text-xs">{shop.rating}</span>
                            <span className="text-[10px] text-stone-500 block">({shop.reviews_count})</span>
                          </div>
                        </div>
                      </div>

                      {shop.signature_menus?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {shop.signature_menus.map((m, mi) => (
                            <span key={mi} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs">{m}</span>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-xs">
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                          <span className="font-medium text-emerald-800 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> ลูกค้าชอบ
                          </span>
                          <ul className="space-y-0.5 text-stone-700">
                            {shop.strengths.slice(0, 2).map((s, si) => (
                              <li key={si} className="flex items-start gap-1 leading-snug">
                                <span className="text-emerald-500 font-bold">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1">
                          <span className="font-medium text-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ข้อติชม
                          </span>
                          <ul className="space-y-0.5 text-stone-700">
                            {shop.weaknesses.slice(0, 2).map((w, wi) => (
                              <li key={wi} className="flex items-start gap-1 leading-snug">
                                <span className="text-rose-500 font-bold">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                        <strong className="text-stone-800 font-semibold">โอกาสของร้านเรา: </strong>
                        <span className="text-stone-700">{shop.opportunity_for_us}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: MENU STRATEGIES & NEW RECIPES
            ========================================================= */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            {/* Sub-toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMenuSubTab('existing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  menuSubTab === 'existing'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                เมนูปัจจุบัน ({displayRecommendations.length})
              </button>
              <button
                type="button"
                onClick={() => setMenuSubTab('new_ideas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  menuSubTab === 'new_ideas'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                ไอเดียเมนูใหม่ ({displayNewIdeas.length})
              </button>
            </div>

            {/* Sub-tab 1: Existing Menu Recommendations */}
            {menuSubTab === 'existing' && (
              displayRecommendations.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm space-y-1">
                  <p className="font-medium text-stone-600">ยังไม่มีข้อมูลเมนูในระบบ</p>
                  <p className="text-xs">กดปุ่ม &apos;ประมวลผลใหม่&apos; ด้านบนเพื่อเริ่มวิเคราะห์เมนูของคุณ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayRecommendations.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 space-y-3 flex flex-col justify-between hover:border-stone-300 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs text-stone-400">{item.category}</span>
                            <h4 className="font-semibold text-stone-900 text-base leading-tight mt-0.5">{item.name}</h4>
                          </div>
                          <Badge variant="neutral" className="text-xs shrink-0">{item.tag}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 py-2 border-y border-stone-100 text-xs">
                          <div>
                            <span className="text-stone-400 block">ยอดขายสะสม</span>
                            <span className="font-bold text-stone-900 text-sm">{item.order_count} แก้ว</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block">Margin</span>
                            <span className="font-bold text-stone-900 text-sm">{item.margin}%</span>
                          </div>
                        </div>

                        <p className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed">
                          <strong className="text-stone-900">การวิเคราะห์:</strong> {item.insight}
                        </p>
                        <p className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-800 font-medium leading-relaxed">
                          <strong>ข้อแนะนำ:</strong> {item.action_step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Sub-tab 2: New Recipe Ideas */}
            {menuSubTab === 'new_ideas' && (
              displayNewIdeas.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm space-y-1">
                  <p className="font-medium text-stone-600">ยังไม่มีไอเดียเมนูใหม่</p>
                  <p className="text-xs">กด &apos;ประมวลผลใหม่&apos; เพื่อรับคำแนะนำสูตรเมนูที่กำไรสูง</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayNewIdeas.map((idea, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs text-stone-400">กลุ่มเป้าหมาย: {idea.target_customer}</span>
                            <h4 className="font-semibold text-stone-900 text-base leading-tight mt-0.5">{idea.title}</h4>
                          </div>
                          <Badge variant="neutral" className="text-xs shrink-0">~{idea.estimated_margin}% margin</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 py-2 border-y border-stone-100 text-xs">
                          <div>
                            <span className="text-stone-400 block">ต้นทุนประมาณ</span>
                            <span className="font-bold text-stone-900 text-sm">{idea.estimated_cost} ฿</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block">ราคาขายแนะนำ</span>
                            <span className="font-bold text-stone-900 text-sm">{idea.suggested_price} ฿</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs text-stone-500">วัตถุดิบ:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {idea.ingredients_used.map((ing, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-xs">{ing}</span>
                            ))}
                          </div>
                        </div>

                        <p className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed">
                          <strong className="text-stone-900">จุดเด่น:</strong> {idea.why_launch}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex justify-end">
                        <Link href="/menu">
                          <Button variant="outline" size="sm" icon={<PlusCircle className="w-3.5 h-3.5" />}
                            className="text-xs rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100">
                            สร้างเมนูนี้
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: COST SAVING TIPS
            ========================================================= */}
        {activeTab === 'cost' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 space-y-4">
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-stone-600" />
              ข้อเสนอแนะลดต้นทุนและคุมของเสีย
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(analysis?.cost_saving_tips || [
                'ตรวจเช็กการละลายของน้ำแข็งในเครื่องทำน้ำแข็งเพื่อควบคุมอุณหภูมิและความชื้น',
                'ใช้ช้อนตวงมาตรฐานสำหรับไซรัปและนม หลีกเลี่ยงการเทเกินมาตรฐาน 5-10 มล./แก้ว',
                'นับสต็อกนมสดและวิปปิ้งครีมแบบรายสัปดาห์ป้องกันหมดอายุก่อนใช้',
                'ตั้ง Reorder Point ตามสถิติยอดขาย 7 วันล่าสุด ไม่สั่งตุนเกินความจำเป็น',
              ]).map((tip, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3 text-xs text-stone-800 leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
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
