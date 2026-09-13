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

### [2026-09-12 - 2026-09-13] ระบบสต็อก 2 คลังสำหรับร้านกาแฟ (Two-Tier Backstock & Front Bar), ตรวจนับสต็อกสิ้นวัน (Stock Audit), ระบบโปรไฟล์ & สิทธิ์ผู้ใช้

1. **ระบบสต็อก 2 คลังสำหรับคาเฟ่ (Two-Tier Inventory System: คลังหลังร้าน & คลังหน้าบาร์)**:
   - **แก้โจทย์จริงของธุรกิจร้านกาแฟ**:
     - หน้าร้าน/หน้าบาร์ ตัดวัตถุดิบเป็นกรัมหรือ มล. ต่อแก้ว (Base Unit) จากขวดหรือถุงที่เปิดใช้
     - หลังร้านเก็บสต็อกเป็นแพ็ค/ลัง/ถุง/ขวด (Package Unit) เพื่อให้นับง่าย สั่งของง่าย และไม่สับสน
   - **Backend (Laravel)**:
     - Migration เพิ่มฟิลด์ `is_two_tier` (boolean), `bar_quantity` (float), `backstock_quantity` (float), `package_unit` (string), `package_size` (float) ในตาราง `ingredients`
     - API `POST /api/ingredients/{id}/open-package`: เบิก/จ่ายวัตถุดิบจากหลังร้าน 1 แพ็คเข้าหน้าบาร์ (หลังร้านลด 1 แพ็ค, หน้าบาร์เพิ่มตามขนาดบรรจุ `package_size`, สต็อกรวมทั้งร้านคงที่, บันทึก Movement เป็น `transfer`)
     - API `POST /api/ingredients/{id}/add-backstock`: รับของใหม่เข้าคลังหลังร้านแบบยืดหยุ่น (Flexible Inbound Sizing) รองรับกรณีซัพพลายเออร์ส่งขนาดถุง/ขวดต่างจากเดิม คำนวณเนื้อวัตถุดิบเข้าสต็อกรวมอย่างแม่นยำ และมีตัวเลือกบันทึกเป็นขนาดมาตรฐานใหม่
     - POS Sales (`OrderController`): ตัดสต็อกหน้าบาร์ (`bar_quantity`) และสต็อกรวม (`quantity`) ตามสูตรชง BOM
   - **Frontend (Next.js)**:
     - **แท็บ "สต็อกหลังร้าน" ([BackstockTab.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/components/BackstockTab.tsx))**:
       - 4 การ์ดสรุป KPI: รายการสินค้าในหลังร้าน, สต็อกคงเหลือในห้องสต็อก (ถุง/ขวด/ลัง), รายการหลังร้านเหลือน้อย/หมด, มูลค่าสต็อกในคลังหลังร้าน
       - ตารางคลังหลังร้าน:
         - แสดงคงเหลือหลังร้าน (แพ็ค/ถุง/ขวด) เด่นชัด เช่น `4 ถุง (= 4,000 กรัม)`
         - แสดงพร้อมใช้ที่หน้าบาร์ เช่น `☕ 1,000 กรัม (เปิด 1 ถุง)` พร้อมแจ้งเตือนสีแดงทันทีเมื่อหน้าบาร์หมด
         - แสดงสต็อกรวมทั้งร้าน พร้อมเปอร์เซ็นต์และหลอดสถานะรวมทั้งร้านจริง ({totalRatio}%) เทียบความจุคลังสูงสุด
         - ปุ่มด่วนในแต่ละแถว: **"☕ จ่ายไปบาร์"** และ **"+ รับเข้า"**
       - Modal รับของเข้าหลังร้าน: ปรับขนาดบรรจุภัณฑ์ของล็อตนี้ได้อิสระ (`receivePackSize`), มีพรีวิวคำนวณสด เช่น `+2,000 กรัม`, และ Checkbox เปลี่ยนขนาดมาตรฐานถาวร
     - **แท็บ "สต็อกหน้าบาร์" ([stock/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/page.tsx))**:
       - แสดงสถานะหน้าบาร์ `☕ {barQty} {unit} (เปิด {openPacks} {package_unit})` พร้อมปุ่มดึงของจากหลังร้าน **"📦 ดึง 1 ถุง"** และยอดคงเหลือหลังร้าน
       - คอลัมน์ "รวมทั้งร้าน" แสดงหลอดสถานะและเปอร์เซ็นต์ของสต็อกทั้งหมด ({ratio}%) สอดคล้องกันทั้งระบบ
     - **คลีนหน้าต่างเพิ่มวัตถุดิบ ([AddIngredientModal.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/components/AddIngredientModal.tsx))**:
       - ตัดปุ่มเลือกลักษณะการตัดสต็อก (`tracking_type`) ที่ซ้ำซ้อนออก ให้ฟอร์มกว้าง สะอาด สบายตา และตัดตามแก้ว/คลังบาร์อย่างเป็นเอกภาพ

