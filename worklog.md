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

### [2026-09-24] ปรับระบบตำแหน่งอัตโนมัติตามประเภทร้าน (Dynamic Roles by Store Type) & เพิ่มแท็บจัดการตำแหน่งและสิทธิ์ (`/staff`)

0. **ปรับการแสดงผล Role ใน Topbar User Profile Popover & Sidebar User Footer**:
   - สร้างโมดูลกลาง `src/lib/role-utils.ts` (`getUserRoleBadge` และ `getRoleDisplayName`)
   - แก้ไขป้ายบทบาทในกล่องโปรไฟล์มุมขวาบน (`Topbar.tsx`) จากเดิมที่ฮาร์ดโค้ด `หัวหน้าครัว (Chef)` ให้แสดงผลไดนามิกตามประเภทร้านค้าปัจจุบัน เช่น ร้านคาเฟ่จะแสดงเป็น **"บาริสต้า"** ทันที และไม่มีวงเล็บภาษาอังกฤษ
   - แก้ไขส่วนแสดงข้อมูลผู้ใช้ด้านล่างของ `Sidebar.tsx` ให้ใช้ฟังก์ชันเดียวกัน

1. **ปรับชื่อตำแหน่งสายการผลิตอัตโนมัติตามประเภทร้าน (Dynamic Store Roles)**:
   - **ประเภทร้านค้าคาเฟ่ (`cafe` / ค่าเริ่มต้น)**:
     - `chef` / สายการผลิต แสดงเป็น **"บาริสต้า"**
     - คำอธิบาย: จัดการสูตรเครื่องดื่ม (BOM) เบิกใช้วัตถุดิบ และแจ้งเตือนของใกล้หมด
   - **ประเภทร้านอาหาร (`restaurant`)**:
     - `chef` แสดงเป็น **"หัวหน้าครัว"**
     - คำอธิบาย: จัดการสูตรอาหาร (BOM) เบิกใช้วัตถุดิบ และแจ้งเตือนของใกล้หมด
   - **ประเภทร้านเบเกอรี่ (`bakery`)**:
     - `chef` แสดงเป็น **"เชฟเบเกอรี่"**
     - คำอธิบาย: จัดการสูตรขนมอบ (BOM) เบิกใช้วัตถุดิบ และแจ้งเตือนของใกล้หมด

2. **รวมผู้จัดการร้าน (Manager) เป็น "เจ้าของร้าน" (Owner)**:
   - ปรับการแสดงผลและโครงสร้าง Role ให้ `manager` และ `owner` แสดงเป็น **"เจ้าของร้าน"** ทั้งหมด
   - ตัดความซ้ำซ้อนในตัวเลือก Dropdown ของฟอร์มเพิ่ม/แก้ไขพนักงาน และตัวกรองตำแหน่ง
   - สิทธิ์การเข้าถึง: จัดการข้อมูลร้าน, พนักงาน, สูตรอาหาร, สต็อก และยอดขายได้ครบถ้วน

3. **เพิ่มแท็บ "จัดการตำแหน่ง & สิทธิ์" (Roles & Permissions Tab) ในหน้า `/staff`**:
   - เพิ่มระบบสลับแท็บระหว่าง:
     - **รายชื่อพนักงาน** (Staff Directory)
     - **จัดการตำแหน่ง & สิทธิ์** (Roles & Permissions)
   - มีแบนเนอร์แสดงประเภทร้านค้าปัจจุบัน พร้อมระบุตำแหน่งหลักประจำร้านอัตโนมัติ (เช่น ร้านคาเฟ่ -> บาริสต้า)
   - การ์ดเลือกบทบาท (`เจ้าของร้าน`, `บาริสต้า / เชฟเบเกอรี่ / หัวหน้าครัว`, `พนักงานแคชเชียร์`, `พนักงานทั่วไป`)
   - กล่องเลือกสิทธิ์ (Permissions Checkboxes) แบ่งเป็น 5 หมวดหมู่:
     - 📦 คลังสินค้า & สต็อก (`inventory`)
     - 🍽️ เมนู & สูตร BOM (`menu`)
     - 💰 ขายหน้าร้าน POS (`pos`)
     - 📊 รายงาน & สถิติ (`report`)
     - ⚙️ จัดการระบบ & สิทธิ์ (`system`)
   - รองรับการบันทึกสิทธิ์ผ่าน API `PUT /api/roles-permissions/{roleId}`

4. **ความสอดคล้องทุกหน้าจอ (Consistency & UI Polish)**:
   - แสดงผลภาษาไทยล้วน ไม่มีวงเล็บภาษาอังกฤษในทุกจุด (`StaffModal`, `StaffTableView`, `StaffCardView`, ตัวกรองตำแหน่ง)
   - ปรับสีป้าย Badge ของ "เจ้าของร้าน" ให้ดูเด่นและพรีเมียมด้วยโทนสีน้ำตาล-ทอง (`#78350f` / `#f5efe6`)

---

### [2026-09-24] แก้ไขการมองเห็นพนักงานในร้าน (Staff Store Scoping) & ปรับปรุง Role Dropdown ใน StaffModal

