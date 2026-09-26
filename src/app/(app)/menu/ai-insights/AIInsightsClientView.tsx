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
  CloudSun,
  Users,
  DollarSign,
  Activity,
  Flame,
  MessageSquare,
  BarChart3,
  Building2,
  Smile,
  Frown,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Scale,
  Info,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ExecutiveActionCards } from './components/ExecutiveActionCards';

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

export interface DataSourcesStatus {
  google_places: { count: number; active: boolean; details: string };
  foursquare_poi: { count: number; active: boolean; foot_traffic: string; popularity_score: number };
  customer_sentiment: { analyzed_reviews_count: number; active: boolean; sentiment_score: number };
  pos_internal: { active: boolean; net_sales?: number; top_sellers?: string[]; menu_count?: number };
  external_context: {
    active: boolean;
    weather: { temp_c: number; condition: string; is_rainy: boolean };
    day_type: string;
    neighborhood_type: string;
  };
}

export interface MarketIntelligence {
  trending_menus: {
    name: string;
    category: string;
    demand_level: 'สูงมาก' | 'เติบโตต่อเนื่อง' | 'มาแรง';
    reason: string;
    estimated_volume: string;
  }[];
  pricing_strategy: {
    area_average_price: string;
    recommended_sweet_spot: string;
    budget_range: string;
    premium_ceiling: string;
    strategy_note: string;
  };
  location_intelligence: {
    foot_traffic_level: 'หนาแน่นมาก' | 'ปานกลาง' | 'เงียบสงบ';
    peak_hours: string;
    primary_demographic: string;
    mobility_summary: string;
  };
  customer_sentiment: {
    overall_sentiment: 'บวกมาก' | 'บวก' | 'ผสมผสาน';
    top_compliments: string[];
    top_complaints: string[];
    unmet_needs: string[];
  };
  competition_matrix: {
    density_level: 'ดุเดือดมาก' | 'ปานกลาง' | 'แข่งขันต่ำ';
    competitor_count: number;
    our_competitive_edge: string;
    positioning_advice: string[];
  };
  demand_forecast: {
    weather_impact: string;
    seasonal_demand: string;
    immediate_actions: string[];
  };
}

export interface StrategyDebate {
  growth_opinion: {
    advocate: string;
    perspective: string;
    key_points: string[];
  };
  risk_counter: {
    critic: string;
    perspective: string;
    key_points: string[];
  };
  safe_verdict: {
    verdict: string;
    test_action: string;
  };
}

export interface ConfidenceBreakdown {
  real_data_percent: number;
  ai_estimate_percent: number;
  disclaimer: string;
  items: {
    label: string;
    type: 'real' | 'estimated' | 'hybrid';
    percent: number;
    description: string;
  }[];
}

