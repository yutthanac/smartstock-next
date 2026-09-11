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

3. **ระบบแยกประเภทวัตถุดิบ: วัตถุดิบหลัก (Strict BOM) vs เครื่องปรุง/ผักยืดหยุ่น (Bulk / Expense Stock)**:
   - **Backend Migration & Controller**:
     - เพิ่มคอลัมน์ `tracking_type` (`'strict'` | `'bulk_expense'`) ในตาราง `ingredients`
     - ปรับ `OrderController.php`: ยิง POS ขายอาหาร จะตัดสต็อกอัตโนมัติเฉพาะวัตถุดิบประเภท `strict` เท่านั้น (ไม่ตัดเศษกรัม/มล. ของเครื่องปรุง)
     - เพิ่ม API Endpoint `POST /api/ingredients/{id}/bulk-use` สำหรับตัดสต็อกเมื่อเปิดขวด/หมดจริง 1 หน่วยพร้อมบันทึกประวัติการเบิก
   - **Frontend UI / UX**:
     - เพิ่มตัวเลือกลักษณะการตัดสต็อกในหน้าเพิ่มวัตถุดิบ (`AddIngredientModal.tsx`) พร้อมไอคอนและการอธิบายชัดเจน (🥩 วัตถุดิบหลัก vs 🧂 เครื่องปรุง/ของใช้)
     - ในตารางสต็อก (`stock/page.tsx`) แสดง Badge บอกสถานะ และเพิ่มปุ่มด่วน **"⚡ เปิดใช้ 1 ขวด/ถุง"** ให้พนักงานครัวกดตัดสต็อกได้ในคลิกเดียว
     - ในหน้าสร้างสูตรอาหาร (`RecipeBuilder.tsx`) แสดงไอคอนและ Badge แยกชัดเจนว่ารายการไหนคือวัตถุดิบหลักที่จะตัดสต็อกอัตโนมัติ และรายการไหนคือเครื่องปรุงที่ใส่เพื่อคำนวณต้นทุนต่อจาน

### [2026-09-06] มาตรฐาน Dropdown สากล & ปรับชุดสีตัดชมพูออก (Dropdown Standard & Color Scheme Cleanup)
1. **กฎเกณฑ์ข้อบังคับ: การใช้งานคอมโพเนนต์ Dropdown (Mandatory Dropdown Standard)**:
   - **กฎเหล็ก**: ทุกครั้งที่มีการสร้าง Dropdown หรือตัวเลือก Select ในระบบ SmartStock **ต้องเรียกใช้งานคอมโพเนนต์ `@/components/Dropdown.tsx` เสมอ ห้ามใช้ native `<select>` โดยเด็ดขาด**
   - คอมโพเนนต์ `@/components/Dropdown.tsx` มีคุณสมบัติ:
     - ใช้ React Portal (`createPortal`) ทำให้เมนูลอยทะลุกรอบ Modal และตาราง ไม่ถูกบดบังด้วย `overflow-hidden`
     - รองรับ Smart Positioning พลิกขึ้นบนอัตโนมัติเมื่อใกล้ขอบล่างหน้าจอ
     - ดีไซน์สวยงามเข้ากับธีมระบบและรองรับขนาด `sm` / `md`
   - ได้ดำเนินการ Refactor จุดที่เคยใช้ native `<select>` เดิมทั้งหมดในโปรเจกต์เรียบร้อย:
     - `src/app/(app)/settings/components/SidebarCustomizer.tsx` (Dropdown เลือกสลับร้านค้า)
     - `src/app/(app)/settings/stores/page.tsx` (Dropdown เลือกระดับสิทธิ์สมาชิก Role)
     - `src/app/(app)/staff/components/StaffModal.tsx` (Dropdown เลือกสาขาประจำของพนักงาน)

