export interface PurchaseOrderItem {
  ingredient_id?: number;
  name: string;
  quantity: number;
  unit: string;
  cost_per_unit?: number;
  total_price?: number;
  actual_quantity?: number;
  actual_cost_per_unit?: number;
  actual_total_price?: number;
  current_stock?: number;
  reorder_point?: number;
  checked?: boolean; // สำหรับติ๊กถูกตอนไปเดินซื้อหน้าร้าน/ตลาด
}

export interface PurchaseOrder {
  id: string;
  title?: string; // เช่น ลิสต์ซื้อของประจำสัปดาห์
  store_name?: string; // แหล่งซื้อ เช่น ตลาดสดมหาชัย, แม็คโคร, ซีพี, โลตัส (ไม่บังคับ)
  buyer_name?: string; // ผู้ไปจ่ายตลาด
  date: string;
  status: 'pending' | 'receipt_uploaded' | 'completed' | 'draft';
  items: PurchaseOrderItem[];
  subtotal?: number;
  totalAmount?: number;
  note?: string;
  receipt_image?: string; // ภาพถ่ายใบเสร็จ/บิลเงินสด
  receipt_uploaded_at?: string;
  verified_by?: string; // ผู้จัดการหรือแอดมินที่ตรวจ
  verified_at?: string;
  ai_confidence?: number;
  created_at?: string;
}

