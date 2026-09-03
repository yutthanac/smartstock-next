'use server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper for backend requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.message || `HTTP error ${res.status}`,
      };
    }

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to connect to backend server',
    };
  }
}

// -------------------------------------------------------------
// 1. Dashboard Actions
// -------------------------------------------------------------
export async function getDashboardData(token?: string) {
  return apiRequest('/dashboard', { method: 'GET' }, token);
}

// -------------------------------------------------------------
// 2. Ingredients (Stock) Actions
// -------------------------------------------------------------
export async function getIngredients(token?: string) {
  return apiRequest('/ingredients', { method: 'GET' }, token);
}

export async function getIngredient(id: number, token?: string) {
  return apiRequest(`/ingredients/${id}`, { method: 'GET' }, token);
}

export async function addIngredient(
  payload: {
    name: string;
    unit: string;
    quantity: number;
    reorder_point: number;
    cost_per_unit: number;
    category?: string;
    supplier?: string;
  },
  token?: string
) {
  return apiRequest('/ingredients', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateIngredient(
  id: number,
  payload: Partial<{
    name: string;
    unit: string;
    quantity: number;
    reorder_point: number;
    cost_per_unit: number;
    category: string;
    supplier: string;
  }>,
  token?: string
) {
  return apiRequest(`/ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteIngredient(id: number, token?: string) {
  return apiRequest(`/ingredients/${id}`, { method: 'DELETE' }, token);
}

export async function adjustIngredientStock(
  id: number,
  payload: {
    amount: number;
    type: 'in' | 'waste' | 'adjust';
    note?: string;
  },
  token?: string
) {
  return apiRequest(`/ingredients/${id}/adjust`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function getStockMovements(token?: string) {
  return apiRequest('/stock-movements', { method: 'GET' }, token);
}

// -------------------------------------------------------------
// 3. Menus & Recipes (BOM) Actions
// -------------------------------------------------------------
export async function getMenuItems(token?: string) {
  return apiRequest('/menus', { method: 'GET' }, token);
}

export async function addMenuItem(
  payload: {
    name: string;
    category: string;
    price: number;
    image?: string;
    description?: string;
    recipes?: { ingredient_id: number; quantity_used: number }[];
  },
  token?: string
) {
  return apiRequest('/menus', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateMenuItem(
  id: number,
  payload: {
    name?: string;
    category?: string;
    price?: number;
    image?: string;
    description?: string;
    recipes?: { ingredient_id: number; quantity_used: number }[];
  },
  token?: string
) {
  return apiRequest(`/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteMenuItem(id: number, token?: string) {
  return apiRequest(`/menus/${id}`, { method: 'DELETE' }, token);
}

// -------------------------------------------------------------
// 4. POS Orders Actions
// -------------------------------------------------------------
export async function getOrders(token?: string) {
  return apiRequest('/pos/orders', { method: 'GET' }, token);
}

export async function createOrder(
  payload: {
    table_no?: string;
    items: {
      menu_item_id: number;
      quantity: number;
      unit_price: number;
      options?: any;
    }[];
    payment_method?: string;
    total_amount: number;
  },
  token?: string
) {
  return apiRequest('/pos/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

// -------------------------------------------------------------
// 5. Auth Actions
// -------------------------------------------------------------
export async function loginUser(payload: { email: string; password: string }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload: { name: string; email: string; password: string }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(token: string) {
  return apiRequest('/auth/me', { method: 'GET' }, token);
}

export async function logoutUser(token: string) {
  return apiRequest('/auth/logout', { method: 'POST' }, token);
}