2. **ตัดโทนสีชมพูออกทั้งหมด (100% Pink Removal) & ปรับคอนทราสต์ขาว-ดำ**:
   - นำคลาสสีชมพู (`pink-*`) ออกจากทุกไฟล์ในระบบ คืนค่าสู่สไตล์ Monochrome เรียบหรู สะอาดตา
   - ปรับแต่งแถบหลอดระดับสต็อกและ Badge ใน `src/app/(app)/stock/page.tsx`:
     - หลอดแสดงระดับสต็อก: สต็อกปกติใช้สีดำคมชัด (`bg-zinc-950`) บนรางสีเทาคอนทราสต์สูง มองเห็นชัดเจน
     - สถานะใกล้หมด: ปรับเป็นสีเหลืองอำพันสากล (`amber-500` / `bg-amber-50 text-amber-800 border-amber-300`)
     - สถานะหมด / สต็อกหมด: ปรับเป็นสีแดงเตือนมาตรฐาน (`rose-500` / `text-rose-400`)
   - ปรับปุ่ม Action หลักและ Input Focus ใน `Topbar.tsx`, `AddIngredientModal.tsx`, `AdjustStockModal.tsx` เป็นโทนเข้ม `bg-zinc-950 hover:bg-zinc-800`

---

### [2026-09-06] มาตรฐานคอมโพเนนต์ Button, Badge, Table & ปรับเปลี่ยน Typography และโทนสีทั่วระบบ
1. **มาตรฐานคอมโพเนนต์ปุ่ม (`@/components/Button.tsx`) และยกเลิกปุ่มสีเขียว 100% (No Green Buttons)**:
   - **กฎเหล็ก**: ห้ามใช้สีเขียว (`bg-emerald-600`, `bg-[#4fb0a5]`, `skeuo-btn-primary` เขียว ฯลฯ) สำหรับปุ่มในระบบ SmartStock อีกต่อไป
   - ทุกปุ่มในระบบต้องเรียกใช้คอมโพเนนต์ `@/components/Button.tsx` เสมอ
   - สไตล์และ Variants:
     - `primary`: `bg-slate-900 hover:bg-slate-800 text-white shadow-xs` (ปุ่มหลักโทนเข้ม คมชัด เรียบหรู)
     - `secondary`: `bg-slate-100 hover:bg-slate-200 text-slate-700`
     - `outline`: `bg-white hover:bg-slate-50 text-slate-700 border border-slate-200`
     - `danger`: `bg-rose-600 hover:bg-rose-700 text-white`
     - รองรับสถานะ `isLoading` (แสดง Spinner หมุนอัตโนมัติ), ปรับขนาด `sm`, `md`, `lg` ได้มาตรฐานเดียวกัน
2. **มาตรฐานตารางข้อมูลและหัวตาราง (`@/components/Table.tsx`)**:
   - **หัวตาราง (Table Header)**: เอาสีพื้นหลังหัวตารางออกทั้งหมด เป็นสีโปร่งใส (`bg-transparent border-b border-slate-200`)
   - **ตัวอักษรหัวตาราง (Table Head)**: ปรับเป็นตัวน้ำหนักปกติ ไม่หนา แต่มีความเข้มอ่านง่าย ชัดเจน (`font-normal text-slate-700`)
   - **เนื้อหาตาราง (Table Cells)**: ปรับลดความหนาลง ไม่เอาตัวหนาเกินไป (`font-normal text-slate-600`) ตัวเลขราคาเป็น `font-mono text-slate-800 font-normal`
   - สร้างและใช้งาน Primitives: `<TableContainer>`, `<Table>`, `<TableHeader>`, `<TableHead>`, `<TableBody>`, `<TableRow>`, `<TableCell>`
3. **มาตรฐาน Badge ป้ายสถานะ (`@/components/Badge.tsx`)**:
   - ป้ายสถานะทรงมนนุ่มนวล (Soft Pill) ขอบบาง ไม่ใช้สีเขียวสดที่จัดจ้าน
   - รองรับ variant: `default`, `neutral`, `warning`, `danger`, `success`, `outline`