interface CompetitorAnalysisResult {
  location_name: string;
  lat: number;
  lng: number;
  data_sources?: DataSourcesStatus;
  confidence_breakdown?: ConfidenceBreakdown;
  strategy_debate?: StrategyDebate;
  market_intelligence?: MarketIntelligence;
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

interface AIInsightsClientViewProps {
  initialDashboard?: any;
  initialMenuItems?: any[];
  initialIngredients?: any[];
}

export function AIInsightsClientView({
  initialDashboard,
  initialMenuItems,
  initialIngredients,
}: AIInsightsClientViewProps) {
  const {
    dashboard: ctxDashboard,
    menuItems: ctxMenuItems,
    ingredients: ctxIngredients,
    updateMenuItem,
    addMenuItem,
    hydrateData,
  } = useStock();

  useEffect(() => {
    if (initialDashboard || initialMenuItems || initialIngredients) {
      hydrateData({
        dashboard: initialDashboard || undefined,
        menuItems: initialMenuItems,
        ingredients: initialIngredients,
      });
    }
  }, [initialDashboard, initialMenuItems, initialIngredients, hydrateData]);

  const dashboard = ctxDashboard || initialDashboard;
  const menuItems = ctxMenuItems && ctxMenuItems.length > 0 ? ctxMenuItems : initialMenuItems || [];
  const ingredients = ctxIngredients && ctxIngredients.length > 0 ? ctxIngredients : initialIngredients || [];
  const [loading, setLoading] = useState(false);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('market');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleUpdatePrice = async (menuId: number, newPrice: number): Promise<boolean> => {
    try {
      const ok = await updateMenuItem(menuId, { price: newPrice });
      return ok;
    } catch (err) {
      console.error('Error updating menu price:', err);
      return false;
    }
  };

  const handleDeployPromotion = async (promo: {
    name: string;
    category: string;
    price: number;
    description: string;
    recipes: { ingredient_id: number; quantity_used: number }[];
  }): Promise<boolean> => {
    try {
      const ok = await addMenuItem({
        name: promo.name,
        category: promo.category || 'โปรโมชั่นพิเศษ',
        price: promo.price,
        description: promo.description,
        recipes: promo.recipes || [],
      });
      return ok;
    } catch (err) {
      console.error('Error deploying promo:', err);
      return false;
    }
  };

  const handleAddToPO = (item: {
    ingredient_id?: number;
    name: string;
    quantity: number;
    unit: string;
    cost_per_unit?: number;
    total_price?: number;
  }) => {
    try {
      const saved = localStorage.getItem('smartstock_shopping_orders');
      let orders: any[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) orders = parsed;
        } catch {
          orders = [];
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];
      let targetOrder = orders.find((o) => o.status === 'pending' || o.status === 'draft');

      if (!targetOrder) {
        const newId = `PO-${todayStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        targetOrder = {
          id: newId,
          title: 'รายการจ่ายตลาด (แนะนำจาก AI)',
          date: todayStr,
          status: 'pending',
          items: [],
          totalAmount: 0,
        };
        orders.unshift(targetOrder);
      }

      const existingItem = targetOrder.items.find(
        (i: any) => (item.ingredient_id && i.ingredient_id === item.ingredient_id) || i.name === item.name
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
        if (item.cost_per_unit) {
          existingItem.cost_per_unit = item.cost_per_unit;
          existingItem.total_price = existingItem.quantity * item.cost_per_unit;
        }
      } else {
        targetOrder.items.push({
          ingredient_id: item.ingredient_id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          cost_per_unit: item.cost_per_unit,
          total_price: item.total_price || item.quantity * (item.cost_per_unit || 0),
          checked: false,
        });
      }

      targetOrder.totalAmount = targetOrder.items.reduce(
        (sum: number, it: any) =>
          sum + (Number(it.total_price) || Number(it.quantity) * Number(it.cost_per_unit || 0)),
        0
      );

      localStorage.setItem('smartstock_shopping_orders', JSON.stringify(orders));
    } catch (err) {
      console.error('Error adding to shopping orders:', err);
    }
  };
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
  const [expandedDimensions, setExpandedDimensions] = useState<Record<number, boolean>>({});
  const [showConfidenceDetails, setShowConfidenceDetails] = useState(false);
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);
  const [expandedShopDetails, setExpandedShopDetails] = useState<Record<number, boolean>>({});

  const toggleShopDetail = (index: number) => {
    setExpandedShopDetails((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const isAllShopExpanded = competitorData?.competitors?.length
    ? competitorData.competitors.every((_, i) => !!expandedShopDetails[i])
    : false;

  const toggleAllShopDetails = () => {
    if (isAllShopExpanded) {
      setExpandedShopDetails({});
    } else {
      const next: Record<number, boolean> = {};
      competitorData?.competitors?.forEach((_, i) => { next[i] = true; });
      setExpandedShopDetails(next);
    }
  };

  const toggleDimension = (id: number) => {
    setExpandedDimensions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isAllExpanded = [1, 2, 3, 4, 5, 6].every((id) => !!expandedDimensions[id]);

  const toggleAllDimensions = () => {
    if (isAllExpanded) {
      setExpandedDimensions({});
    } else {
      setExpandedDimensions({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });
    }
  };

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
        `/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&locationName=${encodeURIComponent(locName || '')}&filter=${currentFilter}`
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
    fetchNearbyPlaces(mapLat, mapLng, searchRadius, locationName, newFilter);
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

    const cachedCompetitors = localStorage.getItem('smartstock_ai_competitor_insights_v3') || localStorage.getItem('smartstock_ai_competitor_insights_v2');
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
      const topMenuNames = menuItems
        .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
        .slice(0, 3)
        .map((m) => m.name);

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
          salesContext: {
            netSales: dashboard?.today_sales ?? 0,
            topSellers: topMenuNames,
            activeMenuCount: menuItems.length,
          },
        }),
      });

      if (res.ok) {
        const data: CompetitorAnalysisResult = await res.json();
        setCompetitorData(data);
        const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        setCompetitorAnalyzedTime(now);
        localStorage.setItem('smartstock_ai_competitor_insights_v3', JSON.stringify({ data, timestamp: now }));
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
    setMapLat(searchLat);
    setMapLng(searchLng);
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

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Executive Action Cards (Top High-Impact Action Items) */}
        <ExecutiveActionCards
          menuItems={menuItems}
          ingredients={ingredients}
          dashboard={dashboard}
          onUpdatePrice={handleUpdatePrice}
          onDeployPromotion={handleDeployPromotion}
          onAddToPO={handleAddToPO}
          onShowToast={showToast}
        />

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
                  {competitorData && (
                    <button
                      type="button"
                      onClick={() => setIsMapCollapsed(!isMapCollapsed)}
                      className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer transition-all flex items-center gap-1"
                    >
                      {isMapCollapsed ? 'แสดงแผนที่' : 'ย่อแผนที่'}
                      {isMapCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {!isMapCollapsed && (
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
              )}
            </div>

            {/* Data Grounding & Truth Meter */}
            {competitorData && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <span>ที่มาของข้อมูล</span>
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        พิกัดและคะแนนดาวมาจากแผนที่จริง ส่วนเมนูและคำแนะนำประเมินโดย AI
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ข้อมูลจริง {competitorData.confidence_breakdown?.real_data_percent ?? 35}%
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200/80 inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> ประเมินโดย AI {competitorData.confidence_breakdown?.ai_estimate_percent ?? 65}%
                    </span>
                  </div>
                </div>

                {/* Progress bar visual split */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 rounded-full bg-stone-100 overflow-hidden flex">
                    <div
                      style={{ width: `${competitorData.confidence_breakdown?.real_data_percent ?? 35}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title="ข้อมูลจริงจาก Google Maps / OSM"
                    />
                    <div
                      style={{ width: `${competitorData.confidence_breakdown?.ai_estimate_percent ?? 65}%` }}
                      className="bg-amber-400 transition-all duration-500"
                      title="แบบจำลองและการคาดการณ์โดย AI"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-500 gap-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                      พิกัด, ชื่อร้าน, Rating ดาว, Google Reviews (จริง 100%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" />
                      เมนูยอดนิยม, เสียงรีวิว, และ Sweet Spot (คาดการณ์โดย AI)
                    </span>
                  </div>
                </div>

                {/* Toggle Breakdown Details */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="text-stone-500 text-[11px]">
                    {competitorData.confidence_breakdown?.disclaimer ||
                      'หมุดพิกัดและคะแนนดาวมาจากข้อมูลจริงบนแผนที่ ส่วนเมนูและเสียงสะท้อนเป็นแบบจำลองเชิงสถิติ'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfidenceDetails(!showConfidenceDetails)}
                    className="text-stone-700 hover:text-stone-900 font-semibold underline text-xs cursor-pointer flex items-center gap-1"
                  >
                    {showConfidenceDetails ? 'ซ่อนรายละเอียดที่มา' : 'ดูรายละเอียดการแยกแยะ'}
                    {showConfidenceDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Expanded Detailed Breakdown */}
                {showConfidenceDetails && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 animate-in fade-in duration-200">
                    {(competitorData.confidence_breakdown?.items || [
                      {
                        label: 'หมุดพิกัด & ร้านค้า',
                        type: 'real' as const,
                        percent: 100,
                        description: 'ดึงข้อมูลสดจาก Google Places API / OpenStreetMap',
                      },
                      {
                        label: 'คะแนน Rating ดาว',
                        type: 'real' as const,
                        percent: 100,
                        description: 'คะแนนเฉลี่ยจริงบน Google Maps',
                      },
                      {
                        label: 'ช่วงราคา & Foot Traffic',
                        type: 'hybrid' as const,
                        percent: 65,
                        description: 'ประเมินจากระดับราคา Price Level จริง ร่วมกับโมเดล Foursquare',
                      },
                      {
                        label: 'เมนูยอดนิยม & สินค้าขายดี',
                        type: 'estimated' as const,
                        percent: 70,
                        description: 'คาดการณ์จากประเภทคาเฟ่ ทำเล และเทรนด์ผู้บริโภคโดย AI',
                      },
                      {
                        label: 'เสียงสะท้อน คำชม & คำบ่น',
                        type: 'estimated' as const,
                        percent: 85,
                        description: 'จำลองจากรูปแบบความพึงพอใจและ Pain Points ในอุตสาหกรรม (ไม่ใช่คอมเมนต์เดี่ยวรายบุคคล)',
                      },
                    ]).map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          item.type === 'real'
                            ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                            : item.type === 'hybrid'
                            ? 'bg-blue-50/50 border-blue-200/80 text-blue-950'
                            : 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{item.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-white/80">
                            {item.type === 'real' ? 'จริง 100%' : item.type === 'hybrid' ? 'กึ่งจริง 65%' : 'AI คาดการณ์'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 font-normal leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Strategy Debate (โอกาส vs ความเสี่ยง + ข้อสรุปปลอดภัย) */}
            {competitorData?.strategy_debate && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <span>วิเคราะห์รอบด้าน (โอกาส & ความเสี่ยง)</span>
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        เปรียบเทียบจุดเด่นและข้อควรระวัง เพื่อความมั่นใจก่อนเริ่มทำเมนูใหม่
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200/80">
                    วิเคราะห์ 2 มุมมอง
                  </span>
                </div>

                {/* 2 Columns: Growth vs Risk */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Column 1: Growth Strategist */}
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/90 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <h5 className="text-xs sm:text-sm font-bold text-emerald-950">
                        {competitorData.strategy_debate.growth_opinion.advocate}
                      </h5>
                    </div>
                    <p className="text-xs font-normal text-stone-800 leading-relaxed">
                      {competitorData.strategy_debate.growth_opinion.perspective}
                    </p>
                    <div className="pt-2 border-t border-emerald-200/60 space-y-1">
                      <span className="text-[11px] font-semibold text-emerald-900 block">จุดเด่นที่ควรชู:</span>
                      <ul className="space-y-1 text-xs text-stone-700">
                        {competitorData.strategy_debate.growth_opinion.key_points.map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5 inline-block" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Column 2: Devil's Advocate / Risk Caution */}
                  <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/90 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <h5 className="text-xs sm:text-sm font-bold text-rose-950">
                        {competitorData.strategy_debate.risk_counter.critic}
                      </h5>
                    </div>
                    <p className="text-xs font-normal text-stone-800 leading-relaxed">
                      {competitorData.strategy_debate.risk_counter.perspective}
                    </p>
                    <div className="pt-2 border-t border-rose-200/60 space-y-1">
                      <span className="text-[11px] font-semibold text-rose-900 block">จุดควรระวัง & ความเสี่ยง:</span>
                      <ul className="space-y-1 text-xs text-stone-700">
                        {competitorData.strategy_debate.risk_counter.key_points.map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5 inline-block" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Safe Action Plan Banner */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-stone-900 text-white space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-amber-300">
                      {competitorData.strategy_debate.safe_verdict.verdict}
                    </span>
                  </div>
                  <p className="text-xs text-stone-200 font-normal leading-relaxed pl-6">
                    <strong>คำแนะนำเบื้องต้น:</strong> {competitorData.strategy_debate.safe_verdict.test_action}
                  </p>
                </div>
              </div>
            )}

            {/* Strategic Overview & Neighborhood Gap */}
            {competitorData?.neighborhood_summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">ระดับการแข่งขันในย่าน</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 font-medium">ข้อมูลแผนที่</span>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">{competitorData.neighborhood_summary.market_density}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">กลุ่มผู้บริโภคหลัก</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">AI ประเมิน</span>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">{competitorData.neighborhood_summary.target_audience}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-700 font-medium">ช่องว่างตลาดที่น่าสนใจ</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">โอกาสใหม่</span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-950">{competitorData.neighborhood_summary.gap_in_market}</p>
                </div>
              </div>
            )}

            {/* 6 Dimensions Market Intelligence Cards */}
            {competitorData?.market_intelligence && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm sm:text-base font-semibold text-stone-900">
                      การวิเคราะห์ 6 มิติเชิงลึก (Market Intelligence Engine)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 hidden sm:inline">
                      วิเคราะห์เชิงลึกโดย AI ร่วมกับข้อมูลพื้นที่จริง
                    </span>
                    <button
                      type="button"
                      onClick={toggleAllDimensions}
                      className="text-xs px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isAllExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>ยุบทั้งหมด</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>ขยายทั้งหมด</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Dimension 1: Trending Menus & Demand */}
                  <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all hover:border-stone-300">
                    <button
                      type="button"
                      onClick={() => toggleDimension(1)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/80 transition-all cursor-pointer select-none"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-sm sm:text-base font-semibold text-stone-900">
                            1. เมนูยอดนิยม & กำลังมาแรง
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-medium">
                            AI คาดการณ์ 70%
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-normal truncate">
                          {competitorData.market_intelligence.trending_menus.map((m) => m.name).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-normal border border-amber-200/60">
                          ความต้องการสูง
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                          {expandedDimensions[1] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {expandedDimensions[1] && (
                      <div className="p-4 pt-1 border-t border-stone-100 space-y-3 animate-in fade-in duration-200">
                        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>* เมนูเหล่านี้ประเมินจากความต้องการของผู้บริโภคตามประเภทคาเฟ่ในพื้นที่โดย AI (ไม่ใช่ยอดขายจริงของคู่แข่ง)</span>
                        </div>
                        <div className="space-y-2.5">
                          {competitorData.market_intelligence.trending_menus.map((tm, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-sm sm:text-base font-semibold text-stone-900">{tm.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 font-normal">
                                  {tm.demand_level}
                                </span>
                              </div>
                              <p className="text-sm font-normal text-stone-700 leading-relaxed">{tm.reason}</p>
                              <span className="text-xs font-normal text-stone-500 block">
                                ปริมาณคาดการณ์: <strong className="text-stone-700 font-medium">{tm.estimated_volume}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                        <Link
                          href="/menu"
                          className="w-full text-center text-sm font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200/60"
                        >
                          <PlusCircle className="w-4 h-4 text-amber-700" /> ดูสูตรและจัดการเมนูในร้าน
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Dimension 2: Pricing Strategy & Sweet Spot */}
                  <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all hover:border-stone-300">
                    <button
                      type="button"
                      onClick={() => toggleDimension(2)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/80 transition-all cursor-pointer select-none"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-sm sm:text-base font-semibold text-stone-900">
                            2. กลยุทธ์ราคา & Sweet Spot
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/80 font-medium">
                            กึ่งจริง 65% (Google + AI)
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-normal truncate">
                          ราคาเฉลี่ย {competitorData.market_intelligence.pricing_strategy.area_average_price} • Sweet Spot {competitorData.market_intelligence.pricing_strategy.recommended_sweet_spot}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-normal border border-emerald-200/60">
                          {competitorData.market_intelligence.pricing_strategy.recommended_sweet_spot}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                          {expandedDimensions[2] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {expandedDimensions[2] && (
                      <div className="p-4 pt-1 border-t border-stone-100 space-y-3 animate-in fade-in duration-200">
                        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                          <span>* วิเคราะห์จากระดับราคาจริงบน Google Maps ร่วมกับโมเดลการตั้งราคา Sweet Spot โดย AI</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 text-center">
                          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                            <span className="text-xs text-stone-500 block font-normal">ราคาเฉลี่ยในย่าน</span>
                            <span className="text-base sm:text-lg font-bold text-stone-800">{competitorData.market_intelligence.pricing_strategy.area_average_price}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200">
                            <span className="text-xs text-emerald-700 block font-normal">Sweet Spot แนะนำ</span>
                            <span className="text-base sm:text-xl font-extrabold text-emerald-900">{competitorData.market_intelligence.pricing_strategy.recommended_sweet_spot}</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-sm">
                          <div className="flex justify-between items-center text-stone-600 font-normal">
                            <span>ช่วงราคาประหยัด:</span>
                            <span className="font-semibold text-stone-900">{competitorData.market_intelligence.pricing_strategy.budget_range}</span>
                          </div>
                          <div className="flex justify-between items-center text-stone-600 font-normal">
                            <span>เพดานราคาพรีเมียม:</span>
                            <span className="font-semibold text-stone-900">{competitorData.market_intelligence.pricing_strategy.premium_ceiling}</span>
                          </div>
                          <div className="pt-2 border-t border-stone-200/80 text-stone-700 font-normal leading-relaxed">
                            <strong className="text-stone-900 font-semibold">คำแนะนำกลยุทธ์: </strong>
                            {competitorData.market_intelligence.pricing_strategy.strategy_note}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dimension 3: Foot Traffic & Location Mobility */}
                  <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all hover:border-stone-300">
                    <button
                      type="button"
                      onClick={() => toggleDimension(3)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/80 transition-all cursor-pointer select-none"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-sm sm:text-base font-semibold text-stone-900">
                            3. ทำเล & Foot Traffic
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
                            พิกัดจริง & สถิติย่าน
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-normal truncate">
                          Peak: {competitorData.market_intelligence.location_intelligence.peak_hours}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-normal border border-blue-200/60">
                          {competitorData.market_intelligence.location_intelligence.foot_traffic_level}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                          {expandedDimensions[3] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {expandedDimensions[3] && (
                      <div className="p-4 pt-1 border-t border-stone-100 space-y-2.5 animate-in fade-in duration-200">
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                          <span className="text-xs text-stone-500 font-normal block">ช่วงเวลาคนแน่นที่สุด (Peak Hours)</span>
                          <p className="text-sm font-semibold text-stone-900">{competitorData.market_intelligence.location_intelligence.peak_hours}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                          <span className="text-xs text-stone-500 font-normal block">กลุ่มคนเดินหลักในพื้นที่ (Demographics)</span>
                          <p className="text-sm font-normal text-stone-800 leading-relaxed">{competitorData.market_intelligence.location_intelligence.primary_demographic}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-sm font-normal text-blue-950 leading-relaxed">
                          {competitorData.market_intelligence.location_intelligence.mobility_summary}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dimension 4: Customer Sentiment & Unmet Needs */}
                  <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all hover:border-stone-300">
                    <button
                      type="button"
                      onClick={() => toggleDimension(4)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/80 transition-all cursor-pointer select-none"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="text-sm sm:text-base font-semibold text-stone-900">
                            4. เสียงของลูกค้า (Sentiment)
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-medium">
                            แบบจำลอง AI 85%
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-normal truncate">
                          คำชม, ข้อติชม และ Unmet Needs ของลูกค้าในย่าน
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-normal border border-purple-200/60">
                          {competitorData.market_intelligence.customer_sentiment.overall_sentiment}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                          {expandedDimensions[4] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {expandedDimensions[4] && (
                      <div className="p-4 pt-1 border-t border-stone-100 space-y-2.5 animate-in fade-in duration-200">
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>* คำชมและข้อติชมจำลองจากพฤติกรรมผู้บริโภคในอุตสาหกรรมคาเฟ่โดย AI ไม่ใช่คอมเมนต์ส่วนบุคคลจริง</span>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-sm space-y-1">
                          <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                            <Smile className="w-4 h-4 text-emerald-600" /> สิ่งที่ลูกค้าชอบมากที่สุด (แนวโน้มพฤติกรรม):
                          </span>
                          <p className="text-sm font-normal text-stone-800 leading-relaxed">
                            {competitorData.market_intelligence.customer_sentiment.top_compliments.join(' • ')}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-sm space-y-1">
                          <span className="font-semibold text-rose-900 flex items-center gap-1.5">
                            <Frown className="w-4 h-4 text-rose-600" /> จุดที่ลูกค้ามักติ/บ่นร้านแถวนี้ (Pain Points จำลอง):
                          </span>
                          <p className="text-sm font-normal text-stone-800 leading-relaxed">
                            {competitorData.market_intelligence.customer_sentiment.top_complaints.join(' • ')}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-sm space-y-1">
                          <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-600" /> โอกาสที่ยังไม่มีใครตอบสนอง (Unmet Needs):
                          </span>
                          <p className="text-sm font-normal text-stone-900 leading-relaxed">
                            {competitorData.market_intelligence.customer_sentiment.unmet_needs.join(' • ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dimension 5: Competition Matrix & Our Edge */}
                  <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all hover:border-stone-300">
                    <button
                      type="button"
                      onClick={() => toggleDimension(5)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/80 transition-all cursor-pointer select-none"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Target className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-sm sm:text-base font-semibold text-stone-900">
                            5. การแข่งขัน & จุดเด่นของเรา
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
                            พิกัดคู่แข่งจริง
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-normal truncate">
                          {competitorData.market_intelligence.competition_matrix.our_competitive_edge}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-normal border border-rose-200/60">
                          {competitorData.market_intelligence.competition_matrix.density_level}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                          {expandedDimensions[5] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {expandedDimensions[5] && (
                      <div className="p-4 pt-1 border-t border-stone-100 space-y-2.5 animate-in fade-in duration-200">
                        <div className="p-3.5 rounded-xl bg-stone-900 text-white space-y-1.5">
                          <span className="text-xs text-stone-400 font-normal block">จุดเด่นที่ควรชูของร้านเรา (Our Edge)</span>
                          <p className="text-sm font-normal text-emerald-300 leading-relaxed">
                            {competitorData.market_intelligence.competition_matrix.our_competitive_edge}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-sm">
                          <span className="text-xs text-stone-600 font-semibold block">แนวทางวางตำแหน่งร้าน (Positioning Advice)</span>
                          <ul className="space-y-1.5 text-sm font-normal text-stone-700 leading-relaxed">
                            {competitorData.market_intelligence.competition_matrix.positioning_advice.map((adv, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-stone-400 font-bold">•</span>
                                <span>{adv}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dimension 6: Demand Forecast & Weather Impact */}
                  <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all hover:border-stone-300">
                    <button
                      type="button"
                      onClick={() => toggleDimension(6)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/80 transition-all cursor-pointer select-none"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CloudSun className="w-4 h-4 text-sky-600 shrink-0" />
                          <span className="text-sm sm:text-base font-semibold text-stone-900">
                            6. คาดการณ์ Demand & สภาพแวดล้อม
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
                            สภาพอากาศสด
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-normal truncate">
                          ผลกระทบอากาศ & Action ด่วนวันนี้
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-normal border border-sky-200/60">
                          สภาพอากาศเรียลไทม์
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                          {expandedDimensions[6] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {expandedDimensions[6] && (
                      <div className="p-4 pt-1 border-t border-stone-100 space-y-2.5 animate-in fade-in duration-200">
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                          <span className="text-xs text-stone-500 font-normal block">ผลกระทบจากสภาพอากาศวันนี้</span>
                          <p className="text-sm font-normal text-stone-800 leading-relaxed">{competitorData.market_intelligence.demand_forecast.weather_impact}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                          <span className="text-xs text-stone-500 font-normal block">แนวโน้มตามฤดูกาล / ช่วงสัปดาห์</span>
                          <p className="text-sm font-normal text-stone-800 leading-relaxed">{competitorData.market_intelligence.demand_forecast.seasonal_demand}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5 text-sm">
                          <strong className="text-emerald-950 font-semibold block">Action ด่วนที่แนะนำวันนี้:</strong>
                          <ul className="space-y-1 text-sm font-normal text-emerald-900 leading-relaxed">
                            {competitorData.market_intelligence.demand_forecast.immediate_actions.map((act, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5 inline-block" />
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recommended menus from gap analysis */}
            {competitorData?.recommended_menus && competitorData.recommended_menus.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    เมนูแนะนำเจาะตลาดทำเลนี้
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    AI แนะนำจากช่องว่างตลาด
                  </span>
                </div>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-stone-500" />
                    <h4 className="text-sm font-semibold text-stone-900">
                      ร้านคู่แข่งสำคัญ ({competitorData.competitors.length} ร้าน)
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                      พิกัด & เรตติ้งจริง
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleAllShopDetails}
                      className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isAllShopExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>{isAllShopExpanded ? 'ยุบวิเคราะห์ AI' : 'ขยายวิเคราะห์ AI'}</span>
                    </button>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {competitorData.competitors.map((shop, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-4 sm:p-5 space-y-3 hover:border-stone-300 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-stone-400 font-mono">#{idx + 1}</span>
                            <h5 className="font-semibold text-stone-900">{shop.name}</h5>
                            <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-medium">{shop.price_level}</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> ข้อมูลจริง
                            </span>
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
                        <div className="space-y-1">
                          <span className="text-[11px] text-stone-400 font-medium">เมนูที่โดดเด่น (AI ประเมิน):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {shop.signature_menus.map((m, mi) => (
                              <span key={mi} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Collapsible AI Deep Analysis */}
                      <div className="pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => toggleShopDetail(idx)}
                          className="w-full flex items-center justify-between text-xs py-1 text-stone-600 hover:text-stone-900 font-medium cursor-pointer transition-colors"
                        >
                          <span className="flex items-center gap-1.5 flex-wrap">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>การวิเคราะห์ AI เชิงลึก (จุดแข็ง / ข้อติชม / โอกาส)</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              AI จำลอง
                            </span>
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-stone-400">
                            <span>{expandedShopDetails[idx] ? 'ซ่อน' : 'ดูบทวิเคราะห์'}</span>
                            {expandedShopDetails[idx] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </button>

                        {expandedShopDetails[idx] && (
                          <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                            <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px] text-amber-800 flex items-start gap-1">
                              <Info className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                              <span>* ข้อมูลจุดแข็ง/ข้อติชมในส่วนนี้จำลองจากแนวโน้มทั่วไปของร้าน ไม่ใช่คอมเมนต์เดี่ยวจริง</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                                <span className="font-medium text-emerald-800 flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" /> ลูกค้าชอบ (แนวโน้ม)
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
                                  <AlertTriangle className="w-3 h-3" /> ข้อติชม (แนวโน้ม)
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
                        )}
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

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-700 animate-in slide-in-from-bottom-2 duration-200 max-w-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium leading-relaxed">{toastMsg}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="text-stone-400 hover:text-white ml-auto shrink-0 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
