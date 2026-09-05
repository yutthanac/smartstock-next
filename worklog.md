# SmartStock Project Worklog & Architecture Documentation

## 📅 ข้อมูลโครงการ (Project Overview)
- **วันที่จัดทำ**: 1 กันยายน 2026
- **โครงสร้างระบบ**: แยกอิสระระหว่าง Frontend (Next.js) และ Backend (Laravel API)

---

## 🏗️ โครงสร้างโปรเจกต์ (Project Separation)

### 1. Frontend Repository / Workspace: `smartStock`
- **พาธ (Path)**: `c:\meeting\smartStock`
- **เทคโนโลยี (Stack)**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, Recharts, Lucide Icons
- **หน้าที่ (Role)**: จัดการ UI/UX สำหรับระบบ POS หน้าร้าน, แดชบอร์ดวิเคราะห์ยอดขายและกำไร, ระบบจัดการสต็อกวัตถุดิบ (Inventory Management), และระบบเมนู/สูตรอาหาร (Recipe BOM)
- **การตั้งค่า Environment (`.env.local` / `.env.example`)**:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000/api
  ```
- **คำสั่งรัน (Commands)**:
  ```bash
  npm install
  npm run dev      # รัน Frontend ที่ http://localhost:3000
  ```

---

### 2. Backend Repository / Workspace: `smartsotck-backend`
- **พาธ (Path)**: `c:\meeting\smartsotck-backend`
- **เทคโนโลยี (Stack)**: Laravel 11 / PHP 8.x, SQLite / MySQL, Eloquent ORM
- **หน้าที่ (Role)**: จัดการฐานข้อมูลและ RESTful API Endpoints:
  - `GET /api/dashboard` - สรุปภาพรวมยอดขาย, ต้นทุน, กำไร, สต็อกเหลือน้อย
  - `GET /api/ingredients`, `POST /api/ingredients`, `POST /api/ingredients/{id}/adjust` - จัดการวัตถุดิบและปรับยอดสต็อก
  - `GET /api/menus`, `POST /api/menus` - จัดการรายการเมนูและส่วนประกอบ BOM (Bill of Materials)
  - `POST /api/pos/orders` - บันทึกคำสั่งซื้อ POS และทำการตัดยอดสต็อกอัตโนมัติตามสูตรอาหาร
- **การตั้งค่า Environment (`.env` / `.env.example`)**:
  ```env
  APP_NAME=SmartStockBackend
  APP_ENV=local
  APP_KEY=...
  APP_DEBUG=true
  APP_URL=http://localhost:8000
  DB_CONNECTION=sqlite
  ```
- **คำสั่งรัน (Commands)**:
  ```bash
  composer install
  php artisan migrate --seed
  php artisan serve    # รัน Backend API ที่ http://localhost:8000
  ```

---

## 📝 บันทึกประวัติการทำงาน (Change Logs)

### [2026-09-05] พัฒนาระบบใบจ่ายตลาด (Shopping Checklist) & ปรับปรุง UI Components
1. **ระบบจัดทำและสั่งพิมพ์ใบจ่ายตลาด (Purchase Orders / Shopping Lists)**:
   - สร้างโมดอลสร้างรายการจ่ายตลาด (`CreatePOModal`) รองรับการดึงวัตถุดิบที่สต็อกใกล้หมดมาทำรายการอัตโนมัติ
   - สร้างโมดอลพรีวิวและสั่งพิมพ์ (`POPrintViewModal`) จัดฟอร์แมต A4 สไตล์เอกสารมาตรฐาน (Single Page A4)
   - ใช้ฟอนต์ **Sarabun (สารบรรณ)** สำหรับหน้าพิมพ์เอกสาร
   - เติมแถวว่างอัตโนมัติในตารางรายการซื้อเพื่อให้ตัวตารางทอดยาวเต็มแผ่น A4 และจดเพิ่มเติมได้
2. **อัปเกรดคอมโพเนนต์ Dropdown (`Dropdown.tsx`)**:
   - ใช้ **React Portal (`createPortal`)** ให้เมนูลอยทะลุขอบเขตกล่อง (`overflow-y-auto` / `overflow:hidden`) ได้ 100%
   - แก้ไขปัญหาตัวเลือกในสูตรอาหาร (Recipe BOM Modal) โดนขอบกล่องตัด/มองไม่เห็น
   - รองรับ **Smart Flip** สลับขึ้นด้านบนอัตโนมัติหากปุ่มอยู่ใกล้ขอบล่างหน้าจอ

---

## 📌 แผนงานและฟีเจอร์ถัดไป (Next Tasks / Roadmap)

### 🎯 ระบบแยกประเภทวัตถุดิบ: วัตถุดิบเคร่งครัด (Strict BOM) vs วัตถุดิบยืดหยุ่น/เครื่องปรุง (Flexible / Expense Stock)

#### 1. คอนเซ็ปต์และความต้องการ (Concept & Requirements):
* **วัตถุดิบหลัก / เคร่งครัด (Strict Inventory):**
  - เช่น เนื้อหมู, สันในไก่, กุ้งสด, แซลมอน ฯลฯ
  - **การทำงาน**: ต้องระบุน้ำหนัก/สัดส่วนที่ชัดเจนต่อจานในระบบ BOM (เช่น ข้าวกะเพราหมูสับ = หมู 120 กรัม/จาน)
  - **การตัดสต็อก**: เมื่อ POS ขายได้ 1 จาน จะตัดสต็อกอัตโนมัติตามสัดส่วนที่ฟิกไว้ทันที
* **วัตถุดิบยืดหยุ่น / เครื่องปรุง / ผัก (Non-Strict / Bulk Expense Inventory):**
  - เช่น น้ำปลา, ซอสหอยนางรม, ซีอิ๊วขาว, น้ำตาลทราย, กะเพรา, พริกสด, กระเทียม ฯลฯ
  - **ปัญหาจริงหน้าครัว**: แม่ครัว/เชฟไม่สามารถมาชั่งน้ำหนักเป็นกรัมๆ หรือวัดเป็นมิลลิลิตรต่อจานได้ตอนผัด/ปรุงเพราะต้องทำตามความชำนาญและความรวดเร็ว
  - **แนวทางการตัดสต็อก**: 
    - ไม่ต้องบังคับใส่จำนวนละเอียดต่อจานในสูตร (หรือใส่เป็นค่าประมาณคร่าวๆ สำหรับคิดต้นทุนเฉลี่ย)
    - ตัดสต็อกตาม **การเปิดใช้จริง / หมดจริง**: เมื่อขวด/ถุง/มัดหมด พนักงานหรือหัวหน้าครัวเพียงมากดปุ่มในระบบว่า *"เบิกขวดใหม่ / วัตถุดิบหมดแล้ว"*
    - ระบบจะตัดยอด 1 หน่วย (เช่น 1 ขวด, 1 ถุง, 1 กำ) ออกจากคลัง และบันทึกเข้าต้นทุนวัตถุดิบสิ้นเปลืองตามจริงทันที

#### 2. แผนการ Implement (Implementation Steps):
1. **Database & Types**:
   - เพิ่มฟิลด์ `tracking_type` ในตาราง `ingredients`:
     - `'strict'` (ตัดตามจาน/สูตรอัตโนมัติ)
     - `'bulk_expense'` (เบิกใช้เป็นแพ็ค/ขวด/ถุง แล้วตัดยอดเมื่อหมดจริง)
2. **Recipe BOM Builder**:
   - หน้าสร้างสูตรอาหาร แยกแท็บ/ส่วนแสดงผลระหว่าง **"วัตถุดิบหลัก (ต้องระบุปริมาณ)"** กับ **"เครื่องปรุงและผักเสริม (ไม่บังคับระบุปริมาณตัดสต็อก)"**
3. **Kitchen Quick-Action (หน้าครัว/สต็อก)**:
   - เพิ่มปุ่มลัดสำหรับตัดสต็อกเครื่องปรุงที่หมดจริง (เช่น กด "น้ำปลาหมดขวด" -> ตัดสต็อก 1 ขวดทันที)