4. **Refactor ปรับปรุงความเร็วและมาตรฐานโค้ดทั่วทั้งระบบ**:
   - Refactor ทุกหน้าและโมดอลในระบบให้เรียกใช้ `Button`, `Badge`, `Table`:
     - หน้าสต็อกวัตถุดิบ (`stock/page.tsx`, `AddIngredientModal.tsx`, `AdjustStockModal.tsx`)
     - หน้าใบสั่งซื้อจ่ายตลาด (`stock/purchase-orders/page.tsx`, `CreatePOModal.tsx`, `POPrintViewModal.tsx`)
     - หน้าพนักงานและสิทธิ์ (`staff/page.tsx`, `StaffTableView.tsx`, `StaffCardView.tsx`, `roles/page.tsx`)
     - หน้าเมนูและสูตรชง (`menu/page.tsx`, `MenuListView.tsx`, `MenuCard.tsx`, `MenuModal.tsx`, `RecipeBuilder.tsx`)
     - หน้ารายงาน (`reports/profit/page.tsx`, `reports/sales/page.tsx`, `MenuProfitabilityTable.tsx`)
     - หน้าระบบขาย POS (`sales/pos/page.tsx`, `ItemOptionModal.tsx`, `ItemOptionPanel.tsx`)
     - หน้าตั้งค่าและสลับร้าน (`settings/stores/page.tsx`, `SidebarCustomizer.tsx`, `login/page.tsx`)

---

### [2026-09-07 - 2026-09-08] Drag & Drop จัดเรียง, AI Scan บิลรับเข้าสต็อก, Sales Analytics & ปฏิทินรายได้แดชบอร์ด