2. **ระบบตรวจนับและรีเช็คสต็อกสิ้นวัน / ปิดกะ ([StockAuditTab.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/components/StockAuditTab.tsx))**:
   - แท็บ "รีเช็คสต็อก" ในหน้า `/stock`
   - ตรวจนับแยก 2 คลัง: นับหลังร้าน (นับเป็นแพ็ค/ถุง) + นับหน้าบาร์ (นับเป็นกรัม/มล.)
   - คำนวณผลต่าง (Variance) แบบ Real-time ทันทีที่กรอกตัวเลข
   - ปุ่ม **"ดึงยอดปัจจุบันเป็นค่าเริ่มต้น"** ช่วยให้ตรวจนับเฉพาะตัวที่มีผลต่างได้รวดเร็ว
   - ปุ่ม **"ยืนยันและปรับยอดสต็อกจริง"** เรียก API `POST /api/ingredients/audit-reconcile` บันทึกผลต่างและ Audit Log อัตโนมัติ

3. **ระบบสิทธิ์ผู้ใช้งาน & ป้องกันความปลอดภัยระดับบัญชี (User Roles & Super Admin Guard)**:
   - Migration เพิ่มคอลัมน์ `username`, `role` (`'superadmin'`, `'owner'`, `'admin'`, `'manager'`, `'staff'`) ในตาราง `users`
   - Security Guard: ป้องกันบัญชีระดับ Owner / Admin ไม่ให้แก้ไขหรือลบบัญชี Super Admin ได้