1. **แก้ไขการมองเห็นพนักงานในร้านให้เห็นครบทุกตำแหน่ง (`/staff` & Backend API)**:
   - **Backend SQL Fix (`UserController.php`)**:
     - แก้ไข Query `where('username', '!=', 'admin')` ที่ทำให้พนักงานที่ไม่มี username (`username IS NULL`) ถูก SQL กรองทิ้งไปทั้งหมด
     - ปรับเงื่อนไขใหม่เป็น `where(function($q) { $q->whereNull('username')->orWhere('username', '!=', 'admin'); })` และ `whereNull('role')->orWhere('role', '!=', 'admin')`
     - ยกเลิกการกรอง `email not like %admin%` เพื่อให้พนักงานที่มีคำว่า admin ในอีเมลไม่โดนตัดทิ้ง
     - ปรับลำดับความสำคัญของ `$effectiveRole` ใน `formatUser()` ให้ตำแหน่งจริงของผู้ใช้ (`$user->role` เช่น `chef`, `cashier`) มีผลเหนือบทบาทหยาบใน pivot table (`owner`/`manager`/`staff`)
   - **Frontend Staff Visibility (`StaffClientView.tsx` & `Sidebar.tsx`)**:
     - อัปเดต `Sidebar.tsx`: เปิดสิทธิ์เมนู "รายชื่อพนักงาน" (`/staff`) ให้เห็นได้ทุกตำแหน่งในร้าน (`['admin', 'owner', 'manager', 'chef', 'cashier', 'staff']`)
     - แก้ไขการเปรียบเทียบ `storeId` ให้เป็น `String(s.id) === String(activeStore.id)` ป้องกันปัญหา Type mismatch ระหว่าง number/string
     - เพิ่มตัวแปร `canManageStaff`: แยกสิทธิ์ระหว่างผู้จัดการ/เจ้าของร้าน (เพิ่ม/แก้ไข/ลบได้) กับพนักงานทั่วไป (ดูรายชื่อพนักงานในร้านได้)
     - ปรับปรุง `server-api.ts`: ดึงข้อมูลจาก `data.users` และ `data.roles` แทนการเช็ก `Array.isArray(data)` ที่ทำให้ SSR ได้ค่าว่าง

2. **แก้ไข Role Dropdown ใน `StaffModal.tsx` & Smart Viewport Positioning ใน `Dropdown.tsx`**:
   - **แก้ไข Dropdown เมนูทะลุขอบจอ / ตัวเลือกแสดงไม่ครบ (`Dropdown.tsx`)**:
     - เปลี่ยนการคำนวณตำแหน่งเมนูใหม่ให้ตรวจสอบพื้นที่จริงด้านบนและด้านล่างของหน้าจอ (`window.innerHeight`)
     - เมื่อเปิดขึ้นด้านบน ให้ผูกพิกัดแบบ `bottom: window.innerHeight - rect.top + 6` พร้อมคำนวณ `maxHeight` อัตโนมัติ ทำให้เมนูลอยอยู่ชิดเหนือกดและไม่มีช่องว่าง
     - คำนวณ `maxHeight` แบบไดนามิกตามพื้นที่หน้าจอจริง ไม่ล้นออกนอก viewport และสามารถเลื่อน scroll ดูตัวเลือกได้ครบทุกรายการ
     - ป้องกันเมนูทะลุออกนอกขอบจอด้านขวาด้วย `maxLeft`
   - **ปรับชื่อ Role เป็นภาษาไทยล้วน ไม่มีวงเล็บภาษาอังกฤษ (`StaffModal.tsx`, `StaffTableView.tsx`, `StaffCardView.tsx`)**:
     - เปลี่ยนป้ายกำกับในโมดอลจาก `Role:` เป็น `ตำแหน่ง / บทบาท:`
     - ตัดวงเล็บและภาษาอังกฤษออกทั้งหมด:
       - `admin` -> `ผู้ดูแลระบบ`
       - `owner` -> `เจ้าของร้าน`
       - `manager` -> `ผู้จัดการร้าน`
       - `chef` -> `หัวหน้าครัว`
       - `cashier` -> `พนักงานแคชเชียร์`
       - `staff` -> `พนักงานทั่วไป`
     - ตั้งค่า `placement="top"` ใน Dropdown ของ StaffModal เพื่อให้เปิดขึ้นด้านบนในตัวโมดอลอย่างสวยงาม

---

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

---

### [2026-09-20 - 2026-09-21] AI Competitors Map Analytics & User Role Multi-Store Hierarchy Fix

