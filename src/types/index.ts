export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  status: string;
  message: string;
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  reorder_point: number;
  cost_per_unit: number;
  status: 'normal' | 'low' | 'out';
  category?: string;
  supplier?: string;
  updated_at?: string;
}

export interface RecipeItem {
  id?: number;
  ingredient_id: number;
  ingredient_name?: string;
  ingredient_unit?: string;
  ingredient_cost?: number;
  quantity_used: number;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image?: string;
  description?: string;
  recipe_cost: number;
  margin_percent: number;
  status: 'available' | 'sold_out';
  recipes: RecipeItem[];
  available_plates?: number; // Calculated from current stock
}

export interface OrderItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  recipes?: RecipeItem[];
}

export interface Order {
  id: number;
  order_number: string;
  table_no: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  status: 'completed' | 'cancelled' | 'pending';
  payment_method: 'cash' | 'qr_promptpay' | 'credit_card';
  created_at: string;
}

export interface StockMovement {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  type: 'in' | 'out' | 'adjust' | 'waste';
  quantity: number;
  remaining_quantity: number;
  note: string;
  created_at: string;
  staff_name?: string;
}

export interface DashboardKPI {
  today_sales: number;
  today_sales_change: number;
  today_cost: number;
  today_profit: number;
  profit_margin: number;
  low_stock_count: number;
  total_orders_today: number;
  sales_7days: {
    day: string;
    sales: number;
    cost: number;
    profit: number;
  }[];
  menu_profitability: {
    id: number;
    name: string;
    category: string;
    price: number;
    cost: number;
    profit: number;
    margin: number;
    sales_count: number;
  }[];
  ai_recommendations: {
    id: number;
    name: string;
    category: string;
    order_count: number;
    margin: number;
    tag: 'ยอดฮิต' | 'มาร์จิ้นดี' | 'สั่งลดลง - ควรทำโปรโมชัน' | 'กำลังมาแรง';
    tag_color: string;
    insight: string;
  }[];
  low_stock_alerts: {
    id: number;
    name: string;
    unit: string;
    current_quantity: number;
    reorder_point: number;
    plates_left: number;
    days_left: number;
    impact_dishes: string[];
  }[];
}

export interface UnitSetting {
  id: number | string;
  name: string; // เช่น กก., กรัม, ลิตร, ขวด, แพ็ค
  description?: string;
  category?: string;
}
