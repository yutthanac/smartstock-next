---
name: SmartStock
description: ระบบจัดการสต็อกและจุดขาย (POS) อัจฉริยะ ดีไซน์สไตล์ Cafe Minimalist โทนขาว-ดำ พร้อมสำเนียงไม้อบอุ่น (Warm Wood & Espresso) ระบบ 60-30-10
colors:
  primary: "#1c1917"
  primary-hover: "#292524"
  primary-light: "#f5efe6"
  accent-wood: "#78350f"
  accent-amber: "#b45309"
  neutral-bg: "#faf9f5"
  surface-card: "#ffffff"
  surface-card-subtle: "#f9f8f5"
  border-subtle: "#e7e5e4"
  border-muted: "#d6d3d1"
  text-main: "#1c1917"
  text-muted: "#57534e"
  text-subtle: "#78716c"
  badge-wood-bg: "#f5efe6"
  badge-wood-text: "#78350f"
  badge-rose-bg: "#fef2f2"
  badge-rose-text: "#991b1b"
typography:
  display:
    fontFamily: "var(--font-noto-thai), var(--font-noto-sans), sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "var(--font-noto-thai), var(--font-noto-sans), sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "var(--font-noto-thai), var(--font-noto-sans), sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "var(--font-noto-thai), var(--font-noto-sans), sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "var(--font-noto-thai), var(--font-noto-sans), sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "#1c1917"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.surface-card-subtle}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card-raised:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: SmartStock (Cafe Minimalist Edition)

## Overview

**Creative North Star: "Artisan Cafe & Roastery Dashboard"**

SmartStock ใช้แนวคิดการออกแบบสไตล์ Cafe Minimalist & Specialty Coffee House ผสมผสานความประณีตของงานพิมพ์ สมุดบันทึกสูตรชง และบรรยากาศอบอุ่นของเคาน์เตอร์กาแฟ ตัดความรู้สึก "AI Dashboard สำเร็จรูป" (No generic colorful pastel bubbles) ทิ้งไปอย่างสิ้นเชิง

**Key Principles:**
- **Cafe Monochrome + Warm Wood (60-30-10 Rule)**:
  - **60% Dominant Canvas**: พื้นหลังโทนกระดาษนวลตา Warm Paper Cream (`#faf9f5`) สบายตา ไม่สว่างจ้า
  - **30% Structure & Contrast**: การ์ดขาวบริสุทธิ์ (`#ffffff`), เส้นขอบหินอุ่น (`#e7e5e4`), ตัวอักษรสีถ่านเอสเปรสโซเข้ม (`#1c1917`) และสีหินอ่านง่าย (`#57534e`)
  - **10% Warm Wood Accent**: สำเนียงไม้ธรรมชาติ (Rich Timber / Walnut `#78350f`, Caramel Amber `#b45309`) ใช้กับป้าย Margin, แท็กไฮไลต์ และจุดเน้นสำคัญ
- **Unified Thai Typography**: ทุกข้อความภาษาไทยแสดงผลด้วย `Noto Sans Thai` ที่มีความสม่ำเสมอเท่าเทียมกัน ไม่ถูกคลุมด้วย monospace font ที่ทำให้ฟอนต์ไทยเพี้ยนเป็นพิมพ์ดีด
- **Architectural Tactile Icon Wells**: ไอคอนทุกตัวอยู่ในกรอบหลุมหินเรียบหรู (`bg-stone-100 border border-stone-200/80 text-stone-700`) ไร้พื้นหลังสีลูกกวาด/สีพาสเทลแบบ AI template

## Colors

ระบบ 60-30-10:

### 60% Canvas & Neutral
- **Cafe Paper Canvas** (`#faf9f5`): พื้นหลังอุ่นสบายตา
- **Card Surface** (`#ffffff`): การ์ดสีขาวสะอาดตา ตัดขอบบาง
- **Subtle Stone Border** (`#e7e5e4`): เส้นขอบสีหินธรรมชาติ

### 30% Structure & Typography
- **Espresso Charcoal** (`#1c1917`): สีตัวหนังสือหลัก ยอดขาย และปุ่ม Action
- **Warm Stone Text** (`#57534e`): สีคำอธิบาย หัวข้อรอง และหน่วยนับ
- **Muted Stone** (`#78716c`): สีข้อความกำกับ

### 10% Warm Wood & Accents
- **Rich Timber Wood** (`#78350f`): สีไม้ธรรมชาติสำหรับ Margin กำไร และความสำเร็จ
- **Caramel Oak Badge** (`#f5efe6`): พื้นหลังป้ายไม้ละมุนตา
- **Deep Crimson Alert** (`#991b1b` / `#fef2f2`): สีแดงเครื่องคั่วกาแฟสำหรับเตือนสต็อกด่วน ไม่ใช้สีชมพูนีออน

## Typography Hierarchy

- **Hero Numbers** (Bold/Black 800, 48px–72px): ตัวเลขยอดขายประจำวันกึ่งกลางการ์ดใหญ่
- **Section Headline** (Semi-bold 600, 18px–20px): หัวข้อกราฟ ตาราง
- **Card Title** (Semi-bold 600, 14px–16px): ชื่อตัวชี้วัด (เช่น ยอดขายวันนี้, ต้นทุนวัตถุดิบวันนี้)
- **Body / Units** (Medium 500, 14px): เนื้อหาข้อมูล ตาราง และหน่วยนับ (แก้ว, รายการ, บิล)

## Anti-Patterns Ban

- **ห้าม** ใส่พื้นหลังสีพาสเทลสายรุ้ง (ชมพู ฟ้า เหลือง เขียว อ่อน) ให้กับไอคอน
- **ห้าม** ใช้ class `font-mono` ครอบข้อความภาษาไทย (เช่น `0 รายการ`) เพราะจะทำให้ Windows แสดงผลฟอนต์ไทยกระตุกหรือเพี้ยนเป็นตัวหนังสือโบราณ
- **ห้าม** ใช้ขนาดตัวหนังสือเล็กกว่า 12px สำหรับข้อความสำคัญที่ผู้ใช้ต้องอ่าน
