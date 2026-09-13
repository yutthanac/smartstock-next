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
  actual_store_name?: string; // ชื่อร้านค้าจริงจากใบเสร็จ
  buyer_name?: string; // ผู้ไปจ่ายตลาด
  date: string;
  status: 'pending' | 'receipt_uploaded' | 'completed' | 'draft';
  items: PurchaseOrderItem[];
  subtotal?: number;
  discount?: number; // ส่วนลดท้ายบิล
  vat?: number; // ภาษีมูลค่าเพิ่ม 7%
  totalAmount?: number;
  note?: string;
  receipt_image?: string; // ภาพถ่ายใบเสร็จ/บิลเงินสดเดี่ยว (backward-compatible)
  receipt_images?: string[]; // รองรับรูปใบเสร็จหลายใบ/บิลย่อย
  receipt_uploaded_at?: string;
  verified_by?: string; // ผู้จัดการหรือแอดมินที่ตรวจ
  verified_at?: string;
  ai_confidence?: number;
  created_at?: string;
}

export interface VerifiedReceiptItem {
  ingredient_id?: number;
  name: string;
  // ค่าที่อ่านได้จากบิล / หน่วยซื้อ
  purchase_quantity: number; // เช่น 2 (ขวด)
  purchase_unit: string; // เช่น 'ขวด', 'ลัง', 'แพ็ค', 'ถุง'
  pack_size: number; // สัดส่วนแปลงหน่วย เช่น 1 ขวด = 1000 มล., 1 ลัง = 24 กระป๋อง (default: 1)
  // ค่าที่จะนำเข้าสต็อกจริง
  quantity: number; // จำนวนเข้าสต็อก = purchase_quantity * pack_size
  unit: string; // หน่วยในสต็อก เช่น 'มล.', 'กรัม', 'กระป๋อง'
  cost_per_unit: number; // ราคาทุนต่อหน่วยซื้อ (ตามบิล)
  inventory_cost_per_unit?: number; // ราคาทุนเฉลี่ยต่อหน่วยสต็อก = cost_per_unit / pack_size
  total_price: number; // ราคารวมของรายการนี้ (ตามบิล)
  is_new_stock?: boolean;
  source_image_index?: number; // ใบเสร็จใบที่ตรวจพบรายการนี้
}

