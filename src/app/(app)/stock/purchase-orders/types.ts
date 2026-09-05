export interface PurchaseOrderItem {
  ingredient_id?: number;
  name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_price: number;
  current_stock?: number;
  reorder_point?: number;
  checked?: boolean; // สำหรับติ๊กถูกตอนไปเดินซื้อหน้าร้าน/ตลาด
}

export interface PurchaseOrder {
  id: string;
  store_name: string; // แหล่งซื้อ เช่น ตลาดสดมหาชัย, แม็คโคร, ซีพี, โลตัส
  buyer_name?: string; // ผู้ไปจ่ายตลาด
  date: string;
  status: 'pending' | 'completed' | 'draft';
  items: PurchaseOrderItem[];
  subtotal: number;
  totalAmount: number;
  note?: string;
  created_at?: string;
}
