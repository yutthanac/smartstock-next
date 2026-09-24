import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, ACTIVE_STORE_COOKIE_NAME } from './cookies';
import {
  DashboardKPI,
  Ingredient,
  MenuItem,
  MenuOptionIngredient,
  Order,
  StockMovement,
  UnitSetting,
  UserProfile,
  WasteStatsResponse,
} from '@/types';
import { StoreInfo } from './AuthContext';

const rawApiUrl =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000/api';
// Resolve localhost to 127.0.0.1 to avoid Windows IPv6 (::1) lookup latency
const INTERNAL_API_URL = rawApiUrl.replace('://localhost:', '://127.0.0.1:');

export interface ServerSession {
  token: string | null;
  storeId: string | null;
}

/**
 * Reads auth credentials directly from incoming HTTP request cookies on the server.
 */
export async function getServerSession(): Promise<ServerSession> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
    const storeId = cookieStore.get(ACTIVE_STORE_COOKIE_NAME)?.value || null;
    return { token, storeId };
  } catch {
    return { token: null, storeId: null };
  }
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const ssrCache = new Map<string, CacheEntry<any>>();
const SSR_CACHE_TTL_MS = 4000; // 4s TTL connects hover prefetch with instant click

/**
 * Authenticated Server-Side Fetch helper.
 * Attaches Authorization and X-Store-ID headers to communicate with Laravel backend.
 */
export async function fetchServerApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const { token, storeId } = await getServerSession();

  // Check short-lived SSR cache (fast prefetch-to-click transition)
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const cacheKey = `${storeId || 'default'}:${token ? token.slice(-8) : 'anon'}:${endpoint}`;

  if (isGet && ssrCache.has(cacheKey)) {
    const entry = ssrCache.get(cacheKey)!;
    if (Date.now() - entry.timestamp < SSR_CACHE_TTL_MS) {
      return entry.data as T;
    }
    ssrCache.delete(cacheKey);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (storeId) {
    headers['X-Store-ID'] = storeId;
  }

  try {
    // 3.5s timeout prevents SSR page transition from freezing
    const signal = options.signal || AbortSignal.timeout(3500);

    const res = await fetch(`${INTERNAL_API_URL}${endpoint}`, {
      ...options,
      headers,
      signal,
      cache: 'no-store', // Always request fresh data from upstream
    });

    if (!res.ok) {
      console.warn(`[SSR Fetch Warning] ${endpoint} returned status ${res.status}`);
      return null;
    }

    const data = (await res.json()) as T;

    if (isGet) {
      ssrCache.set(cacheKey, { data, timestamp: Date.now() });
      if (ssrCache.size > 150) {
        const oldest = ssrCache.keys().next().value;
        if (oldest) ssrCache.delete(oldest);
      }
    }

    return data;
  } catch (error) {
    console.error(`[SSR Fetch Error] Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

// Dedicated SSR Loaders
export async function getServerDashboard(): Promise<DashboardKPI | null> {
  return fetchServerApi<DashboardKPI>('/dashboard');
}

export async function getServerIngredients(): Promise<Ingredient[]> {
  const data = await fetchServerApi<Ingredient[]>('/ingredients');
  return Array.isArray(data) ? data : [];
}

export async function getServerMenuItems(): Promise<MenuItem[]> {
  const data = await fetchServerApi<MenuItem[]>('/menus');
  return Array.isArray(data) ? data : [];
}

export async function getServerMenuOptions(): Promise<MenuOptionIngredient[]> {
  const data = await fetchServerApi<MenuOptionIngredient[]>('/menu-options');
  return Array.isArray(data) ? data : [];
}

export async function getServerOrders(): Promise<Order[]> {
  const data = await fetchServerApi<Order[]>('/pos/orders');
  return Array.isArray(data) ? data : [];
}

export async function getServerStockMovements(): Promise<StockMovement[]> {
  const data = await fetchServerApi<StockMovement[]>('/stock-movements');
  return Array.isArray(data) ? data : [];
}

export async function getServerUnits(): Promise<UnitSetting[]> {
  const data = await fetchServerApi<UnitSetting[]>('/units');
  return Array.isArray(data) ? data : [];
}

export async function getServerStores(): Promise<StoreInfo[]> {
  const data = await fetchServerApi<StoreInfo[]>('/stores');
  return Array.isArray(data) ? data : [];
}

export async function getServerUsers(): Promise<UserProfile[]> {
  const data = await fetchServerApi<any>('/users');
  if (data && Array.isArray(data.users)) {
    return data.users;
  }
  return Array.isArray(data) ? data : [];
}

export async function getServerRoles(): Promise<any[]> {
  const data = await fetchServerApi<any>('/roles-permissions');
  if (data && Array.isArray(data.roles)) {
    return data.roles;
  }
  return Array.isArray(data) ? data : [];
}

export async function getServerWasteStats(): Promise<WasteStatsResponse | null> {
  return fetchServerApi<WasteStatsResponse>('/reports/waste-stats');
}