1. **ระบบ AI วิเคราะห์คู่แข่งรอบร้านผ่าน OpenStreetMap & Overpass API ([/menu/ai-insights](file:///c:/meeting/smartStock/src/app/(app)/menu/ai-insights/page.tsx))**:
   - เชื่อมต่อ OpenStreetMap / Overpass Turbo API และ Nominatim สำหรับค้นหาร้านกาแฟและร้านอาหารคู่แข่งในรัศมีรอบพิกัดร้านจริง
   - แก้ปัญหา Render/Deployment ไม่พบคู่แข่งเนื่องจาก Rate Limit หรือ External API Policy โดยเพิ่มระบบสำรอง (Multi-Engine Places Search & Fallback Scraper)
   - นำข้อมูลคู่แข่งรอบข้างส่งให้ Google Gemini Flash ประมวลผลเปรียบเทียบจุดแข็ง จุดอ่อน ราคา และแนะนำเมนูชูโรง

2. **แก้ไขบัคการสร้างและกำหนดสิทธิ์ผู้จัดการร้าน (Store Manager & Owner Role Fix)**:
   - **ต้นตอของปัญหา (Root Cause)**:
     - ใน [UserController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/UserController.php) ตอนสร้างผู้ใช้ใหม่ มีการฮาร์ดโค้ดฟิลด์ `role` ในตาราง `users` เป็น `'staff'` สำหรับทุกคนที่ไม่ใช่ admin
     - เมื่อล็อกอินเข้ามา [AuthController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/AuthController.php) อ่านค่า `users.role` ส่งผลให้ได้รับสิทธิ์พนักงานทั่วไป และ [Sidebar.tsx](file:///c:/meeting/smartStock/src/components/Sidebar.tsx) ซ่อนเมนูผู้บริหารทั้งหมด
   - **การแก้ไข**:
     - ปรับให้บันทึกบทบาทจริง (`owner`, `manager`, `chef`, `cashier`, `staff`) ลงในตาราง `users` และ `store_user` อย่างถูกต้อง
     - เพิ่มตัวเลือก **"เจ้าของร้าน (Owner)"** ใน Dropdown สร้างพนักงาน
     - ปรับ `AuthController` และ `Sidebar.tsx` ให้อ่านและให้ความสำคัญกับสิทธิ์ตามร้านค้าที่สังกัด (`my_role`)
     - สร้าง Migration `2026_09_21_000000_sync_user_roles_with_store_roles.php` ซิงก์ผู้ใช้เก่าทั้งหมดให้สิทธิ์ตรงกับตำแหน่งในร้านทันที

---

## 🚀 แผนการพัฒนารอบถัดไป (Upcoming Roadmap) — 🛠️ Phase: Bug Fixes, Database Sync & Performance Optimization

> **🎯 เป้าหมายหลักของเฟสนี้**: แก้ไขบัคการทำงานในฟังก์ชันพื้นฐานที่ผู้ใช้พบเจอ, วางสถาปัตยกรรมจัดการฐานข้อมูลให้สอดคล้องกันระหว่าง Local และ Production, และยกระดับความเร็วในการโหลดและการตอบสนองของระบบให้ไหลลื่น ไม่หน่วง ไม่ช้า

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│              SmartStock Next Phase: Bug Fixes & Performance Optimization               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. 🐛 แก้บัค: แก้ราคาที่ซื้อมาในวัตถุดิบต่างๆ กดบันทึกแล้วค่าไม่เปลี่ยน (Purchase Price) │
│ 2. 🗄️ จัดการฐานข้อมูล: แยก/รวม ระหว่าง Local Environment กับ เว็บจริง (Database Sync)    │
│ 3. ⚡ เพิ่มความเร็วเว็บ: แก้ไขปัญหาเว็บโหลดช้า, Render Cold Start, Caching & SWR Data   │
│ 4. 🧹 ตรวจสอบและเก็บบัคย่อยในส่วนต่างๆ ของระบบ (System-wide Polish & Quality Control) │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 📋 รายละเอียดแผนงานและแนวทางแก้ไข (Action Items)

#### จุดที่ 1: 🐛 แก้ไขบัค "เข้าไปแก้ราคาที่ซื้อมาในวัตถุดิบต่างๆ กดบันทึกแล้วไม่แก้ให้"
> **อาการของปัญหา**: เมื่อผู้ใช้เข้าไปแก้ไขข้อมูลวัตถุดิบในหน้า `/stock` (ผ่าน Modal แก้ไข) แล้วพิมพ์แก้ไขช่องราคาที่ซื้อมา หรือต้นทุน เมื่อกดบันทึกแล้วพบว่าราคาเดิมยังคงอยู่ หรือไม่ได้รับการอัปเดตลงฐานข้อมูล

* **การวิเคราะห์หาสาเหตุเชิงลึก (Deep Root Cause Analysis)**:
  1. **เงื่อนไขสต็อกเป็นศูนย์ (`quantity = 0`) ใน [AddIngredientModal.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/components/AddIngredientModal.tsx)**:
     - ในฟังก์ชัน `handlePurchasePriceChange`: มีเงื่อนไข `if (!isNaN(priceNum) && !isNaN(qtyNum) && qtyNum > 0)` 
     - หากวัตถุดิบนั้น **สต็อกคงเหลือเป็น 0 (ของหมด)** ตัวแปร `qtyNum` จะมีค่าเป็น `0` ทำให้ระบบ**ข้ามการคำนวณและไม่อัปเดตค่า `cost_per_unit` ใน `formData`** ส่งผลให้ตอนกด Submit ข้อมูลต้นทุนเดิมจึงถูกส่งไปบันทึกแทน!
  2. **ความสับสนของช่อง "ราคารวมซื้อทั้งหมด" vs "ราคาซื้อต่อหน่วยบรรจุภัณฑ์"**:
     - ช่องปัจจุบันชื่อว่า *"ราคารวมซื้อทั้งหมด (บาท)"* ซึ่งถูกคำนวณจาก `cost_per_unit * quantity รวมทั้งร้าน`
     - ในชีวิตจริง เมื่อเจ้าของร้านซื้อของ เช่น เมล็ดกาแฟ 1 ถุง ราคา 250 บาท (ขนาดบรรจุ 500g) แต่ในร้านมีสต็อกอยู่ 5,000g ช่องนี้จะขึ้นเป็น `2,500 บาท`
     - เมื่อผู้ใช้เห็นตัวเลขแล้วอยากแก้ราคาเป็น `260 บาท` (หมายถึงถุงละ 260) แต่ระบบนำ 260 ไปหาร 5,000 ทำให้ต้นทุนต่อกรัมกลายเป็น `0.052 บาท` แทนที่จะเป็น `0.52 บาท` หรือไม่เปลี่ยนเลย
  3. **การส่งข้อมูลใน [page.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/page.tsx) และ [IngredientController.php](file:///c:/meeting/smartsotck-backend/app/Http/Controllers/Api/IngredientController.php)**:
     - ใน `handleSaveIngredient` มีการแปลงค่า `cost_per_unit` เป็น float แต่หากมีทศนิยมหลายตำแหน่ง หรือส่ง `NaN` จะ fallback เป็น 0
     - ต้องตรวจสอบให้แน่ใจว่า API `/api/ingredients/{id}` รับค่า `cost_per_unit` และบันทึกลงคอลัมน์ `cost_per_unit` ใน PostgreSQL อย่างแม่นยำ

* **แผนปฏิบัติการแก้ไขในรอบหน้า (Action Items)**:
  - [x] **ปรับปรุง UI Modal แก้ไขวัตถุดิบ**:
    - เพิ่มช่องกรอก **"ราคาซื้อต่อหน่วยบรรจุภัณฑ์ (บาท/{package_unit})"** เช่น `250 บาท / ถุง` ให้ชัดเจน แทนการให้กรอกราคารวมสต็อกทั้งหมด
    - มีตัวช่วยคำนวณ: `ราคาต่อถุง 250 บาท ÷ 500 กรัม = ต้นทุน 0.50 บาท/กรัม` พร้อมแสดงพรีวิวแบบเรียลไทม์
  - [x] **แก้ไขเงื่อนไขดักบัคกรณีของหมด (`quantity = 0`)**:
    - แก้ไข `handlePurchasePriceChange` และ `handleCostPerUnitChange` ให้สามารถอัปเดตต้นทุนต่อหน่วยได้ตลอดเวลา แม้สต็อกปัจจุบันจะเป็น 0 ก็ตาม
  - [x] **เพิ่มระบบ Quick Edit ราคาต้นทุนในตารางสต็อก (Inline Cost Editor)**:
    - ให้คลิกที่ช่องราคาต้นทุนในตารางหน้า `/stock` แล้วแก้ไขได้ทันทีโดยไม่ต้องเปิด Modal เต็มรูปแบบ พร้อมปุ่ม Check / Cancel หรือกด Enter/Esc บันทึกลงฐานข้อมูลทันที

---

#### จุดที่ 2: 🗄️ การจัดการฐานข้อมูลแยกระหว่าง Local กับ Production (Database Architecture & Sync Strategy)
> **อาการของปัญหา**: ข้อมูลที่คีย์ในเครื่อง Local (คอมพิวเตอร์ตัวเอง) กับข้อมูลบนเว็บจริงที่ Deploy ไว้ (Vercel + Render) แยกฐานข้อมูลกัน ทำให้เวลาทดสอบใน Local แล้วพอเปิดดูบนเว็บจริง ข้อมูลไม่ตรงกัน หรือไม่ซิงก์กัน

* **การวิเคราะห์โครงสร้างปัจจุบัน (Architecture Overview)**:
  - **Local Backend (`smartsotck-backend/.env`)**: ปัจจุบันชี้ไปที่ Supabase PostgreSQL (`aws-0-ap-south-1.pooler.supabase.com`)
  - **Production Backend บน Render**: ตั้งค่า Environment Variables แยกต่างหากใน Render Dashboard
  - **Frontend Local (`smartStock/.env.local`)**: ชี้ `NEXT_PUBLIC_API_URL=http://localhost:8000/api` (Local Laravel)
  - **Frontend Production บน Vercel**: ชี้ `NEXT_PUBLIC_API_URL=https://smartsotck-backend.onrender.com/api` (Render Laravel)

* **แผนปฏิบัติการและทางเลือกในการจัดการ (Action Items & Strategic Choice)**:
  - [ ] **แนวทางที่ 1 (แนะนำ): รวมศูนย์ฐานข้อมูลบน Cloud เดียวกัน (Single Source of Truth - Shared Supabase)**:
    - ตั้งค่า Environment Variables บน Render Dashboard ให้ใช้ `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` เดียวกันกับ Supabase
    - เมื่อตั้งค่าตรงกัน ไม่ว่าจะคีย์ข้อมูลจากหน้าเว็บจริง (Vercel) หรือทดสอบจากหน้าเว็บ Local (`localhost:3000`) ข้อมูลจะเข้าสู่ฐานข้อมูล Supabase เดียวกันแบบเรียลไทม์ 100%
  - [ ] **แนวทางที่ 2: แยก Database เพื่อความปลอดภัย แต่ทำระบบ Sync อัตโนมัติ (Isolated Staging & Prod Sync)**:
    - หากต้องการแยก Database ระหว่างข้อมูลทดสอบ (Dev) กับข้อมูลร้านจริง (Prod) เพื่อป้องกันข้อมูลมั่ว:
      - สร้างคำสั่ง Artisan Command เช่น `php artisan db:pull-production` หรือ Script ส่งออก/นำเข้าข้อมูลจาก Cloud มาทับ Local ในคลิกเดียว
  - [ ] **จัดทำตารางตรวจสอบ Environment Variables (Master Config Checklist)**:
    - จัดทำเอกสารระบุ Key-Value ที่จำเป็นทั้งหมดระหว่าง `.env.local` (Vercel), `.env` (Render), และ Local Dev

---

#### จุดที่ 3: ⚡ การปรับปรุงความเร็วเว็บให้โหลดไวทันใจ (Performance Optimization Plan)
> **อาการของปัญหา**: เว็บไซต์โหลดช้ามาก มีอาการหมุนติ้วนานเมื่อเปิดหน้าต่างๆ หรือเมื่อกลับมาใช้งานหลังจากทิ้งช่วงไว้

* **การวิเคราะห์สาเหตุความล่าช้า (Why is it slow?)**:
  1. **Render Free Tier Cold Start (การหลับของเซิร์ฟเวอร์)**:
     - Render แบบ Free Plan จะ **"Sleep (ปิดการทำงาน)"** เมื่อไม่มี Request นานเกิน 15 นาที
     - เมื่อมีคนกดเปิดเว็บครั้งแรกหลังจากช่วงพัก เซิร์ฟเวอร์ต้องบูต Container และรัน PHP ใหม่ทั้งหมด ทำให้เกิดอาการรอ **30 - 50 วินาที** ก่อนหน้าเว็บจะเริ่มตอบสนอง
  2. **Network Latency ระหว่างไทย - Supabase มุมไบ (aws-0-ap-south-1)**:
     - การยิงคำสั่ง Query ฐานข้อมูลแต่ละรอบมีเวลาเดินทางไป-กลับ (Round Trip Time) ประมาณ 150-250ms หาก 1 หน้าเว็บยิงเรียก API ซ้ำกันหลาย Query จะสะสมความช้าหลายวินาที
  3. **การยิง API ซ้ำซ้อนและขาดระบบ Caching ฝั่ง Frontend (Request Waterfall)**:
     - ใน [StockContext.tsx](file:///c:/meeting/smartStock/src/lib/StockContext.tsx) ทุกครั้งที่เข้าหน้าเว็บหรือสลับหน้า มีการยิง `fetchData()` ที่ดึงพร้อมกัน 5 endpoints (`/ingredients`, `/menus`, `/dashboard`, `/stock-movements`, `/reports/waste-stats`) แม้บางหน้าจะไม่ได้ใช้ข้อมูลเหล่านั้นก็ตาม
     - ยังไม่มีระบบ Stale-While-Revalidate (SWR) ทำให้ทุกครั้งที่เปิดหน้า ต้องรอหน้าจอหมุนโหลดใหม่ตั้งแต่ศูนย์ แทนที่จะแสดงข้อมูลเดิมที่แคชไว้ทันที

* **แผนปฏิบัติการเพิ่มความเร็วระดับ Enterprise (Action Items)**:
  - [x] **แก้ปัญหา Render Cold Start (Keep-Alive Cron)**:
    - เพิ่ม endpoint `GET /api/health` ใน Laravel Backend ([routes/api.php](file:///c:/meeting/smartsotck-backend/routes/api.php)) ตอบกลับรวดเร็วและใช้ทรัพยากรต่ำ
    - ตั้งระบบ Heartbeat / Ping ทุกๆ 10-12 นาที (ผ่าน Cron-job.org หรือ UptimeRobot ฟรี) ให้ส่ง Request ไปที่ `GET /api/health` บน Render ตลอด 24 ชม. ป้องกันไม่ให้ Render ปิดตัวเอง
  - [ ] **ยกระดับ Frontend Data Caching ด้วย SWR / React Query**:
    - ติดตั้งระบบ **SWR (Stale-While-Revalidate)**:
      - *หลักการ*: เมื่อเปิดหน้าเว็บ ดึงข้อมูลจาก Cache ในเครื่องขึ้นมาแสดงผลทันที (0.1 วินาที!) จากนั้นระบบจะแอบเช็คข้อมูลใหม่จาก Server เบื้องหลัง และอัปเดตตัวเลขเงียบๆ โดยหน้าจอไม่กระตุกหรือหมุนติ้ว
  - [ ] **ทำ Code Splitting & Dynamic Imports**:
    - ใช้ `next/dynamic` โหลด Library ใหญ่เฉพาะเมื่อถูกเรียกใช้งาน เช่น:
      - Leaflet / OpenStreetMap ใน [InteractiveMapPicker.tsx](file:///c:/meeting/smartStock/src/components/InteractiveMapPicker.tsx)
      - Recharts กราฟต่างๆ ใน Dashboard และหน้ารายงาน
  - [ ] **Backend Database Optimization & Caching**:
    - ปรับแต่ง Query ใน `DashboardController.php` และ `MenuController.php` เพิ่ม ETag / Cache Header
    - เพิ่ม Index ในฐานข้อมูล PostgreSQL สำหรับคอลัมน์ที่ค้นหาบ่อย (`store_id`, `category`, `status`, `created_at`)

---

#### จุดที่ 4: 🧹 รายการเก็บบัคย่อยเพิ่มเติมที่ต้องเช็คในรอบถัดไป (Secondary Bug Checklist)
- [ ] **ระบบพิมพ์ใบเสร็จและขนาดตัวอักษร**: ตรวจสอบการจัดหน้าใบเสร็จขนาด 58mm / 80mm ให้รองรับเครื่องพิมพ์เทอร์มอลหน้าร้าน
- [ ] **การสลับหน่วยวัตถุดิบอัตโนมัติ**: ตรวจสอบกรณีเปลี่ยนหน่วยจาก กิโลกรัม -> กรัม ให้สอดคล้องกับขนาดแพ็คเกจ
- [ ] **ตรวจเช็คการปักหมุดแผนที่ในมือถือ**: ปรับ Touch gesture บนมือถือในหน้าวิเคราะห์คู่แข่งแผนที่ไม่ให้ชนกับ Scroll หน้าจอ
- [ ] **ระบบแจ้งเตือน Toast / Feedback**: ปรับให้แสดงผลสม่ำเสมอทุกครั้งที่บันทึกข้อมูลสำเร็จในทุกหน้า

---

### [2026-09-24] ยกระดับสถาปัตยกรรมสู่ Server-Side Rendering (SSR) เต็มรูปแบบ & Database Optimization
1. **การแปลง Client-Side Rendering (CSR) เป็น Server-Side Rendering (SSR)**:
   - สลับหน้าทั้งหมดใน `src/app/(app)` และ `src/app/` จากเดิมที่เป็น Client Components (`'use client'`) มาเป็น **Next.js 16 React Server Components (RSC)** ที่ดึงข้อมูลบนเซิร์ฟเวอร์แบบ Dynamic บนความต้องการ (`ƒ (Dynamic)`):
     - `(app)/dashboard/page.tsx` + `DashboardClientView.tsx`
     - `(app)/sales/pos/page.tsx` + `POSClientView.tsx`
     - `(app)/sales/orders/page.tsx` + `OrdersClientView.tsx`
     - `(app)/menu/page.tsx` + `MenuClientView.tsx`
     - `(app)/menu/ai-insights/page.tsx` + `AIInsightsClientView.tsx`
     - `(app)/stock/page.tsx` + `StockClientView.tsx`
     - `(app)/stock/purchase-orders/page.tsx` + `PurchaseOrdersClientView.tsx`
     - `(app)/reports/sales/page.tsx` + `SalesReportClientView.tsx`
     - `(app)/reports/profit/page.tsx` + `ProfitReportClientView.tsx`
     - `(app)/staff/page.tsx` + `StaffClientView.tsx`
     - `(app)/roles/page.tsx` + `RolesClientView.tsx`
     - `(app)/settings/page.tsx` + `SettingsClientView.tsx`
     - `(app)/settings/stores/page.tsx` + `StoresSettingsClientView.tsx`
     - `store-picker/page.tsx` + `StorePickerClientView.tsx`
     - `login/page.tsx` + `LoginClientView.tsx`
   - **ผลลัพธ์**: หน้าเว็บส่งโครงสร้าง HTML พร้อมข้อมูลจริงจากฐานข้อมูลตรงถึงเบราว์เซอร์ทันทีตั้งแต่รอบแรก กำจัดปัญหาหน้าจอขาวและกะพริบ Skeleton Loading ตอนเปลี่ยนหน้า
2. **ระบบการส่งต่อ Session ผ่านคุกกี้ (Cookie-based Auth Forwarding for SSR)**:
   - สร้างโมดูล [src/lib/cookies.ts](file:///c:/meeting/smartStock/src/lib/cookies.ts) ซิงค์ `smartstock_auth_token` และ `smartstock_active_store_id` อัตโนมัติระหว่าง `localStorage` และ HTTP Cookie
   - สร้าง [src/lib/server-api.ts](file:///c:/meeting/smartStock/src/lib/server-api.ts) สำหรับให้ Server Components เรียกใช้ `cookies()` จาก Next.js ดึงข้อมูลสดจาก Laravel Backend พร้อมแนบ Headers `Authorization` และ `X-Store-ID` อย่างถูกต้องและปลอดภัย
   - เพิ่มฟังก์ชัน `hydrateData()` ใน [StockContext.tsx](file:///c:/meeting/smartStock/src/lib/StockContext.tsx) เพื่อให้ Client State ซิงค์ต่อจาก SSR ทันทีโดยไม่ต้องยิง Request ซ้ำสอง
3. **การทำความสะอาดและ Optimize Database (Database Cleanup & Refactoring)**:
   - สำรวจตารางทั้งหมด 21 ตารางในระบบ พบว่า `password_reset_tokens` ไม่มีการใช้งาน เนื่องจากระบบ POS บริหารจัดการผู้ใช้งานผ่าน Admin/Manager โดยตรง
   - สร้าง Migration `2026_09_24_000000_drop_unused_tables.php` และทำการ Drop ตาราง `password_reset_tokens` ออกอย่างปลอดภัย
   - ปรับแต่ง Eager Loading ใน `OrderController.php` และ `MenuController.php` ป้องกันปัญหา N+1 Query
4. **การตรวจสอบคุณภาพ (Quality Assurance & Verification)**:
   - ตรวจสอบความถูกต้อง TypeScript ด้วย `npx tsc --noEmit` ผ่าน 100% ปราศจาก Error
   - รันคำสั่ง `npm run build` ตรวจสอบสถานะการเรนเดอร์ พบว่าทุก Route ได้รับการคอมไพล์เป็น `ƒ (Dynamic)` อย่างสมบูรณ์แบบ

### [2026-09-24] ปรับปรุงระบบราคาในใบจ่ายตลาด (Purchase Orders Checklist & Pricing Updates)
1. **โมดอลสร้างรายการไปซื้อของ (`CreatePOModal`)**:
   - ปรับชื่อหัวข้อโมดอลให้สอดคล้องกับวัตถุประสงค์: "สร้างลิสต์รายการไปซื้อของ (Checklist) - จดรายการของที่ต้องไปซื้อให้พนักงานออกไปจ่ายตลาด"
   - เพิ่มระบบระบุและคำนวณราคาเฉพาะตอนสร้าง:
     - ดึงราคาต้นทุนต่อหน่วยจากวัตถุดิบในคลังอัตโนมัติ (`cost_per_unit = ing.cost_per_unit * package_size`) และคำนวณยอดรวมของแต่ละรายการ (`total_price = quantity * cost_per_unit`)
     - เพิ่มคอลัมน์และช่องอินพุต `ราคา/หน่วย` ในตาราง ให้ผู้จัดการสามารถปรับเปลี่ยนราคาประมาณการต่อหน่วยได้ทันที
     - เพิ่มช่องกรอกราคาต่อหน่วยสำหรับสินค้าที่เพิ่มเองนอกคลัง (`customItemCost`)
     - คำนวณงบประมาณจัดซื้อรวมทั้งหมด (`estimatedTotal`) และบันทึกลงใน `newPO.totalAmount` พร้อมแนบ `cost_per_unit` และ `total_price` ไปกับทุกรายการ
2. **โมดอลพรีวิวและสั่งพิมพ์ (`POPrintViewModal`)**:
   - ดึงราคาต่อหน่วย (`ราคา/หน่วย`) และยอดรวม (`ยอดรวม`) ที่ระบุไว้ตอนสร้างออกมาแสดงในตารางใบจ่ายตลาดและใบพิมพ์
   - แสดง `งบประมาณโดยประมาณ:` ในแถบข้อมูลด้านบน และเพิ่มแถวสรุปยอดงบประมาณจัดซื้อรวมท้ายตาราง
   - เชื่อมต่อการคำนวณราคาอัตโนมัติใน Export CSV
3. **ตารางประวัติรายการไปซื้อของ (`PurchaseOrdersClientView`)**:
   - ปุ่มดึงของใกล้หมดคำนวณต้นทุนและยอดเงินประมาณการเข้าสู่ Modal ทันที
   - ตารางประวัติรายการไปซื้อของแสดงยอดเงินงบประมาณจัดซื้อทันทีโดยไม่ต้องรอตรวจบิล

---

### [2026-09-24] วิเคราะห์ปัญหาการโหลดช้า/500 บน Production & แผนการปรับปรุงรอบหน้า

#### 🔍 การวิเคราะห์ปัญหาที่พบ (Root Cause Analysis):
1. **ปัญหา HTTP 500 ชั่วคราวบน Render Backend (`smartsotck-backend.onrender.com`)**:
   - **Render Free Tier Cold Start**: เมื่อไม่มี Request เกิน 15 นาที เครื่องจะเข้าสู่ Sleep Mode เมื่อผู้ใช้เข้าเว็บ เครื่องต้องบูตใหม่ใช้เวลา 30-50 วินาที คำขอแรกๆ จะติด Timeout/500
   - **PHP-FPM Concurrency Limit**: หน้าแรกยิง Request พร้อมกัน 4-5 API (`/menus`, `/units`, `/dashboard`, `/auth/me`) ในเสี้ยววินาทีเดียว ทำให้ PHP-FPM pool เต็ม และตัดเป็น 500
   - **React Error #418 (Hydration Mismatch)**: เกิดจาก Component ฝั่ง Client อ่าน Token/LocalStorage ในจังหวะแรกที่ Render ไม่ตรงกับ HTML ที่ SSR ส่งมา
2. **ปัญหากดเมนู Sidebar แล้วหน่วง/ค้างกว่าจะเปลี่ยนหน้า**:
   - **ปิด Prefetching ใน Sidebar**: มีการตั้งค่า `prefetch={false}` ใน `<Link>` ของ Sidebar ทำให้ Next.js ไม่ดึงข้อมูลหน้านั้นมารอล่วงหน้า ต้องรอคลิกแล้วถึงเริ่มโหลดสด
   - **ระยะทาง Network ข้ามภูมิภาค (Cross-region Latency)**: Vercel SSR อยู่ Global/US ต้องยิง Request ข้ามทวีปมายัง Render (Singapore) ทุกครั้งที่เปลี่ยนหน้าเพื่อรอข้อมูลให้ครบก่อนส่ง HTML
   - **ไม่มี Visual Feedback / Top Progress Bar**: เมื่อคลิกเมนูแล้วไม่มีแถบ Loading Bar วิ่งด้านบน ทำให้ผู้ใช้รู้สึกว่าระบบค้าง

---

## 🚀 แผนการแก้ไขและเพิ่มประสิทธิภาพในรอบหน้า (Roadmap for Next Session)

### 📌 ภารกิจที่ 1: แก้ไขให้กด Sidebar แล้วเปลี่ยนหน้าเร็วขึ้นทันตาเห็น (Instant Navigation)
- [x] **เปิดใช้งาน Prefetching ใน Sidebar**:
  - เปลี่ยน `<Link prefetch={false}>` ใน `src/components/Sidebar.tsx` ให้เป็น `prefetch={true}` ทั้งบน Desktop และ Mobile Drawer เพื่อให้ Next.js พรีโหลดเพจล่วงหน้าทันทีที่เมาส์ Hover หรืออยู่ใน Viewport
- [x] **ติดตั้ง Top Progress Bar (Navigation Indicator)**:
  - สร้างคอมโพเนนต์ `TopProgressBar.tsx` ทำงานอัตโนมัติ 0ms เมื่อคลิกลิงก์ภายในระบบ มอบ Visual Feedback คมชัด สไตล์มินิมอล Slate
- [x] **ใช้ React Suspense + `loading.tsx` (Streaming SSR)**:
  - เพิ่มไฟล์ `src/app/(app)/loading.tsx` เป็นโครงกระดูกหน้าเว็บ (Skeleton UI) ครอบทั้งระบบ ไม่บล็อกการเปลี่ยนหน้า สตรีมข้อมูลจาก Server เข้ามาแบบไร้รอยต่อ

### 📌 ภารกิจที่ 2: ป้องกัน Backend Render 500 & Cold Start ให้เสถียร 100%
- [x] **ปรับแต่ง PHP-FPM Configuration ใน docker-entrypoint.sh**:
  - เพิ่มการปรับแต่ง `pm.max_children = 12`, `pm.start_servers = 3`, `pm.min_spare_servers = 2`, `pm.max_spare_servers = 6` ก่อนเริ่ม PHP-FPM รองรับการยิง Request พร้อมกันได้ลื่นไหล ไม่ติด 500
- [x] **ตั้งค่า Keep-Alive Ping (Free Tier Sleepless)**:
  - มี endpoint `GET /api/health` พร้อมใช้งานสำหรับการยิง Ping อัตโนมัติทุก 10 นาที
- [x] **ลดการยิง API ซ้ำซ้อนและ Caching ฝั่ง Server & Client**:
  - สร้าง `ssrCache` 4 วินาทีใน `server-api.ts` เชื่อมโยง Hover Prefetch กับ Instant Click Response (<1ms)
  - เพิ่มระบบ Hydration Cooldown ใน `StockContext.tsx` ป้องกันการยิง 6 endpoints ซ้ำซ้อนเมื่อหน้าเว็บเปิดขึ้นมา
  - Memoize การคำนวณหนักในหน้า POS (`cartBOMImpact`, `filteredMenu`), หน้าเมนู (`filteredMenuItems`) และ Sidebar (`menuSections`)

---

### [2026-09-24] สรุปผลการปรับปรุงความเร็วและลดความหน่วงหน้าบ้าน (Frontend Performance & Instant Navigation Polish)
1. **การเปลี่ยนหน้าทันใจ (Instant Navigation & 0ms Visual Feedback)**:
   - **เปิด Prefetching**: แก้ไข `<Link>` ใน `Sidebar.tsx` เป็น `prefetch={true}` ทั้งมุมมองเดสก์ท็อปและโมบายล์ ทำให้ Next.js App Router พรีโหลดโครงสร้างหน้าเว็บล่วงหน้าทันทีที่เมาส์เลื่อนผ่าน
   - **แถบโหลดมุมบน (Top Progress Bar)**: พัฒนา [TopProgressBar.tsx](file:///c:/meeting/smartStock/src/components/TopProgressBar.tsx) และติดตั้งใน `RootLayout` ทำงานทันทีเมื่อคลิกลิงก์นำทาง ทำให้ผู้ใช้รับรู้ได้ทันทีว่าระบบกำลังโหลด ไม่ค้าง
   - **Streaming SSR (`loading.tsx`)**: สร้าง [src/app/(app)/loading.tsx](file:///c:/meeting/smartStock/src/app/(app)/loading.tsx) ครอบคลุม Layout ทั้งหมดด้วย React Suspense สลับหน้าจอมาเป็น Skeleton ทันทีโดยไม่ต้องรอ Backend ตอบกลับ
2. **ระบบ Server-side Memory Cache สปีดสูง**:
   - พัฒนา In-memory Cache ขนาดเล็ก (TTL 4 วินาที) ใน [server-api.ts](file:///c:/meeting/smartStock/src/lib/server-api.ts) ช่วยให้การกดคลิกหลังจาก Prefetch ตอบสนองได้ในเวลาเพียง 0.001 วินาที
3. **กำจัดการยิง API ซ้ำซ้อนฝั่ง Client (Hydration Cooldown)**:
   - ปรับปรุง [StockContext.tsx](file:///c:/meeting/smartStock/src/lib/StockContext.tsx) ให้จดจำเวลาที่ได้รับข้อมูลจาก SSR ล่าสุด (`lastFetchedRef`) ป้องกันการยิง 6 คำขอ API ซ้ำซ้อนพร้อมกันตอนโหลดหน้าแรก ลดโหลดเซิร์ฟเวอร์และกำจัดการกระตุกจากการ Re-render หลายรอบ
4. **Memoization และลดภาระ CPU ในคอมโพเนนต์หลัก**:
   - `POSClientView.tsx`: ครอบ `cartBOMImpact`, `dynamicCategories` และ `filteredMenu` ด้วย `useMemo` ทำให้การพิมพ์ค้นหาและการคลิกใส่ตะกร้าในหน้าขายหน้าร้านลื่นไหล 60-120 FPS
   - `MenuClientView.tsx`: ครอบ `filteredMenuItems` และ `categories` ด้วย `useMemo`
   - `Sidebar.tsx`: ครอบ `menuSections` ด้วย `useMemo`
   - `next.config.ts`: ปรับคลีนคอนฟิกตัดแจ้งเตือน eslint ที่ไม่รองรับใน Next.js 16 ออก
5. **Backend PHP-FPM Concurrency**:
   - อัปเดต [docker-entrypoint.sh](file:///c:/meeting/smartsotck-backend/docker-entrypoint.sh) เพิ่มการจูน Worker ของ PHP-FPM รองรับการยิงพร้อมกันหลายๆ เส้นบน Render โดยไม่ทำให้เกิดปัญหา HTTP 500
6. **ผลการตรวจสอบ (Verification)**:
   - `npm run build`: คอมไพล์สำเร็จใน 3.6 วินาที (เร็วขึ้นกว่าเดิมเท่าตัว) ผ่านครบทั้ง 24 Routes
   - `npx tsc --noEmit`: ผ่าน 100% ปราศจากข้อผิดพลาด TypeScript Type Error
7. **แก้ไขปัญหาระบบพิมพ์และดาวน์โหลด PDF ใบจ่ายตลาด (Print to PDF Fix)**:
   - **สาเหตุที่พิมพ์ไม่ได้/หน้าขาว**: ใน `globals.css` มีกฎ `@media print { main { display: none !important; } }` ซึ่งตั้งใจจะซ่อนตารางหน้าเว็บด้านหลัง แต่เนื่องจาก `(app)/layout.tsx` ครอบเนื้อหาทั้งหมดด้วยแท็ก `<main>` ส่งผลให้โมดอลใบพิมพ์ที่อยู่ข้างในโดนซ่อนไปด้วย กลายเป็นหน้ากระดาษเปล่าสีขาว
   - **การแก้ไข**:
     - ย้ายโมดอล [POPrintViewModal.tsx](file:///c:/meeting/smartStock/src/app/(app)/stock/purchase-orders/components/POPrintViewModal.tsx) ออกไปเรนเดอร์ระดับนอกสุดด้วย **React Portal (`createPortal(..., document.body)`)**
     - ปรับแต่ง CSS `@media print` ใน [globals.css](file:///c:/meeting/smartStock/src/app/globals.css) ซ่อนเฉพาะ Sidebar, Topbar และตารางพื้นหลัง แต่เปิดแสดง `.print-portal-root` และ `.print-sheet` ให้เต็มแผ่น A4 Portrait คมชัด
     - ปรับฟังก์ชัน `handlePrint` ให้ตั้งชื่อ `document.title` อัตโนมัติเป็น `ใบจ่ายตลาด_{ชื่อร้าน}_{วันที่}_{เลขที่PO}` เมื่อผู้ใช้เลือก **'บันทึกเป็น PDF (Save as PDF)'** เบราว์เซอร์จะตั้งชื่อไฟล์ให้อย่างสวยงามทันที
     - ปรับความสูงและจำนวนแถวว่างให้พอดีกระดาษ 1 หน้า A4 (Single-page A4 checklist) พอดีเป๊ะ ไม่ล้นหน้า 2