1. **ระบบ Drag & Drop ลากสลับลำดับเมนูและสต็อกวัตถุดิบ (`@dnd-kit`)**:
   - **Backend (Laravel)**:
     - สร้าง Migration เพิ่มคอลัมน์ `sort_order` ในตาราง `ingredients` และ `menu_items`
     - เพิ่ม API Endpoint `POST /api/ingredients/sort` และ `POST /api/menus/sort` รองรับการอัปเดตแบบ batch
     - `index()` ใน `IngredientController` และ `MenuController` เรียงตาม `sort_order`
   - **Frontend (Next.js)**:
     - ติดตั้ง `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@dnd-kit/modifiers`
     - เพิ่มฟังก์ชัน `reorderIngredients` และ `reorderMenuItems` ใน `StockContext` พร้อม Optimistic Update
     - เพิ่มคอลัมน์ "ย้าย" (GripVertical) ใน [MenuListView.tsx](file:///c:/meeting/smartStock/src/app/(app)/menu/components/MenuListView.tsx) และ [stock/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/page.tsx)
     - อัปเกรด `TableRow` ใน `Table.tsx` ให้รองรับ `React.forwardRef` เพื่อให้ dnd-kit ทำงานได้ราบรื่น

2. **ระบบปรับหน่วยสต็อกมาตรฐานสำหรับตัดตามแก้ว (Unit Standardization & Pack Calculator)**:
   - แนะนำหน่วยมาตรฐานอัตโนมัติ (ผง/เมล็ด -> กรัม, นม/ไซรัป -> มล., อุปกรณ์ -> ชิ้น)
   - เพิ่ม **1-Click Unit Converter** แปลง กก./ลิตร เป็น กรัม/มล. พร้อมคำนวณต้นทุนต่อหน่วยอัตโนมัติ
   - เพิ่ม **Pack Calculator** คำนวณจากขนาดถุง/แพ็ค เช่น ถุง 500g ราคา 250 บาท
   - เพิ่ม **Unit Normalization Factor** ใน OrderController.php และ BOM live preview เพื่อป้องกันการตัดสต็อกผิดพลาด 1,000 เท่า

3. **ระบบ Shopping List & AI Scan ใบเสร็จตรวจสอบราคาจริง**:
   - ปรับ `CreatePOModal.tsx` เป็น **Flexible Shopping List** ไม่บังคับระบุร้านค้าหรือราคาตายตัว
   - เพิ่มการสแกนใบเสร็จด้วย AI (Gemini Flash) ใน `ReceiptVerificationModal.tsx` ดึงรายการและราคาจริงจากบิลอัตโนมัติ
   - รองรับการเปลี่ยนรูปภาพใบเสร็จใหม่ และปุ่มหมุนภาพ 90 องศา

4. **ยุบรวมและสร้างแท็บ "ตรวจสอบและรับเข้าสต็อกจริงจากบิล" (`ReceiptInboundTab.tsx`) ในหน้า `/stock`**:
   - รวมหน้าตรวจเช็กบิลซื้อและรับเข้าสต็อกไว้ในที่เดียวในหน้า `/stock`
   - **Auto Match**: ตรวจจับและจับคู่วัตถุดิบในสต็อกเดิมอัตโนมัติ หรือเลือกสร้างเป็นวัตถุดิบใหม่ได้ทันที
   - ปรับยอดสต็อกและราคาต้นทุนล่าสุดเข้าสู่ระบบจริงด้วยปุ่มเดียว
   - ปรับแต่งหน้าตาให้เป็นทางการ เรียบหรู ไม่ดูเป็น AI หลอกตา (ตัดไอคอนประกายดาว/สไตล์การ์ตูนออก)

5. **กราฟสถิติยอดขาย & ต้นทุนแบบสลับช่วงเวลา (Sales Analytics Chart)**:
   - ปรับปรุง [SalesAnalyticsChart.tsx](file:///c:/meeting/smartStock/src/app/(app)/dashboard/components/SalesAnalyticsChart.tsx)
   - รองรับตัวกรอง 4 รูปแบบ โดยตั้งค่าเริ่มต้น (Default) เป็น **"สถิติยอดขาย & ต้นทุน 7 วันล่าสุด"**
   - รองรับการดูแบบ: 7 วันล่าสุด, รายสัปดาห์ (4 สัปดาห์), รายเดือน (12 เดือน), รายปี

6. **ระบบปฏิทินรายได้รายวันมุมบนขวาหน้าแดชบอร์ด (Top-Right Revenue Calendar Dropdown)**:
   - วางรากฐาน UI Library โฟลเดอร์ `src/components/ui/` ตามมาตรฐาน shadcn:
     - [button.tsx](file:///c:/meeting/smartStock/src/components/ui/button.tsx), [calendar.tsx](file:///c:/meeting/smartStock/src/components/ui/calendar.tsx), [toggle.tsx](file:///c:/meeting/smartStock/src/components/ui/toggle.tsx)
     - ติดตั้ง `react-day-picker`, `date-fns`, `@radix-ui/react-slot`, `class-variance-authority`, `@radix-ui/react-toggle`
   - พัฒนาคอมโพเนนต์ [DashboardCalendarDropdown.tsx](file:///c:/meeting/smartStock/src/app/(app)/dashboard/components/DashboardCalendarDropdown.tsx) วางไว้มุมบนขวาของหน้าแดชบอร์ด:
     - แถบปุ่มแสดง: `📅 วันที่ • ฿ยอดขาย ⌄`
     - กดแล้วคลี่ Popover เมนูดรอปดาวน์ลงมา
     - แสดงปฏิทิน **1 เดือน** พร้อมปุ่มเปลี่ยนเดือน
     - ใต้ตัวเลขแต่ละวันแสดงยอดขายจริง (เช่น `฿5.2k`, `฿188` หรือ `-`)
     - แก้ไขการ import ไอคอน `Calendar` และปัญหา build ผ่านฉลุย (21 routes, 0 errors)

---

### [2026-09-08] ยกระดับระบบ AI และหน้ารายงานเชิงลึกครบถ้วนตาม Roadmap
1. **หน้าแดชบอร์ด: ปรับแต่งส่วนบทวิเคราะห์เชิงกลยุทธ์ ([AiInsightsCard.tsx](file:///c:/meeting/smartStock/src/app/(app)/dashboard/components/AiInsightsCard.tsx))**:
   - ปรับโฉมเป็น Professional Business ERP สะอาดตา สุขุม เรียบหรู
   - ตัดไอคอนประกายดาว/การ์ตูนออก ใช้สไตล์สากล Monochrome Slate
   - เรียกใช้คอมโพเนนต์มาตรฐาน `Button.tsx` และ `Badge.tsx` แสดงอัตรากำไร (Margin %) และยอดขายชัดเจน
2. **ระบบ AI วิเคราะห์เมนู & กลยุทธ์เครื่องดื่ม ([/menu/ai-insights](file:///c:/meeting/smartStock/src/app/(app)/menu/ai-insights/page.tsx))**:
   - สร้าง API Route `POST /api/ai/menu-insights` ส่งบริบทคลังวัตถุดิบและยอดขายจริงให้ Google Gemini Flash ประมวลผล
   - มีปุ่ม **"ประมวลผลใหม่ (Re-generate)"** แบบเรียลไทม์ พร้อมระบบ Local Cache บันทึกผลวิเคราะห์ล่าสุด
   - แยกแท็บ 3 มิติ: เมนูปัจจุบัน & แนวทางดันยอดขาย, ไอเดียเมนูใหม่จากสต็อกที่มีอยู่, และแนวทางลดของเสีย/ควบคุมต้นทุน
3. **ระบบตรวจรับสตอกจากบิล AI รองรับส่วนลด & VAT ([ReceiptInboundTab.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/components/ReceiptInboundTab.tsx))**:
   - เพิ่มช่องกรอกและคำนวณส่วนลดท้ายบิล (Bill Discount) และภาษีมูลค่าเพิ่ม (VAT 7%)
   - มีระบบคำนวณเกลี่ยต้นทุนต่อหน่วยสุทธิ (Weighted Cost Normalization) เข้าไปในต้นทุนรับเข้าคลังจริงอย่างแม่นยำ
   - อัปเดต prompt AI OCR ใน `/api/ai/scan-receipt` รองรับการสกัด Subtotal, Discount, VAT
4. **หน้ารายงานการเงิน & ยอดขายเชิงลึก ([/reports/sales](file:///c:/meeting/smartStock/src/app/(app)/reports/sales))**:
   - เพิ่มตัวกรองสลับช่วงเวลา 7 วันล่าสุด, 30 วัน (รายสัปดาห์), และ 12 เดือน (รายปี)
   - เพิ่มการคำนวณขนาดตะกร้าต่อบิลเฉลี่ย (Basket Size / Average Order Value)
   - เพิ่มกราฟวิเคราะห์ยอดขายแยกตามหมวดหมู่สินค้า (Category Share)
   - เพิ่มกราฟวิเคราะห์ช่วงเวลาขายดี (Hourly Peak Hours Heatmap / Distribution)
   - เพิ่มระบบบทสรุปอินไซต์ผู้บริหารด้วย AI (Executive Sales AI Analysis)
5. **Performance Refactor & Skeleton Loading ([Skeleton.tsx](file:///c:/meeting/smartStock/src/components/Skeleton.tsx))**:
   - สร้างคอมโพเนนต์กลาง `Skeleton`, `TableSkeleton`, `CardSkeleton` โทน Slate นุ่มตา
   - เพิ่มสถานะ Skeleton Loading ตอนดึงข้อมูลใน Dashboard, Stock (`/stock`), Menu (`/menu`), Orders (`/sales/orders`)
   - ปรับแต่ง Backend [DashboardController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/DashboardController.php) รวบ 26 queries เหลือ 1 bulk query พร้อม eager loading ความเร็วตอบสนองเพิ่มขึ้นชัดเจน ไม่กระทบ business logic

### [2026-09-11 - 2026-09-12] ปรับปรุงระบบ Real-Time Map Search, UI Polish & แผนงานอนาคต
1. **ระบบค้นหาสถานที่และวิเคราะห์แผนที่แบบเรียลไทม์ (Interactive Map & Place Search)**:
   - เพิ่มระบบค้นหาสถานที่ผ่าน OpenStreetMap / Nominatim API พร้อมพิกัดและปักหมุด
   - ดึงข้อมูลร้านคู่แข่ง/ร้านใกล้เคียงในละแวกเพื่อนำมาใช้เป็นฐานวิเคราะห์
   - พัฒนาคอมโพเนนต์ [InteractiveMapPicker.tsx](file:///c:/meeting/smartStock/src/components/InteractiveMapPicker.tsx) และหน้า [menu/ai-insights](file:///c:/meeting/smartStock/src/app/(app)/menu/ai-insights/page.tsx)
2. **ขยายพื้นที่แสดงผล & ปรับ Typography Contrast**:
   - ขยาย Layout หน้าจัดการสต็อกและ AI ให้โปร่ง กว้าง อ่านง่ายขึ้น
   - สรุปและจัดระเบียบหน้า [worklog.md](file:///c:/meeting/smartStock/worklog.md) ให้พร้อมต่อยอดรอบถัดไป

---

## 📌 สรุปสถานะโครงการปัจจุบัน (Current System Status)
- ✅ UI Theme: สะอาดตา มินิมอล โมโนโครม (Slate/Neutral) ผสานโทนอบอุ่นคาเฟ่ 60-30-10 ระดับ Enterprise
- ✅ Component Standards: `Button.tsx`, `Badge.tsx`, `Table.tsx`, `Dropdown.tsx`, `Skeleton.tsx` และ shadcn `components/ui/` ใช้งานเป็นมาตรฐานหลัก 100%
- ✅ Frontend Next.js 16 (Turbopack) & TypeScript ผ่านการทดสอบ `npm run build` สำเร็จ 100%
- ✅ Backend Laravel 11 API อัปเกรด Query Optimization พร้อม Eager Loading

---

## 🚀 แผนการพัฒนารอบถัดไป (Upcoming Detailed Roadmap & Implementation Plan)

### 🎯 ภาพรวมและเป้าหมายหลัก (Core Objectives)
รอบการพัฒนานี้มี 5 แกนงานสำคัญที่ต้องดำเนินการตามลำดับเพื่อความต่อเนื่องและป้องกันการลืม:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             SmartStock Upcoming Roadmap                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. 📦 ตรวจนับสต็อกสิ้นวัน (End-of-Day Stock Audit / Re-check & Reconcile)       │
│ 2. 🧾 หน้ารายงานยอดขาย: แสดงยอด Refund / บิลคืนเงิน & หักลบสุทธิ                 │
│ 3. 🛡️ ปรับระบบจัดการสิทธิ์ (Role & Permission Separation) & Layout ใหม่          │
│ 4. 🛒 ปรับ Layout หน้าซื้อของเข้าร้าน / ใบสั่งซื้อ (Purchase Orders UX Polish)    │
│ 5. 🤖 AI ผสานข้อมูลแผนที่ (Map Competitors) + ข้อมูลการขายจริงในร้าน (Internal POS) │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 📋 รายละเอียดแผนปฏิบัติการทั้ง 5 ส่วน (Detailed Action Items)

#### 1. 📦 แท็บรีเช็คสต็อกสิ้นวัน / ปิดกะ (End-of-Day Physical Stock Audit & Reconcile)
> **เป้าหมาย**: ให้พนักงาน/เจ้าของร้านเดินนับวัตถุดิบจริงหลังปิดร้าน (หรือหลังจบคอร์ส) เพื่อเทียบกับตัวเลขในระบบ และบันทึกผลต่าง (Divergence / Loss / Variance) ได้อย่างรวดเร็ว

* **Frontend ([src/app/(app)/stock/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/page.tsx))**:
  - เพิ่มแท็บใหม่ในหน้า Stock: `audit` ("รีเช็คสต็อกสิ้นวัน / ตรวจนับ")
  - ตารางตรวจนับวัตถุดิบ (Stock Audit Sheet):
    - คอลัมน์: รหัส & ชื่อวัตถุดิบ | หมวดหมู่ | ยอดคงเหลือในระบบ (System Qty) | **ยอดนับจริง (Counted Qty - Input)** | ผลต่าง (Variance: + / -) | หมายเหตุสาเหตุ (เช่น ของเสีย, ทำหก, ลืมคีย์)
    - รองรับการฟิลเตอร์เฉพาะหมวดหมู่ หรือเฉพาะวัตถุดิบหลัก (Strict BOM) ที่เน้นตรวจทุกวัน
    - ปุ่ม **"⚡ ดึงยอดระบบเป็นค่าเริ่มต้น"** เพื่อให้คีย์เฉพาะตัวที่มีผลต่างได้เร็วขึ้น
    - ปุ่ม **"ยืนยันและปรับยอดสต็อกจริง (Reconcile & Apply)"**: คำนวณส่วนต่างแล้วยิงปรับสต็อกอัตโนมัติ พร้อมลงบันทึก Movement Type เป็น `audit_adjustment`
* **Backend ([smartsotck-backend](file:///c:/meeting/smartsotck-backend))**:
  - เพิ่ม Endpoint `POST /api/ingredients/audit-reconcile` (รับ array ของ `{ ingredient_id, system_qty, counted_qty, note }`)
  - บันทึกประวัติการกระทบยอดลงตาราง audit logs / stock movements พร้อมระบุ user_id ผู้ตรวจนับ

---

#### 2. 🧾 หน้ารายงานยอดขาย: แสดงยอด Refund & รายละเอียดการคืนเงิน
> **เป้าหมาย**: เพิ่มความโปร่งใสทางบัญชี ให้เห็นยอดขายรวม (Gross Sales), ยอดเงินที่ Refund/ยกเลิกบิล, และยอดขายสุทธิ (Net Sales)

* **Frontend ([src/app/(app)/reports/sales/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/reports/sales/page.tsx))**:
  - เพิ่ม KPI Card:
    - **ยอดขายรวม (Gross Sales)**
    - **ยอดเงินคืน/ยกเลิก (Total Refund / Voided)** (ตัวเลขสีแดงหรือโทนเตือน พร้อมจำนวนบิลที่คืน)
    - **ยอดขายสุทธิ (Net Revenue)** = Gross - Refund
  - ตารางรายการบิลที่ถูก Refund / Void:
    - แสดงเลขที่ใบเสร็จ, เวลาที่ยกเลิก, พนักงานที่กดยกเลิก, เหตุผลในการคืนเงิน (เช่น ลูกค้าเปลี่ยนใจ, ออเดอร์ทำผิด)
    - แสดงวัตถุดิบที่ถูกดึงกลับเข้าสต็อก หรือทิ้งเป็นของเสีย
* **Backend ([DashboardController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/DashboardController.php) / Order API)**:
  - เพิ่มฟิลด์ `refund_total`, `refund_count`, `net_sales` ใน API response ของ `/api/reports/sales` และ `/api/dashboard`

---

#### 3. 🛡️ แยกระบบสิทธิ์พนักงานชัดเจน (Strict Role-Based Permissions) & ปรับ Layout หน้าจัดการสิทธิ์
> **เป้าหมาย**: จัดหมวดหมู่สิทธิ์ (Permissions) ให้เป็นระบบ ไม่ปะปน และปรับหน้าจอ Role & Permission Management ให้สวยงาม เข้าใจง่าย

* **การแยกสิทธิ์แบบละเอียด (Granular Permissions)**:
  - **POS & Sales**: ขายหน้าร้าน, ให้ส่วนลดพิเศษ, ยกเลิกบิล/Refund (สิทธิ์เฉพาะ Manager/Owner), ดูประวัติบิล
  - **Stock & Inventory**: ดูสต็อก, ตรวจนับสต็อกสิ้นวัน, รับของเข้าจากบิล, แก้ไขสูตรต้นทุน (BOM), ลบวัตถุดิบ
  - **Reports & Finance**: ดูยอดขายรายวัน, ดูรายงานกำไร-ขาดทุน, Export ข้อมูลบัญชี
  - **Settings & AI**: จัดการพนักงาน, จัดการสาขา, ใช้งานฟีเจอร์ AI ขั้นสูง
* **ปรับ Layout หน้า ([src/app/(app)/roles/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/roles/page.tsx) & [src/app/(app)/staff/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/staff/page.tsx))**:
  - ออกแบบเป็น **Role Matrix Grid** หรือ Accordion แยกตามหมวดหมู่ฟังก์ชัน (POS / Stock / Finance / Admin)
  - มี Checkbox / Switch ที่เปิด-ปิดสิทธิ์ได้เป็นกลุ่ม หรือรายข้อ
  - สรุป Badge สถานะให้ชัดเจน เช่น `เจ้าของร้าน (Super Admin)`, `ผู้จัดการ (Manager)`, `พนักงานขาย (Cashier)`, `พนักงานครัว/บาริสต้า (Kitchen/Barista)`

---

#### 4. 🛒 ปรับปรุง Layout หน้าซื้อของเข้าร้าน / ใบสั่งซื้อ (Purchase Orders UX Polish)
> **เป้าหมาย**: ปรับโฉมหน้าซื้อของเข้าร้าน ([src/app/(app)/stock/purchase-orders/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/purchase-orders/page.tsx)) ให้กระชับ สบายตา ใช้งานง่ายสไตล์ Minimal Cafe

* **การปรับ Layout & Flow**:
  - จัดการแสดงผลส่วนหัว: ปรับปุ่มสร้างใบสั่งซื้อ, ตัวกรองสถานะ (ฉบับร่าง, รอดำเนินการ, ซื้อแล้ว, รับเข้าสต็อกแล้ว) ให้อยู่ในระนาบที่สบายตา
  - ปรับการ์ดสรุปยอดการจัดซื้อรายเดือน / สัปดาห์ (PO Spending Summary)
  - ปรับตารางรายการซื้อให้กว้างขึ้น ไม่ตัดบรรทัด มี Badge แสดงสถานะการสแกนบิลชัดเจน
  - เพิ่มปุ่มด่วนสำหรับสร้างใบตลาดจาก "วัตถุดิบที่ถึงจุดสั่งซื้อ (Re-order point)" ในคลิกเดียว

---

#### 5. 🤖 AI Insights ผสานข้อมูลแผนที่คู่แข่ง (Map Location) + ข้อมูลการขายจริงในร้าน (Internal POS Sales)
> **เป้าหมาย**: ให้ระบบ AI (Gemini) ไม่เพียงแค่วิเคราะห์แยกส่วนแผนที่ หรือแยกส่วนยอดขาย แต่ดึงข้อมูลทั้งสองด้านมา **Cross-Analyze** ร่วมกันเพื่อสร้างคำแนะนำทางธุรกิจที่แม่นยำสูง

* **ข้อมูลนำเข้าที่จะส่งให้ AI (Input Contexts)**:
  - **ข้อมูลภายนอก (External Location Context)**: พิกัดร้าน, ประเภทคู่แข่งโดยรอบในระยะ 1-3 กม., กลุ่มลูกค้าในพื้นที่ (ออฟฟิศ, มหาวิทยาลัย, คอนโด), ช่องว่างทางการตลาด (Market Gap) จากการสแกนแผนที่
  - **ข้อมูลภายใน (Internal POS Sales Context)**: เมนูที่ขายดี/ขายไม่ออกของร้าน, สัดส่วนยอดขายตามหมวดหมู่, อัตรากำไร (Margin %), ปริมาณสต็อกคงเหลือที่มีมากเกินไป (Excess Stock)
* **ผลลัพธ์การวิเคราะห์ที่ชาญฉลาด (AI Strategic Output)**:
  - **การปรับราคา & ชูจุดขายเทียบกับคู่แข่ง**: เช่น "ร้านกาแฟแบรนด์ใหญ่รอบข้างขายกาแฟ Specialty อยู่ที่ 120-140 บาท แต่ร้านเรามีเมล็ดเกรดดีในสต็อก สามารถชูเมนู Dirty หรือ Drip ในราคา 85-95 บาท เพื่อเจาะกลุ่มคนทำงานได้"
  - **การระบายสต็อกด้วยเมนูตอบโจทย์พื้นที่**: แนะนำการนำวัตถุดิบที่นอนนิ่งในคลังมาทำเป็นเมนู Seasonal ตามพฤติกรรมลูกค้าในละแวกนั้น
  - **ปรับ UI หน้า [menu/ai-insights/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/menu/ai-insights/page.tsx)**:
    - เพิ่มแท็บ/ส่วนแสดงผล **"ผสานอินไซต์แผนที่ + ยอดขายจริง (Cross-Channel Store Strategy)"**
    - มีตัวเลือกให้กด "ดึงข้อมูลจากแผนที่ล่าสุด" และ "ดึงข้อมูลยอดขาย 30 วันล่าสุด" มารวมเป็น Prompt เดียวกัน
    - แสดงข้อเสนอแนะเป็น Actionable Cards พร้อมปุ่มกด "นำไปสร้างเป็นโปรโมชั่น / เมนูใหม่" ได้ทันที

---

### 📌 ขั้นตอนการเริ่มทำงานในครั้งถัดไป (Quick Start Checklist)
1. ตรวจสอบสถานะ Server: Frontend (`npm run dev`) และ Backend (`php artisan serve`)
2. เริ่มจาก **Task 1 (Stock Audit / ปิดกะตรวจสต็อก)** เพื่อให้ Flow ของคลังสมบูรณ์ก่อน
3. ต่อด้วย **Task 2 (ยอด Refund ในรายงานยอดขาย)**
4. ตามด้วย **Task 3 & 4 (จัดการสิทธิ์ และ หน้าซื้อของเข้าร้าน)**
5. ปิดท้ายด้วย **Task 5 (AI Cross-Analysis: แผนที่ + ยอดขายจริง)**



