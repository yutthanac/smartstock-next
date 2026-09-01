'use client';

import React from 'react';
import { Settings as SettingsIcon, Save, Store, Database, Shield, Sliders } from 'lucide-react';
import { Topbar } from '@/components/Topbar';

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar title="ตั้งค่าระบบ (System Settings)" subtitle="กำหนดค่าร้านค้า ภาษี VAT และการเชื่อมต่อ Laravel API" />

      <main className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Store Settings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-[#4fb0a5]" />
            <h3 className="font-bold text-slate-900 text-base">ข้อมูลร้านอาหาร</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">ชื่อร้านอาหาร</label>
              <input
                type="text"
                defaultValue="Smart Gourmet & Bistro"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">สาขา</label>
              <input
                type="text"
                defaultValue="สาขาหลัก (Main Kitchen)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">อัตราภาษีมูลค่าเพิ่ม (VAT %)</label>
              <input
                type="number"
                defaultValue="7"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                defaultValue="02-123-4567"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Backend API Configuration */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-[#4fb0a5]" />
            <h3 className="font-bold text-slate-900 text-base">การเชื่อมต่อ Backend (Laravel API)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Laravel API Endpoint (NEXT_PUBLIC_API_URL)</label>
              <input
                type="text"
                defaultValue="http://localhost:8000/api"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                เชื่อมต่อ Laravel REST API บน Laragon (เช่น http://stockapp.test/api หรือ http://localhost:8000/api)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-center justify-between">
              <span>สถานะเชื่อมต่อ: พร้อมใช้งาน (โหมด Local Client-Side Cache & Fallback เปิดใช้งานอยู่)</span>
              <span className="font-bold">Online</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button className="px-5 py-2.5 rounded-xl bg-[#12312d] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#1a423d]">
              <Save className="w-4 h-4" /> บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
