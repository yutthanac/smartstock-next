export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string | null;
  role?: string;
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
  store_id?: number | null;
  name: string;
  unit: string;
  quantity: number;
  max_stock?: number;
  reorder_point: number;
  cost_per_unit: number;
  status: 'normal' | 'low' | 'out';
  tracking_type?: 'strict' | 'bulk_expense';
  category?: string;
  supplier?: string;
  package_unit?: string; // เช่น 'ขวด', 'ลัง', 'ถุง', 'กล่อง', 'กระป๋อง'
  package_size?: number; // เช่น 2000 (มล.), 1000 (กรัม)
  sort_order?: number;
  updated_at?: string;
}

export interface MenuOptionIngredient {
  id: number;
  store_id?: number | null;
  menu_item_id?: number | null;
  menu_item_name?: string;
  name: string;
  price: number;
  ingredient_id: number;
  ingredient_name?: string;
  ingredient_unit?: string;
  quantity: number;
}

export interface RecipeItem {
  id?: number;
  ingredient_id: number;
  ingredient_name?: string;
  ingredient_unit?: string;
  ingredient_cost?: number;
  quantity_used: number;
  waste_percent?: number; // เปอร์เซ็นต์สูญเสีย/หก/ฟองทิ้ง เช่น 10%
}

export interface MenuItem {
  id: number;
  store_id?: number | null;
  name: string;
  category: string;
  price: number;
  image?: string;
  description?: string;
  recipe_cost: number;
  margin_percent: number;
  status: 'available' | 'sold_out';
  recipes: RecipeItem[];
  option_ingredients?: MenuOptionIngredient[];
  available_plates?: number; // Calculated from current stock
  sort_order?: number;
  order_count?: number;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  recipes?: RecipeItem[];
}

export interface Order {
  id: number;
  store_id?: number | null;
  order_number: string;
  table_no: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  status: 'completed' | 'cancelled' | 'pending';
  payment_method: 'cash' | 'qr_promptpay' | 'credit_card';
  created_at: string;
  refund_reason?: string;
  refunded_by?: string;
}

export interface StockMovement {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  type: 'in' | 'out' | 'adjust' | 'open' | 'consume' | 'waste' | 'audit_adjustment';
  quantity: number;
  unit_cost?: number;
  remaining_quantity: number;
  note: string;
  created_at: string;
  staff_name?: string;
}

export interface WasteStatsResponse {
  status: string;
  period: string;
  total_waste_value: number;
  total_waste_count: number;
  by_reason: Record<string, number>;
  by_ingredient: Record<string, number>;
  recent_wastes: StockMovement[];
}

export interface DashboardKPI {
  today_sales: number;
  today_sales_change: number;
  today_cost: number;
  today_profit: number;
  profit_margin: number;
  today_refund?: number;
  today_cancelled_count?: number;
  today_waste_value?: number;
  today_waste_count?: number;
  low_stock_count: number;
  total_orders_today: number;
  sales_7days: {
    day: string;
    sales: number;
    cost: number;
    profit: number;
  }[];
  sales_weekly?: {
    day: string;
    sales: number;
    cost: number;
    profit: number;
  }[];
  sales_monthly?: {
    day: string;
    sales: number;
    cost: number;
    profit: number;
  }[];
  sales_yearly?: {
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
