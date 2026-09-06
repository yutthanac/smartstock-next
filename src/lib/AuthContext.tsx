'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile } from '@/types';

export interface StoreInfo {
  id: number;
  name: string;
  slug: string;
  type: 'restaurant' | 'cafe' | 'bakery' | 'other';
  description?: string | null;
  logo_path?: string | null;
  logo_url?: string | null;
  theme_color?: string;
  menu_config?: Record<string, boolean>;
  phone?: string | null;
  address?: string | null;
  my_role: 'owner' | 'manager' | 'staff';
  is_active: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  stores: StoreInfo[];
  activeStore: StoreInfo | null;
  setActiveStore: (store: StoreInfo) => void;
  refreshStores: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY        = 'smartstock_auth_token';
const USER_KEY         = 'smartstock_auth_user';
const STORES_KEY       = 'smartstock_stores';
const ACTIVE_STORE_KEY = 'smartstock_active_store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<UserProfile | null>(null);
  const [token, setToken]             = useState<string | null>(null);
  const [stores, setStores]           = useState<StoreInfo[]>([]);
  const [activeStore, setActiveStoreState] = useState<StoreInfo | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  const refreshStores = async () => {
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
      if (!activeToken) return;

      const res = await fetch(`${API_BASE_URL}/stores`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const storeList: StoreInfo[] = await res.json();
        setStores(storeList);
        localStorage.setItem(STORES_KEY, JSON.stringify(storeList));

        // Sync activeStore if already chosen
        setActiveStoreState((current) => {
          if (!current) return null;
          const updated = storeList.find((s) => s.id === current.id) || current;
          localStorage.setItem(ACTIVE_STORE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.warn('Failed to refresh stores:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken       = localStorage.getItem(TOKEN_KEY);
        const storedUser        = localStorage.getItem(USER_KEY);
        const storedStores      = localStorage.getItem(STORES_KEY);
        const storedActiveStore = localStorage.getItem(ACTIVE_STORE_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          if (storedStores)      setStores(JSON.parse(storedStores));
          if (storedActiveStore) setActiveStoreState(JSON.parse(storedActiveStore));

          // Verify token with backend — also refreshes stores list
          try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${storedToken}`,
                Accept: 'application/json',
              },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                setUser(data.user);
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
              }
              if (data.stores) {
                const sList: StoreInfo[] = data.stores;
                setStores(sList);
                localStorage.setItem(STORES_KEY, JSON.stringify(sList));

                // Prioritize Cafe store as default for admin/first time
                if (storedActiveStore) {
                  const parsed = JSON.parse(storedActiveStore);
                  const freshActive = sList.find((s) => s.id === parsed.id) || parsed;
                  setActiveStoreState(freshActive);
                  localStorage.setItem(ACTIVE_STORE_KEY, JSON.stringify(freshActive));
                } else if (sList.length > 0) {
                  const defaultCafe = sList.find((s) => s.type === 'cafe' || s.name.includes('คาเฟ่') || s.name.toLowerCase().includes('cafe')) || sList[0];
                  setActiveStoreState(defaultCafe);
                  localStorage.setItem(ACTIVE_STORE_KEY, JSON.stringify(defaultCafe));
                }
              }
            } else if (res.status === 401) {
              clearAuth();
            }
          } catch (e) {
            console.warn('Auth verify network error:', e);
          }
        }
      } catch (e) {
        console.error('Failed to init auth:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute        = pathname === '/login' || pathname === '/register';
    const isStorePickerRoute = pathname === '/store-picker';

    if (!user && !isAuthRoute) {
      router.push('/login');
    } else if (user && isAuthRoute) {
      // If already has an active store, skip picker
      if (activeStore) {
        router.push('/dashboard');
      } else {
        router.push('/store-picker');
      }
    } else if (user && isStorePickerRoute && activeStore) {
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router, activeStore]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.message || data.errors?.email?.[0] || 'เข้าสู่ระบบไม่สำเร็จ',
        };
      }

      const storeList: StoreInfo[] = data.stores ?? [];

      setToken(data.access_token);
      setUser(data.user);
      setStores(storeList);
      localStorage.setItem(TOKEN_KEY,  data.access_token);
      localStorage.setItem(USER_KEY,   JSON.stringify(data.user));
      localStorage.setItem(STORES_KEY, JSON.stringify(storeList));

      // Prioritize Cafe store as default
      const cafeStore = storeList.find((s) => s.type === 'cafe' || s.name.includes('คาเฟ่') || s.name.toLowerCase().includes('cafe')) || storeList[0];

      if (cafeStore) {
        setActiveStoreState(cafeStore);
        localStorage.setItem(ACTIVE_STORE_KEY, JSON.stringify(cafeStore));
        router.push('/dashboard');
      } else {
        router.push('/store-picker');
      }

      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        error: 'ไม่สามารถเชื่อมต่อกับ Server ได้ กรุณาตรวจสอบว่า Backend กำลังทำงานอยู่',
      };
    }
  };

  const setActiveStore = (store: StoreInfo) => {
    setActiveStoreState(store);
    localStorage.setItem(ACTIVE_STORE_KEY, JSON.stringify(store));
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(STORES_KEY);
    localStorage.removeItem(ACTIVE_STORE_KEY);
    setToken(null);
    setUser(null);
    setStores([]);
    setActiveStoreState(null);
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const hasRole = (role: string) => user?.roles?.includes(role) || false;
  const hasPermission = (permission: string) => user?.permissions?.includes(permission) || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        stores,
        activeStore,
        setActiveStore,
        refreshStores,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
