'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ingredient, MenuItem, Order, StockMovement, DashboardKPI } from '@/types';
import { useAuth } from './AuthContext';

interface StockContextType {
  ingredients: Ingredient[];
  menuItems: MenuItem[];
  orders: Order[];
  movements: StockMovement[];
  dashboard: DashboardKPI;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'status'>) => Promise<boolean>;
  updateIngredient: (id: number, ingredient: Partial<Ingredient>) => Promise<boolean>;
  deleteIngredient: (id: number) => Promise<boolean>;
  adjustStock: (id: number, type: 'in' | 'out' | 'adjust' | 'waste', amount: number, note: string) => Promise<boolean>;
  addMenuItem: (menu: { name: string; category: string; price: number; image?: string; description?: string; recipes: { ingredient_id: number; quantity_used: number }[] }) => Promise<boolean>;
  updateMenuItem: (id: number, menu: { name?: string; category?: string; price?: number; image?: string; description?: string; recipes?: { ingredient_id: number; quantity_used: number }[] }) => Promise<boolean>;
  deleteMenuItem: (id: number) => Promise<boolean>;
  createOrder: (tableNo: string, items: { menu_item_id: number; quantity: number }[], paymentMethod: 'cash' | 'qr_promptpay' | 'credit_card') => Promise<Order | null>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const defaultDashboard: DashboardKPI = {
  today_sales: 0,
  today_sales_change: 0,
  today_cost: 0,
  today_profit: 0,
  profit_margin: 0,
  low_stock_count: 0,
  total_orders_today: 0,
  sales_7days: [],
  menu_profitability: [],
  ai_recommendations: [],
  low_stock_alerts: [],
};

export function StockProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [dashboard, setDashboard] = useState<DashboardKPI>(defaultDashboard);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all real database records
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [ingRes, menuRes, ordRes, movRes, dashRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ingredients`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/menus`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/pos/orders`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/stock-movements`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/dashboard`, { headers }).catch(() => null),
      ]);

      if (ingRes && ingRes.ok) {
        const data = await ingRes.json();
        setIngredients(data);
      }
      if (menuRes && menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(data);
      }
      if (ordRes && ordRes.ok) {
        const data = await ordRes.json();
        setOrders(data);
      }
      if (movRes && movRes.ok) {
        const data = await movRes.json();
        setMovements(data);
      }
      if (dashRes && dashRes.ok) {
        const data = await dashRes.json();
        setDashboard(data);
      }
    } catch (e) {
      console.error('Error fetching stock data from backend:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Ingredients API calls
  const addIngredient = async (item: Omit<Ingredient, 'id' | 'status'>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error adding ingredient:', e);
      return false;
    }
  };

  const updateIngredient = async (id: number, updated: Partial<Ingredient>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error updating ingredient:', e);
      return false;
    }
  };

  const deleteIngredient = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error deleting ingredient:', e);
      return false;
    }
  };

  const adjustStock = async (id: number, type: 'in' | 'out' | 'adjust' | 'waste', amount: number, note: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ingredients/${id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type, amount, note }),
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error adjusting stock:', e);
      return false;
    }
  };

  // Menu API calls
  const addMenuItem = async (menu: { name: string; category: string; price: number; image?: string; description?: string; recipes: { ingredient_id: number; quantity_used: number }[] }): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/menus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(menu),
      });
      if (res.ok) {
        await fetchData();
        return true;
      } else {
        const err = await res.json();
        console.error('Error from server adding menu:', err);
        return false;
      }
    } catch (e) {
      console.error('Error adding menu:', e);
      return false;
    }
  };

  const updateMenuItem = async (id: number, menu: { name?: string; category?: string; price?: number; image?: string; description?: string; recipes?: { ingredient_id: number; quantity_used: number }[] }): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/menus/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(menu),
      });
      if (res.ok) {
        await fetchData();
        return true;
      } else {
        const err = await res.json();
        console.error('Error from server updating menu:', err);
        return false;
      }
    } catch (e) {
      console.error('Error updating menu:', e);
      return false;
    }
  };

  const deleteMenuItem = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/menus/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error deleting menu:', e);
      return false;
    }
  };

  // Create POS order via backend API (executes BOM deduction in MySQL/SQLite transaction)
  const createOrder = async (
    tableNo: string,
    items: { menu_item_id: number; quantity: number; note?: string }[],
    paymentMethod: 'cash' | 'qr_promptpay' | 'credit_card'
  ): Promise<Order | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/pos/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          table_no: tableNo,
          payment_method: paymentMethod,
          items,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'บันทึกออเดอร์ไม่สำเร็จ');
      }

      const result = await res.json();
      await fetchData(); // Refresh fresh stock & dashboard numbers
      return result.data;
    } catch (e) {
      console.error('Error creating POS order:', e);
      return null;
    }
  };

  return (
    <StockContext.Provider
      value={{
        ingredients,
        menuItems,
        orders,
        movements,
        dashboard,
        isLoading,
        fetchData,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        adjustStock,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        createOrder,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}