4. **ระบบโปรไฟล์ผู้ใช้งาน & เปลี่ยนรหัสผ่านใน Topbar ([ProfileModal.tsx](file:///c:/meeting/smartStock/src/components/ProfileModal.tsx))**:
   - เมนู Dropdown ที่รูปโปรไฟล์มุมซ้ายล่างและ Topbar
   - Modal แก้ไขข้อมูลส่วนตัว: ชื่อ, อีเมล, ชื่อผู้ใช้ (username), อัปโหลดรูปภาพโปรไฟล์ (Profile Avatar)
   - ช่องเปลี่ยนรหัสผ่านแบบไม่บังคับ (Optional Password Change) หากไม่ต้องการเปลี่ยนรหัสผ่าน สามารถกดบันทึกข้อมูลส่วนตัวได้ทันที

5. **ระบบการคืนเงิน / ยกเลิกบิล POS (Refund & Void Orders)**:
   - Migration เพิ่มฟิลด์ `refund_amount`, `refund_reason`, `refunded_at`, `refunded_by` ในตาราง `orders`
   - โครงสร้างและฟังก์ชันการคืนเงินในหน้าประวัติบิล พร้อมดึงสต็อกวัตถุดิบคืนคลังอย่างถูกต้อง

---

## 📌 สรุปสถานะโครงการปัจจุบัน (Current System Status)
- ✅ **UI Theme & Design System**: มินิมอล โมโนโครม (Slate/Neutral) ผสานโทนอบอุ่นคาเฟ่ 60-30-10 สไตล์ Enterprise
- ✅ **Component Standards**: `Button.tsx`, `Badge.tsx`, `Table.tsx`, `Dropdown.tsx`, `Skeleton.tsx` และ shadcn `components/ui/` ใช้งานเป็นมาตรฐานหลัก 100%
- ✅ **ระบบสต็อก 2 คลัง (Two-Tier Stock)**: ทำงานสมบูรณ์แบบทั้งการตัดแก้วหน้าบาร์, เบิกขวด/ถุงเข้าบาร์ใน 1 คลิก, และรับของเข้าหลังร้านแบบยืดหยุ่น
- ✅ **ระบบตรวจนับสต็อกสิ้นวัน (Stock Audit & Reconcile)**: ตรวจนับแยก 2 คลังและปรับยอดพร้อม Audit Logs สมบูรณ์
- ✅ **ระบบผู้ใช้งาน & โปรไฟล์ (User & Profile Management)**: แก้ไขข้อมูลส่วนตัว, รูปโปรไฟล์, จัดระดับสิทธิ์บทบาทพร้อม Super Admin Guard
- ✅ **Frontend Next.js 16 (Turbopack) & TypeScript**: ผ่านการตรวจสอบ Typecheck `npx tsc --noEmit` และ `npm run build` สำเร็จ 100% ปราศจาก error
- ✅ **Backend Laravel 11 API**: ฐานข้อมูล Migration สมบูรณ์ พร้อม Database Transactions และ Eager Loading

---

## 🚀 แผนการพัฒนารอบถัดไป (Upcoming Detailed Roadmap & Implementation Plan)

### 🎯 ภาพรวมและเป้าหมายหลัก (Core Objectives)
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             SmartStock Upcoming Roadmap                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. ✅ 📦 ตรวจนับสต็อกสิ้นวัน (End-of-Day Stock Audit & Reconcile) - สำเร็จแล้ว     │
│ 2. ✅ 📦 ระบบสต็อก 2 คลัง (Two-Tier Backstock & Front Bar) - สำเร็จแล้ว          │
│ 3. 🧾 หน้ารายงานยอดขาย: แสดง KPI ยอด Refund / บิลคืนเงิน & หักลบสุทธิบนชาร์ต     │
│ 4. 🛡️ ปรับ Layout หน้าจัดการสิทธิ์ (Role Matrix UI Polish)                       │
│ 5. 🛒 ปรับ Layout หน้าซื้อของเข้าร้าน / ใบสั่งซื้อ (Purchase Orders UX Polish)    │
│ 6. 🤖 AI ผสานข้อมูลแผนที่ (Map Competitors) + ข้อมูลการขายจริงในร้าน (Internal POS) │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 📋 รายละเอียดแผนปฏิบัติการต่อเนื่อง (Detailed Action Items)

#### 1. 🧾 หน้ารายงานยอดขาย: แสดงยอด Refund & รายละเอียดการคืนเงินบนแดชบอร์ด
> **เป้าหมาย**: เพิ่มความโปร่งใสทางบัญชี ให้เห็นยอดขายรวม (Gross Sales), ยอดเงินที่ Refund/ยกเลิกบิล, และยอดขายสุทธิ (Net Sales) บนชาร์ต
* **Frontend ([src/app/(app)/reports/sales/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/reports/sales/page.tsx))**:
  - เพิ่ม KPI Card:
    - **ยอดขายรวม (Gross Sales)**
    - **ยอดเงินคืน/ยกเลิก (Total Refund / Voided)** (ตัวเลขสีแดงหรือโทนเตือน พร้อมจำนวนบิลที่คืน)
    - **ยอดขายสุทธิ (Net Revenue)** = Gross - Refund
  - ตารางรายการบิลที่ถูก Refund / Void:
    - แสดงเลขที่ใบเสร็จ, เวลาที่ยกเลิก, พนักงานที่กดยกเลิก, เหตุผลในการคืนเงิน (เช่น ลูกค้าเปลี่ยนใจ, ออเดอร์ทำผิด)
* **Backend ([DashboardController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/DashboardController.php) / Order API)**:
  - เพิ่มฟิลด์ `refund_total`, `refund_count`, `net_sales` ใน API response ของ `/api/reports/sales` และ `/api/dashboard`

---

#### 2. 🛡️ ปรับ Layout หน้าจัดการสิทธิ์ (Role & Permission Management UI Polish)
> **เป้าหมาย**: จัดหมวดหมู่สิทธิ์ให้สวยงาม เข้าใจง่าย สไตล์ Role Matrix Grid
* **ปรับ Layout หน้า ([src/app/(app)/roles/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/roles/page.tsx) & [src/app/(app)/staff/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/staff/page.tsx))**:
  - ออกแบบเป็น **Role Matrix Grid** หรือ Accordion แยกตามหมวดหมู่ฟังก์ชัน (POS / Stock / Finance / Admin)
  - มี Checkbox / Switch ที่เปิด-ปิดสิทธิ์ได้เป็นกลุ่ม หรือรายข้อ
  - สรุป Badge สถานะให้ชัดเจน เช่น `เจ้าของร้าน (Super Admin)`, `ผู้จัดการ (Manager)`, `พนักงานขาย (Cashier)`, `พนักงานครัว/บาริสต้า (Kitchen/Barista)`

---

#### 3. 🛒 ปรับปรุง Layout หน้าซื้อของเข้าร้าน / ใบสั่งซื้อ (Purchase Orders UX Polish)
> **เป้าหมาย**: ปรับโฉมหน้าซื้อของเข้าร้าน ([src/app/(app)/stock/purchase-orders/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/purchase-orders/page.tsx)) ให้กระชับ สบายตา ใช้งานง่ายสไตล์ Minimal Cafe
* **การปรับ Layout & Flow**:
  - จัดการแสดงผลส่วนหัว: ปรับปุ่มสร้างใบสั่งซื้อ, ตัวกรองสถานะ (ฉบับร่าง, รอดำเนินการ, ซื้อแล้ว, รับเข้าสต็อกแล้ว) ให้อยู่ในระนาบที่สบายตา
  - ปรับการ์ดสรุปยอดการจัดซื้อรายเดือน / สัปดาห์ (PO Spending Summary)
  - ปรับตารางรายการซื้อให้กว้างขึ้น ไม่ตัดบรรทัด มี Badge แสดงสถานะการสแกนบิลชัดเจน
  - เพิ่มปุ่มด่วนสำหรับสร้างใบตลาดจาก "วัตถุดิบที่ถึงจุดสั่งซื้อ (Re-order point)" ในคลิกเดียว

---

#### 4. 🤖 AI Insights ผสานข้อมูลแผนที่คู่แข่ง (Map Location) + ข้อมูลการขายจริงในร้าน (Internal POS Sales)
> **เป้าหมาย**: ให้ระบบ AI (Gemini) ดึงข้อมูลแผนที่ภายนอก + ยอดขายภายในร้านมา Cross-Analyze สร้างกลยุทธ์เมนูและโปรโมชั่นเจาะตลาด
* **ผลลัพธ์การวิเคราะห์ที่ชาญฉลาด (AI Strategic Output)**:
  - การปรับราคา & ชูจุดขายเทียบกับคู่แข่งรอบข้างในระยะ 1-3 กม.
  - การระบายสต็อกด้วยเมนูตอบโจทย์กลุ่มลูกค้าในพื้นที่
  - หน้า [menu/ai-insights/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/menu/ai-insights/page.tsx) มีปุ่มกดนำผลวิเคราะห์ไปสร้างเป็นโปรโมชั่นหรือเมนูใหม่ได้ทันที

---

### [2026-09-13] เสริมความแม่นยำระบบสต็อก 2 คลัง (Two-Tier Inventory Precision) & การจัดการของเสีย & Dynamic Recipe Modifier BOM

#### 1. ⚡ Partial Open Package Tracking (ขวด/ถุงที่เปิดแล้วแต่ใช้ไม่หมด)
- **Database & Architecture**:
  - เพิ่มคอลัมน์ `opened_unit_remaining` (decimal 10,2 nullable) ในตาราง `ingredients`
  - สร้าง helper `$ingredient->recalculateOpenedRemaining()` ในโมเดล `Ingredient` คำนวณจาก `bar_quantity % package_size` แบบแม่นยำทุกครั้งที่มีการเปิดแพ็ค, ตัดขาย POS, หรือปรับยอด
- **Business Logic & Movement Auditing**:
  - แยกประเภทความเคลื่อนไหว `StockMovement.type`:
    - `'open'`: บันทึกเมื่อมีการเปิดแพ็คจากหลังร้านเข้าหน้าบาร์ (`bar_quantity + package_size`, `backstock_quantity - 1`)
    - `'consume'`: บันทึกเมื่อตัดสต็อกตามสูตรอาหาร POS หรือสูตรตัวเลือกเสริม
  - คำนวณและเก็บบันทึก `unit_cost` ตามต้นทุนจริง ณ ช่วงเวลานั้นลงในบันทึกความเคลื่อนไหวทุกรายการ
- **Frontend UI / UX**:
  - ในตารางสต็อกหน้าบาร์ ([stock/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/page.tsx)) และคลังหลังร้าน ([BackstockTab.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/components/BackstockTab.tsx)) แสดงสถานะ `⚡ เปิดค้าง {opened_unit_remaining} {unit} จากแพ็คที่แล้ว` ในลักษณะ Badge ชัดเจน ช่วยให้เช็คยอดก่อนเปิดขวดใหม่ได้ทันที
  - หน้าประวัติความเคลื่อนไหวสต็อก มี Badge เฉพาะสำหรับ `เปิดแพ็ค (Open)` และ `ตัดสต็อก POS (Consume)` โทน Slate คมชัด

#### 2. 🗑️ บันทึกของเสีย / ตกหล่น (Waste & Spillage Adjustment)
- **API & Backend**:
  - Endpoint `POST /api/ingredients/{id}/waste-adjust`:
    - รับค่า `quantity`, `reason` (`'หก/เลอะ'`, `'เสีย/บูด'`, `'หมดอายุ'`, `'ชงผิด'`, `'อื่นๆ'`), `tier` (`'bar'` | `'backstock'`), `notes`
    - ลดสต็อกตามคลังที่ระบุ พร้อมคำนวณมูลค่าความเสียหายตาม `unit_cost`
    - สร้าง `StockMovement` บันทึก `type = 'waste'`, `unit_cost`, และหมายเหตุรายละเอียดเหตุผล
  - Endpoint `GET /api/reports/waste-stats`: สรุปมูลค่าของเสียรวม, จำนวนครั้ง, การแยกตามสาเหตุ และประวัติ 10 รายการล่าสุด
- **Frontend Quick Waste Modal (`QuickWasteModal.tsx`)**:
  - ดีไซน์ Minimal สไตล์คีย์ลัด ไม่ต้องอ่านเยอะ ("กรอกๆ แบบไม่ต้องอ่านเยอะ")
  - Chip เลือกสาเหตุคลิกเดียว (`หก/เลอะ`, `เสีย/บูด`, `หมดอายุ`, `ชงผิด`, `อื่นๆ`)
  - คำนวณมูลค่าความเสียหายแบบ Real-time ตามปริมาณที่กรอก
  - ปุ่ม `[🗑️ ของเสีย]` ด่วนในตารางสต็อกทั้งหน้าบาร์และหลังร้าน
- **Sales Reports Dashboard Integration ([reports/sales/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/reports/sales/page.tsx))**:
  - เพิ่ม KPI Card: **"มูลค่าของเสีย (Waste Cost)"** แสดงยอดรวมความเสียหายและจำนวนครั้งที่บันทึก

#### 3. ☕ Dynamic Recipe Modifier BOM Mapping (ตัวเลือกเสริมตัดสต็อกตามจริง)
- **Database & Architecture**:
  - ตาราง `menu_option_ingredients` เชื่อมโยง `menu_item_id`, `option_name` (เช่น "เพิ่มช็อตกาแฟ (+18g)", "เปลี่ยนนมโอ๊ต Oatly (+150ml)"), `ingredient_id`, `quantity`, `unit`, `extra_cost`, `extra_price`
  - Eager-loading ใน `MenuItem` ผ่านความสัมพันธ์ `optionIngredients`
- **POS & Order Deduction**:
  - ปรับ `OrderController@store`: อ่าน `selectedModifiers` จากออเดอร์ POS และตัดสต็อกวัตถุดิบเสริมเพิ่มเติมจากสูตรหลัก (Base Recipe) ทันที
  - หากสต็อกหน้าบาร์ไม่พอ ระบบจะเปิดแพ็คใหม่จากหลังร้านเข้าบาร์อัตโนมัติ (`type = 'open'`) แล้วจึงตัดสต็อก (`type = 'consume'`)
- **Frontend UI**:
  - **Recipe Builder ([RecipeBuilder.tsx](file:///c:/meeting/smartStock/src/app/(app)/menu/components/RecipeBuilder.tsx))**: ตารางกำหนดตัวเลือกเสริมและปริมาณตัดสต็อกพร้อมพรีวิว
  - **POS Modal ([ItemOptionModal.tsx](file:///c:/meeting/smartStock/src/app/(app)/sales/pos/components/ItemOptionModal.tsx))**: แสดงชิปตัวเลือกเสริมแบบไดนามิก คำนวณราคาเพิ่ม และแสดง Real-time BOM Preview สต็อกคงเหลือแบบเรียลไทม์
  - **POS Cart & Checkout ([sales/pos/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/sales/pos/page.tsx))**: แสดงรายการตัวเลือกเสริม ราคาที่เพิ่มขึ้น และตัดสต็อกอัตโนมัติเมื่อกดชำระเงิน

---

### [2026-09-13] การแยกร้านค้าและข้อมูลยอดขายให้แยกขาดจากกัน (Strict Multi-Store Isolation & Data Consistency)

#### 1. 🔍 แก้ไขปัญหาตัวเลขยอดขายในหน้าประวัติบิล (`sales/orders`) ไม่ตรงกับหน้า Dashboard
- **ต้นตอของปัญหา (Root Cause)**:
  - ในตาราง `orders` มีออเดอร์เก่า `ORD-20260913-4CD8` (ยอด ฿450) บันทึกไว้โดยไม่มีค่าร้านค้า (`store_id = null`)
  - หน้า Dashboard (`/dashboard`) ดึงข้อมูลโดยส่ง `X-Store-ID: 1` จึงคำนวณเฉพาะบิลที่มี `store_id = 1` เท่านั้น (ได้ ฿85 + ฿50 = ฿135) และคัดบิล ฿450 ออก
  - หน้าประวัติบิล (`/sales/orders`) ยิง API `/pos/orders` โดยไม่ได้ส่ง `X-Store-ID` และไม่ได้ส่ง `store_id` ในพารามิเตอร์ จึงดึงทุกบิลของทุกร้านมารวมกัน (ได้ 50 + 85 + 450 = ฿585)
- **การแก้ไข (Solution)**:
  - อัปเดตฐานข้อมูลผูกบิลทั้งหมดที่ไม่มี store_id ให้เชื่อมกับ Store 1 (Cafe) อย่างสมบูรณ์
  - ปรับปรุง [OrderController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/OrderController.php):
    - `getStoreId()` ตรวจสอบทั้ง Header `X-Store-ID`, Query parameter `store_id`, Body input `store_id`, และ Fallback จากร้านของผู้ใช้
    - ใน `store()`: หากไม่มี store_id ส่งมา ให้ดึงจาก MenuItem แรกของออเดอร์อัตโนมัติ ป้องกันไม่ให้เกิด Order ที่มี `store_id = null`
  - ปรับปรุง [MenuController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/MenuController.php), [DashboardController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/DashboardController.php), [IngredientController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/IngredientController.php) ให้รองรับ Query parameter `store_id` ควบคู่กับ Header เสมอ
  - **ผลลัพธ์**: หน้ารายการคำสั่งซื้อและ Dashboard ของ Cafe แสดงยอด **฿585.00 (3 บิล)** ตรงกันเป๊ะ 100%

#### 2. 🛡️ การแยกร้านค้าเด็ดขาด ไม่ให้ข้อมูลร้านหนึ่งรั่วไหลไปอีกร้าน (Multi-Store Data Leak Prevention)
- **Frontend State & Context**:
  - [AuthContext.tsx](file:///c:/meeting/smartStock/src/lib/AuthContext.tsx): อัปเดต `setActiveStore` และ `initAuth` ให้บันทึกทั้ง `smartstock_active_store` และ `active_store_id` ลงใน `localStorage` ทุกครั้งที่สลับร้าน
  - [StockContext.tsx](file:///c:/meeting/smartStock/src/lib/StockContext.tsx):
    - เมื่อ `activeStore?.id` เปลี่ยนแปลง ให้รีเซ็ต State ของคำสั่งซื้อ, วัตถุดิบ, เมนู, และ Dashboard ทันที ป้องกัน Flash of Stale Store Data
    - สร้างและส่งออกฟังก์ชันรวมศูนย์ `fetchRefundStats` ที่แนบ `X-Store-ID` เสมอ
  - [types/index.ts](file:///c:/meeting/smartStock/src/types/index.ts): เพิ่มฟิลด์ `store_id?: number | null` ใน Types `Ingredient`, `MenuItem`, `MenuOptionIngredient`, และ `Order`
- **Frontend Pages Integration**:
  - [sales/orders/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/sales/orders/page.tsx):
    - เรียกใช้ `activeStore` จาก `useAuth()`
    - ใน `fetchOrdersByFilter` ส่งทั้ง Header `X-Store-ID: activeStore.id` และ Query param `&store_id=${activeStore.id}`
    - ผูก `activeStore?.id` ใน `useEffect` เพื่อให้ Refresh ทันทีที่สลับร้าน
    - เพิ่ม Client-side filtering กรองซ้ำเฉพาะบิลของร้านที่เลือก
  - [reports/sales/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/reports/sales/page.tsx):
    - สลับมาใช้ `fetchRefundStats()` จาก `useStock()` ที่ผูกกับร้านค้าแบบเรียลไทม์
    - ผูก `activeStore?.id` ใน `useEffect` และกรอง Order count ตาม `activeStore.id`
- **ผลการทดสอบการสลับร้าน (Switching Verification)**:
  - เมื่อเลือกร้าน **"ร้านอาหาร" (Store 3)**:
    - หน้า `sales/orders`: แสดง 0 บิล (ไม่มีบิลของคาเฟ่หลุดมาเลย)
    - หน้า `dashboard`: ยอดขายวันนี้แสดง ฿0.00
    - หน้า `reports/sales`: ยอด Gross Sales, Refund, และ Net Revenue แสดง ฿0.00 ทั้งหมด
  - เมื่อสลับกลับมาที่ **"Cafe แมวดำ" (Store 1)**:
    - หน้า `sales/orders`: แสดง 3 บิล ยอด ฿585.00 ครบถ้วน
    - หน้า `dashboard`: แสดง 3 บิล ยอด ฿585.00 ครบถ้วนตรงกัน





